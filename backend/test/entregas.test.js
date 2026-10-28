const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const jwt = require('jsonwebtoken');
const createApp = require('../app');
const { validarEntrega, validarPago, validarMonto } = require('../src/services/EntregaService');
const { createEntregaRepository } = require('../src/repositories/EntregaRepository');

const propio = { id: 7, chofer_id: 3, estado: 'EN ENVÍO', estado_validacion: 'CONFIRMADA', importe_base: '20.50', importe_total: '20.50', recargo_total: '0.00', intentos_fallidos: 0 };
const operacion = 'c1f45a2d-7e45-4c72-9107-f12345678901';
test('entrega y fallo: pertenencia, estado y confirmación vigentes', () => {
    validarEntrega(propio, '3', 'ENTREGADO');
    validarEntrega(propio, 3, 'FALLIDA');
    assert.throws(() => validarEntrega(propio, 4, 'ENTREGADO'), e => e.statusCode === 404);
    assert.throws(() => validarEntrega(null, 3, 'FALLIDA'), e => e.statusCode === 404);
    assert.throws(() => validarEntrega({ ...propio, estado_validacion: 'VALIDA' }, 3, 'ENTREGADO'), e => e.statusCode === 409);
    for (const estado of ['EN STOCK', 'EN PREPARACIÓN', 'PAGADO']) {
        assert.throws(() => validarEntrega({ ...propio, estado }, 3, 'FALLIDA'), e => e.statusCode === 409);
        assert.throws(() => validarEntrega({ ...propio, estado }, 3, 'ENTREGADO'), e => e.statusCode === 409);
    }
});
test('pago: sólo después de entregar, montos decimales positivos sin redondear entradas inválidas', () => {
    validarPago({ ...propio, estado: 'ENTREGADO' }, 3);
    assert.throws(() => validarPago(propio, 3), e => e.statusCode === 409);
    assert.throws(() => validarPago({ ...propio, estado: 'ENTREGADO' }, 4), e => e.statusCode === 404);
    for (const monto of ['0', '-1', '1.005', '1e2', '', 'NaN', '10000000000', 12]) assert.throws(() => validarMonto(monto), e => e.statusCode === 400);
    assert.equal(validarMonto('12.5'), '12.50');
    assert.equal(validarMonto('9999999999.99'), '9999999999.99');
});

function fakeDb({ pedido = { ...propio }, pago = null, falla = false, activo = 1, rol = 'CHOFER' } = {}) {
    const historial = [];
    const llamadas = [];
    let respaldo;
    const c = {
        async beginTransaction() { respaldo = { estado: pedido?.estado, pago, largo: historial.length }; llamadas.push('begin'); },
        async commit() { llamadas.push('commit'); },
        async rollback() { if (pedido) pedido.estado = respaldo.estado; pago = respaldo.pago; historial.length = respaldo.largo; llamadas.push('rollback'); },
        release() { llamadas.push('release'); },
        async query(sql, v) {
            llamadas.push(sql);
            if (sql.includes('FROM pedidos')) return [pedido ? [{ ...pedido }] : []];
            if (sql.includes('FROM usuarios')) return [[{ id: 3, rol, activo }]];
            if (sql.includes('LEFT(observaciones')) return [historial.filter(h => h.usuario_id === v[1] && h.observaciones.startsWith(v[3]))];
            if (sql.startsWith('UPDATE pedidos')) {
                pedido.estado = v[0];
                if (sql.includes('intentos_fallidos=')) { pedido.intentos_fallidos = v[1]; pedido.recargo_total = v[2]; }
                return [{}];
            }
            if (sql.includes('INSERT INTO historial')) {
                if (falla) throw new Error('fallo historial sintético');
                historial.push({ estado_anterior: v[1], estado_nuevo: v[2], usuario_id: v[3], observaciones: v[4] }); return [{}];
            }
            if (sql.includes('FROM pagos')) return [[pago].filter(Boolean)];
            if (sql.includes('INSERT INTO pagos')) { pago = { id: 1, metodo: v[1], monto: v[2], registrado_por: v[3] }; return [{ insertId: 1 }]; }
            throw new Error(`Consulta inesperada en fake: ${sql}`);
        },
    };
    return { llamadas, historial, pedido, get pago() { return pago; }, async getConnection() { return c; }, query: c.query };
}
test('entrega/fallo: un solo historial al reintentar y falla vuelve a preparación', async () => {
    for (const resultado of ['ENTREGADO', 'FALLIDA']) {
        const db = fakeDb();
        const repo = createEntregaRepository(db);
        const datos = { resultado, operacion_id: operacion, motivo: 'No responde' };
        await repo.registrar(7, 3, datos, validarEntrega);
        const repetido = await repo.registrar(7, 3, datos, validarEntrega);
        assert.equal(repetido.repetido, true);
        assert.equal(db.historial.length, 1);
        assert.equal(db.pedido.estado, resultado === 'ENTREGADO' ? 'ENTREGADO' : 'EN PREPARACIÓN');
        assert.equal(db.historial[0].usuario_id, 3);
        assert.equal(db.historial[0].estado_anterior, 'EN ENVÍO');
        assert.ok(db.llamadas.some(q => q.includes('FOR UPDATE')));
        if (resultado === 'FALLIDA') {
            await assert.rejects(() => repo.registrar(7, 3, { ...datos, motivo: 'Otra cosa' }, validarEntrega), e => e.statusCode === 409);
            // Reenvío tardío después de un nuevo despacho no cambia otra vez el estado.
            db.pedido.estado = 'EN ENVÍO';
            await repo.registrar(7, 3, datos, validarEntrega);
            assert.equal(db.pedido.estado, 'EN ENVÍO');
        }
    }
});
test('pago: mismo registro idempotente, no sobrescribe ni cambia a PAGADO', async () => {
    const db = fakeDb({ pedido: { ...propio, estado: 'ENTREGADO' } });
    const repo = createEntregaRepository(db);
    const datos = { metodo: 'TRANSFERENCIA' };
    await repo.pago(7, 3, datos, validarPago);
    assert.equal((await repo.pago(7, 3, datos, validarPago)).repetido, true);
    assert.equal(db.historial.length, 1);
    assert.equal(db.pedido.estado, 'ENTREGADO');
    await assert.rejects(() => repo.pago(7, 3, { metodo: 'EFECTIVO' }, validarPago), e => e.statusCode === 409);
    assert.equal(db.pago.monto, '20.50');
});
test('fallo al guardar historial revierte entrega y pago; usuario inactivo no escribe', async () => {
    const datos = { resultado: 'ENTREGADO', operacion_id: operacion };
    const db = fakeDb({ falla: true });
    await assert.rejects(() => createEntregaRepository(db).registrar(7, 3, datos, validarEntrega));
    assert.equal(db.pedido.estado, 'EN ENVÍO');
    assert.deepEqual(db.llamadas.slice(-2), ['rollback', 'release']);
    const dbPago = fakeDb({ pedido: { ...propio, estado: 'ENTREGADO' }, falla: true });
    await assert.rejects(() => createEntregaRepository(dbPago).pago(7, 3, { metodo: 'EFECTIVO', monto: '2.00' }, validarPago));
    assert.equal(dbPago.pago, null);
    const inactivo = fakeDb({ activo: 0 });
    await assert.rejects(() => createEntregaRepository(inactivo).registrar(7, 3, datos, validarEntrega), e => e.statusCode === 403);
    assert.equal(inactivo.historial.length, 0);
});

test('efectivo confirma PAGADO atómicamente y reintento no duplica cobro ni historial', async () => {
    const db = fakeDb({ pedido:{...propio,estado:'ENTREGADO'} });
    const repo = createEntregaRepository(db);
    assert.equal((await repo.pago(7,3,{metodo:'EFECTIVO'},validarPago)).estado_pedido,'PAGADO');
    await repo.pago(7,3,{metodo:'EFECTIVO'},validarPago);
    assert.equal(db.pedido.estado,'PAGADO');assert.equal(db.historial.length,1);
    assert.equal(db.historial[0].estado_nuevo,'PAGADO');
    const falla = fakeDb({pedido:{...propio,estado:'ENTREGADO'},falla:true});
    await assert.rejects(()=>createEntregaRepository(falla).pago(7,3,{metodo:'EFECTIVO'},validarPago));
    assert.equal(falla.pedido.estado,'ENTREGADO');assert.equal(falla.pago,null);
});

test('acreditación: sólo admin activo, transferencia existente, estado válido e idempotencia', async () => {
    const pago = {id:1,metodo:'TRANSFERENCIA',monto:'20.50'};
    const db = fakeDb({pedido:{...propio,estado:'ENTREGADO'},pago,rol:'ADMINISTRADOR'});
    const repo = createEntregaRepository(db);
    await repo.acreditar(7,3);await repo.acreditar(7,3);
    assert.equal(db.pedido.estado,'PAGADO');assert.equal(db.historial.length,1);
    for(const rol of ['CHOFER','OPERADOR']) await assert.rejects(()=>createEntregaRepository(fakeDb({pago,rol})).acreditar(7,3),e=>e.statusCode===403);
    await assert.rejects(()=>createEntregaRepository(fakeDb({pago,rol:'ADMINISTRADOR',activo:0})).acreditar(7,3),e=>e.statusCode===403);
    for(const existente of [null,{...pago,metodo:'EFECTIVO'}]) await assert.rejects(()=>createEntregaRepository(fakeDb({pedido:{...propio,estado:'ENTREGADO'},pago:existente,rol:'ADMINISTRADOR'})).acreditar(7,3),e=>e.statusCode===409);
    await assert.rejects(()=>createEntregaRepository(fakeDb({pago,rol:'ADMINISTRADOR'})).acreditar(7,3),e=>e.statusCode===409);
    const falla = fakeDb({pedido:{...propio,estado:'ENTREGADO'},pago,rol:'ADMINISTRADOR',falla:true});
    await assert.rejects(()=>createEntregaRepository(falla).acreditar(7,3));
    assert.equal(falla.pedido.estado,'ENTREGADO');assert.equal(falla.historial.length,0);
});

test('HTTP acreditar: 401/403, cuerpo estricto y confirmación idempotente sólo administrador', async () => {
    const db=fakeDb({pedido:{...propio,estado:'ENTREGADO'},pago:{id:1,metodo:'TRANSFERENCIA',monto:'20.50'},rol:'ADMINISTRADOR'});
    const server=createApp({db,config:{jwt:{secret:'secreto-sintetico'},geocode:{}}}).listen(0,'127.0.0.1');
    await once(server,'listening');
    const pedir=(rol,body={})=>fetch(`http://127.0.0.1:${server.address().port}/api/asignaciones/7/acreditar-pago`,{method:'PUT',headers:{'content-type':'application/json',...(rol?{authorization:`Bearer ${jwt.sign({sub:3,rol},'secreto-sintetico')}`}:{})},body:JSON.stringify(body)});
    try{
        assert.equal((await pedir(null)).status,401);
        for(const rol of ['CHOFER','OPERADOR']) assert.equal((await pedir(rol)).status,403);
        assert.equal((await pedir('ADMINISTRADOR',{monto:'1.00'})).status,400);
        assert.equal((await pedir('ADMINISTRADOR')).status,200);
        assert.equal((await pedir('ADMINISTRADOR')).status,200);
        assert.equal(db.historial.length,1);
    }finally{server.close();await once(server,'close');}
});
test('HTTP: sesión/rol, cuerpos estrictos, motivo obligatorio, ajeno y pago prematuro', async () => {
    const db = fakeDb();
    const server = createApp({ db, config: { jwt: { secret: 'secreto-sintetico' }, geocode: {} } }).listen(0, '127.0.0.1');
    await once(server, 'listening');
    async function pedir(path, body, rol = 'CHOFER', id = 3) {
        const token = rol ? jwt.sign({ sub: id, rol }, 'secreto-sintetico') : null;
        return fetch(`http://127.0.0.1:${server.address().port}/api/chofer/pedidos/7/${path}`, {
            method: 'PUT', headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
            body: JSON.stringify(body), signal: AbortSignal.timeout(3000),
        });
    }
    const datos = { resultado: 'ENTREGADO', operacion_id: operacion };
    try {
        assert.equal((await pedir('entrega', datos, null)).status, 401);
        for (const rol of ['OPERADOR', 'ADMINISTRADOR']) assert.equal((await pedir('entrega', datos, rol)).status, 403);
        assert.equal((await pedir('entrega', datos, 'CHOFER', 4)).status, 404);
        for (const body of [{}, { ...datos, usuario_id: 4 }, { ...datos, operacion_id: 'mala' }, { resultado: 'FALLIDA', operacion_id: operacion, motivo: ' ' }]) {
            assert.equal((await pedir('entrega', body)).status, 400);
        }
        assert.equal((await pedir('pago', { metodo: 'EFECTIVO' })).status, 409);
        assert.equal((await pedir('entrega', datos)).status, 200);
        assert.equal((await pedir('entrega', datos)).status, 200);
        for (const body of [{ metodo: 'OTRO', monto: '1.00' }, { metodo: 'EFECTIVO', monto: 1 }, { metodo: 'EFECTIVO', monto: '0' }, { metodo: 'EFECTIVO', monto: '1.111' }]) {
            assert.equal((await pedir('pago', body)).status, 400);
        }
        assert.equal((await pedir('pago', { metodo: 'EFECTIVO' })).status, 200);
        assert.equal((await pedir('pago', { metodo: 'EFECTIVO' })).status, 200);
        assert.equal(db.pago.monto, '20.50');
        assert.equal((await pedir('pago', { metodo: 'TRANSFERENCIA' })).status, 409);
    } finally { server.close(); await once(server, 'close'); }
});
