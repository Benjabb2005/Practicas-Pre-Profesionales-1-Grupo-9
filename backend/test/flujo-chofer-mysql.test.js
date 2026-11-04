const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const { randomUUID } = require('node:crypto');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const createApp = require('../app');

// Opt-in: requiere migraciones 001–003 en una base de pruebas aislada.
test('B06 HTTP/MySQL: flujo completo de chofer con login real', {
    skip: process.env.FLUJO_CHOFER_MYSQL !== '1',
}, async (t) => {
    assert.equal(process.env.DB_NAME, 'mandatodo_test_entregas');
    const db = mysql.createPool({ host: process.env.DB_HOST, user: process.env.DB_USER,
        password: process.env.DB_PASSWORD, database: process.env.DB_NAME, connectionLimit: 4 });
    let server;
    try {
        const clave = randomUUID();
        const hash = await bcrypt.hash(clave, 4);
        const roles = { admin: 'ADMINISTRADOR', operador: 'OPERADOR', chofer: 'CHOFER', ajeno: 'CHOFER' };
        const usuarios = {};
        for (const [nombre, rol] of Object.entries(roles)) {
            const email = `${nombre}-${randomUUID()}@example.invalid`;
            const [r] = await db.query('INSERT INTO usuarios(nombre,email,password_hash,rol) VALUES(?,?,?,?)',
                ['Ensayo B06', email, hash, rol]);
            usuarios[nombre] = { id: r.insertId, email };
        }
        server = createApp({ db, config: { jwt: { secret: randomUUID(), expiraEn: '1h' }, geocode: {} } }).listen(0, '127.0.0.1');
        await once(server, 'listening');
        async function pedir(ruta, quien, metodo = 'GET', datos) {
            const headers = {};
            if (quien) headers.authorization = `Bearer ${usuarios[quien].token}`;
            if (datos !== undefined) headers['content-type'] = 'application/json';
            return fetch(`http://127.0.0.1:${server.address().port}/api${ruta}`, {
                method: metodo, headers, body: datos === undefined ? undefined : JSON.stringify(datos),
            });
        }
        async function ok(ruta, quien, metodo = 'GET', datos) {
            const r = await pedir(ruta, quien, metodo, datos);
            const body = await r.json();
            assert.equal(r.status, 200, `${metodo} ${ruta}: ${JSON.stringify(body)}`);
            return body;
        }
        await t.test('login incorrecto, sesión ausente y login por cuatro identidades', async () => {
            assert.equal((await pedir('/auth/login', null, 'POST', { email: usuarios.chofer.email, password: 'incorrecta' })).status, 401);
            assert.equal((await pedir('/chofer/pedidos')).status, 401);
            for (const nombre of Object.keys(usuarios)) {
                const body = await ok('/auth/login', null, 'POST', { email: usuarios[nombre].email, password: clave });
                usuarios[nombre].token = body.token;
                assert.equal((await ok('/auth/me', nombre)).usuario.id, usuarios[nombre].id);
            }
        });
        const [cl] = await db.query('INSERT INTO clientes(nombre)VALUES(?)', ['Cliente sintético B06 HTTP']);
        async function crear(estado = 'EN ENVÍO', importe = '1000.00', confirmada = true) {
            const [r] = await db.query('INSERT INTO pedidos(cliente_id,estado,chofer_id,importe_base)VALUES(?,?,?,?)',
                [cl.insertId, estado, usuarios.chofer.id, importe]);
            await db.query('INSERT INTO direcciones(pedido_id,calle,altura,localidad,provincia,estado_validacion)VALUES(?,?,?,?,?,?)',
                [r.insertId, 'Calle sintética', '123', 'Localidad sintética', 'Buenos Aires', confirmada ? 'CONFIRMADA' : 'CON_ADVERTENCIAS']);
            return r.insertId;
        }
        const efectivo = await crear(), transferencia = await crear(), fallido = await crear();
        await t.test('chofer propio, IDs ajenos, filtros manipulados y permisos por rol', async () => {
            assert.ok((await ok('/chofer/pedidos', 'chofer')).pedidos.some(p => p.id === efectivo));
            assert.equal((await ok(`/chofer/pedidos?chofer_id=${usuarios.chofer.id}`, 'ajeno')).pedidos.some(p => p.id === efectivo), false);
            for (const ruta of [`/chofer/pedidos/${efectivo}`, `/chofer/pedidos/${efectivo}/historial`]) {
                assert.equal((await pedir(ruta, 'ajeno')).status, 404);
            }
            assert.equal((await pedir('/chofer/pedidos', 'operador')).status, 403);
            assert.equal((await pedir('/asignaciones', 'chofer')).status, 403);
            assert.equal((await pedir(`/chofer/pedidos/${efectivo}/pago`, 'chofer', 'PUT', { metodo: 'EFECTIVO' })).status, 409);
            assert.equal((await pedir(`/chofer/pedidos/${efectivo}/entrega`, 'ajeno', 'PUT', { resultado: 'ENTREGADO', operacion_id: randomUUID() })).status, 404);
        });
        await t.test('dirección sin confirmar bloquea asignación y despacho por API', async () => {
            const id = await crear('EN PREPARACIÓN', '1000.00', false);
            assert.equal((await pedir(`/asignaciones/${id}`, 'operador', 'PUT', { chofer_id: usuarios.ajeno.id })).status, 409);
            assert.equal((await pedir(`/asignaciones/${id}/estado`, 'operador', 'PUT', { estado: 'EN ENVÍO' })).status, 409);
        });
        const entregar = (id, quien = 'chofer', operacion = randomUUID()) => ok(`/chofer/pedidos/${id}/entrega`, quien, 'PUT', { resultado: 'ENTREGADO', operacion_id: operacion });
        await t.test('entrega y efectivo concurrentes: un pago e historial único, persisten al releer', async () => {
            const operacion = randomUUID();
            await Promise.all([entregar(efectivo, 'chofer', operacion), entregar(efectivo, 'chofer', operacion)]);
            await Promise.all([ok(`/chofer/pedidos/${efectivo}/pago`, 'chofer', 'PUT', { metodo: 'EFECTIVO' }), ok(`/chofer/pedidos/${efectivo}/pago`, 'chofer', 'PUT', { metodo: 'EFECTIVO' })]);
            const pedido = (await ok(`/pedidos/${efectivo}`, 'admin')).pedido;
            assert.equal(pedido.estado, 'PAGADO');
            assert.equal((await pedir(`/chofer/pedidos/${efectivo}/pago`, 'chofer', 'PUT', { metodo: 'TRANSFERENCIA' })).status, 409);
            const [[conteo]] = await db.query('SELECT COUNT(*) n FROM pagos WHERE pedido_id=?', [efectivo]);
            assert.equal(conteo.n, 1);
            assert.equal((await ok(`/chofer/pedidos/${efectivo}/historial`, 'chofer')).historial.length, 2);
        });
        await t.test('fallo inválido se rechaza; fallo válido agrega 50%, reintento no duplica y admite redespacho', async () => {
            assert.equal((await pedir(`/chofer/pedidos/${fallido}/entrega`, 'chofer', 'PUT', { resultado: 'FALLIDA', motivo: '', operacion_id: randomUUID() })).status, 400);
            const datos = { resultado: 'FALLIDA', motivo: 'Destinatario ausente: prueba sintética', operacion_id: randomUUID() };
            await Promise.all([ok(`/chofer/pedidos/${fallido}/entrega`, 'chofer', 'PUT', datos), ok(`/chofer/pedidos/${fallido}/entrega`, 'chofer', 'PUT', datos)]);
            const pedido = (await ok(`/pedidos/${fallido}`, 'admin')).pedido;
            assert.equal(pedido.estado, 'EN PREPARACIÓN');
            assert.equal(pedido.importe_total, '1500.00');
            assert.ok(pedido.proxima_visita);
            await ok(`/asignaciones/${fallido}/estado`, 'operador', 'PUT', { estado: 'EN ENVÍO' });
            await ok(`/chofer/pedidos/${fallido}/entrega`, 'chofer', 'PUT', datos);
            assert.equal((await ok(`/pedidos/${fallido}`, 'admin')).pedido.estado, 'EN ENVÍO');
        });
        await t.test('transferencia sólo acredita admin; cuerpo monetario y doble acreditación controlados', async () => {
            await entregar(transferencia);
            assert.equal((await pedir(`/chofer/pedidos/${transferencia}/pago`, 'chofer', 'PUT', { metodo: 'TRANSFERENCIA', monto: '1.00' })).status, 400);
            await ok(`/chofer/pedidos/${transferencia}/pago`, 'chofer', 'PUT', { metodo: 'TRANSFERENCIA' });
            assert.equal((await ok(`/pedidos/${transferencia}`, 'admin')).pedido.estado, 'ENTREGADO');
            for (const quien of ['chofer', 'operador']) assert.equal((await pedir(`/asignaciones/${transferencia}/acreditar-pago`, quien, 'PUT', {})).status, 403);
            await Promise.all([ok(`/asignaciones/${transferencia}/acreditar-pago`, 'admin', 'PUT', {}), ok(`/asignaciones/${transferencia}/acreditar-pago`, 'admin', 'PUT', {})]);
            assert.equal((await ok(`/pedidos/${transferencia}`, 'admin')).pedido.estado, 'PAGADO');
        });
        await t.test('entregado antiguo: completar importe con MySQL real, preservar estado y no sobrescribir', async () => {
            const id = await crear('ENTREGADO', null);
            assert.equal((await pedir(`/chofer/pedidos/${id}/pago`, 'chofer', 'PUT', { metodo: 'EFECTIVO' })).status, 409);
            assert.equal((await pedir(`/pedidos/${id}/importe`, 'chofer', 'PUT', { importe_base: '1000.00' })).status, 403);
            await ok(`/pedidos/${id}/importe`, 'operador', 'PUT', { importe_base: '1000.00' });
            assert.equal((await ok(`/pedidos/${id}`, 'operador')).pedido.estado, 'ENTREGADO');
            assert.equal((await pedir(`/pedidos/${id}/importe`, 'operador', 'PUT', { importe_base: '2000.00' })).status, 409);
            await ok(`/chofer/pedidos/${id}/pago`, 'chofer', 'PUT', { metodo: 'EFECTIVO' });
            assert.equal((await ok(`/pedidos/${id}`, 'admin')).pedido.estado, 'PAGADO');
        });
    } finally {
        if (server) { server.close(); await once(server, 'close'); }
        await db.end();
    }
});
