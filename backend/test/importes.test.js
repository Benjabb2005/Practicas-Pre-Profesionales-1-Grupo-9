const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const jwt = require('jsonwebtoken');
const createApp = require('../app');
const { normalizarImporte, recargoPorIntentos } = require('../src/lib/importes');
const { validarDespacho, createAsignacionService } = require('../src/services/AsignacionService');

test('importes: validación decimal exacta y recargo50% del base, no compuesto', () => {
    assert.equal(normalizarImporte('100.5'), '100.50');
    for (const x of [undefined, null, '', '0', '-1', '1.001', '1e3', '10000000000']) assert.throws(() => normalizarImporte(x), e => e.statusCode === 400);
    assert.equal(recargoPorIntentos('1000.00', 1), '500.00');
    assert.equal(recargoPorIntentos('1000.00', 2), '1000.00');
    assert.equal(recargoPorIntentos('0.03', 1), '0.02');
    assert.equal(recargoPorIntentos(null, 2), '0.00');
    assert.throws(() => recargoPorIntentos('9999999999.99', 1), e => e.statusCode === 409);
});
test('reprogramación permite despacho manual antes de próxima jornada con dirección y chofer vigentes', async () => {
    const pedido = { id: 1,estado: 'EN PREPARACIÓN',estado_validacion: 'CONFIRMADA',chofer_id: 3,reintento_pendiente: 1 };
    validarDespacho(pedido, 'EN ENVÍO', { rol: 'CHOFER',activo: 1 });
    assert.throws(() => validarDespacho({ ...pedido,estado_validacion: 'VALIDA' }, 'EN ENVÍO', { rol: 'CHOFER',activo: 1 }), e => e.statusCode === 409);
    assert.throws(() => validarDespacho(pedido, 'EN ENVÍO', { rol: 'CHOFER',activo: 0 }), e => e.statusCode === 409);
    validarDespacho({ ...pedido,reintento_pendiente: 0 }, 'EN ENVÍO', { rol: 'CHOFER',activo: 1 });
    const servicio = createAsignacionService({ repositorio: { listar: async () => [{ ...pedido,chofer_rol:'CHOFER',chofer_activo:1 }] } });
    assert.equal((await servicio.listar())[0].puede_despachar,true);
});
test('HTTP tarifas: operador consulta pero sólo administrador modifica; entrada inválida rechazada', async () => {
    let precio = null;
    const db = { async query(sql, args) {
        if (sql.startsWith('UPDATE tarifas')) { precio = args[0]; return [{}]; }
        return [[{ precio_km: precio }]];
    } };
    const server = createApp({ db,config: { jwt: { secret: 'secreto-sintetico' },geocode: {} } }).listen(0,'127.0.0.1');
    await once(server,'listening');
    const pedir = (rol,method='GET',body) => fetch(`http://127.0.0.1:${server.address().port}/api/tarifas`, {
        method,headers: { 'content-type': 'application/json',...(rol ? { authorization: `Bearer ${jwt.sign({ sub: 1,rol },'secreto-sintetico')}` } : {}) },
        body: body ? JSON.stringify(body) : undefined,
    });
    try {
        assert.equal((await pedir(null)).status,401);
        assert.equal((await pedir('CHOFER')).status,403);
        assert.equal((await pedir('OPERADOR')).status,200);
        assert.equal((await pedir('OPERADOR','PUT',{ precio_km: '200.00' })).status,403);
        for (const x of ['0','-1','5.555']) assert.equal((await pedir('ADMINISTRADOR','PUT',{ precio_km: x })).status,400);
        assert.equal((await pedir('ADMINISTRADOR','PUT',{ precio_km: '200.5' })).status,200);
        assert.equal((await (await pedir('OPERADOR')).json()).tarifa.precio_km,'200.50');
    } finally { server.close(); await once(server,'close'); }
});
