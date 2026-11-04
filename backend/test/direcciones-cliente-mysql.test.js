const { test } = require('node:test');
const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const { createPedidoRepository } = require('../src/repositories/PedidoRepository');
const { createClienteRepository } = require('../src/repositories/ClienteRepository');
const { createPedidoService } = require('../src/services/PedidoService');

test('KAN-54 MySQL: persistencia, deduplicación concurrente, aislamiento y rollback sin alterar pedidos previos', {
    skip: process.env.DIRECCIONES_CLIENTE_MYSQL !== '1',
}, async () => {
    assert.match(process.env.DB_NAME, /^mandatodo_test_direcciones_\d+$/);
    const db = mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER, password: process.env.DB_PASSWORD, database: process.env.DB_NAME, connectionLimit: 4 });
    try {
        const [a] = await db.query('INSERT INTO clientes(nombre,dni,telefono,email) VALUES (?,?,?,?)', ['Fixture cliente A', String(Date.now()) + '1', '1155555555', 'a@example.test']);
        const [b] = await db.query('INSERT INTO clientes(nombre,dni,telefono,email) VALUES (?,?,?,?)', ['Fixture cliente B', String(Date.now()) + '2', '1155555556', 'b@example.test']);
        const [viejo] = await db.query('INSERT INTO pedidos(cliente_id,estado,direccion_validada) VALUES (?,?,1)', [a.insertId, 'EN PREPARACIÓN']);
        await db.query(`INSERT INTO direcciones(pedido_id,direccion_original,calle,altura,piso_depto,entre_calles,
            localidad,provincia,codigo_postal,estado_validacion,latitud,longitud)
            VALUES (?,?,?,?,?,?,?,?,?,'CONFIRMADA',-34.6,-58.4)`,
        [viejo.insertId, 'ORIGINAL ANTERIOR', 'Avenida Prueba', '123', '1 A', 'Primera y Segunda', 'CABA', 'Ciudad Autónoma de Buenos Aires', '1000']);
        const anteriores = await db.query('SELECT * FROM direcciones WHERE pedido_id=?', [viejo.insertId]);
        const clientes = createClienteRepository(db), pedidos = createPedidoRepository(db);
        assert.equal((await clientes.direcciones(a.insertId)).length, 1, 'histórico sin migrar/copiar pedidos');
        assert.equal((await clientes.direcciones(b.insertId)).length, 0);
        const servicio = createPedidoService({ pedidos, clientes });
        const direccion = { calle: ' Av. Prueba ', altura: '123', piso_depto: '1 A', entre_calles: 'Primera y Segunda', localidad: 'CABA', provincia: 'CABA', codigo_postal: '1000' };
        async function crear(cliente_id, cambio = {}) {
            return servicio.crear({ cliente_id, direccion: { ...direccion, ...cambio }, confirmar_duplicado: true }, null);
        }
        const primer = await crear(a.insertId);
        assert.notEqual(primer.pedido.estado_validacion, 'CONFIRMADA');
        assert.equal(primer.pedido.latitud, null); assert.equal(primer.pedido.longitud, null);
        await crear(a.insertId, { calle: 'avenida prueba' });
        assert.equal((await clientes.direcciones(a.insertId)).length, 1, 'normalizadas/reintentos no duplican la libreta');
        const [[cantidad]] = await db.query('SELECT COUNT(*) AS n FROM direcciones_cliente WHERE cliente_id=?', [a.insertId]);
        assert.equal(cantidad.n, 1);
        await crear(a.insertId, { piso_depto: '2 B' });
        await crear(a.insertId, { entre_calles: 'Tercera y Cuarta' });
        assert.equal((await clientes.direcciones(a.insertId)).length, 3);
        await crear(b.insertId);
        assert.equal((await clientes.direcciones(b.insertId)).length, 1);
        assert.equal((await clientes.direcciones(a.insertId)).length, 3);
        const otraConexion = await db.getConnection();
        try {
            assert.equal((await createClienteRepository(otraConexion).direcciones(a.insertId)).length, 3, 'persistente en otra conexión');
        } finally { otraConexion.release(); }
        const [[antes]] = await db.query('SELECT COUNT(*) AS n FROM pedidos');
        const fallando = createPedidoRepository({ async getConnection() {
            const c = await db.getConnection();
            return { beginTransaction: () => c.beginTransaction(), commit: () => c.commit(), rollback: () => c.rollback(), release: () => c.release(),
                query(sql, valores) { if (sql.includes('INSERT INTO direcciones_cliente')) throw new Error('fallo de libreta simulado'); return c.query(sql, valores); } };
        } });
        await assert.rejects(() => fallando.crear({ clienteId: a.insertId, estado: 'EN STOCK', direccion }), /fallo de libreta/);
        const [[despues]] = await db.query('SELECT COUNT(*) AS n FROM pedidos');
        assert.equal(despues.n, antes.n, 'no queda un pedido creado a medias');
        await Promise.all([1, 2].map(() => pedidos.crear({ clienteId: a.insertId, estado: 'EN STOCK', direccion: { ...direccion, altura: '456' } })));
        const [[concurrentes]] = await db.query('SELECT COUNT(*) AS n FROM direcciones_cliente WHERE cliente_id=?', [a.insertId]);
        assert.equal(concurrentes.n, 4, 'sólo una dirección adicional con dos altas concurrentes');
        assert.deepEqual((await db.query('SELECT * FROM direcciones WHERE pedido_id=?', [viejo.insertId]))[0], anteriores[0]);
        for (const d of await clientes.direcciones(a.insertId)) {
            assert.equal(d.latitud, undefined); assert.equal(d.longitud, undefined); assert.equal(d.estado_validacion, undefined);
        }
        // Base descartable nueva por corrida; no borrar pedidos del usuario ni
        // ejecutar limpieza masiva. Los fixtures quedan aislados para inspección.
    } finally { await db.end(); }
});
