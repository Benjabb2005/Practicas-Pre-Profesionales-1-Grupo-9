const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const jwt = require('jsonwebtoken');
const { createAuthMiddleware } = require('../src/middleware/auth');
const { createPedidosRouter } = require('../src/routes/pedidos.routes');
const { errorHandler } = require('../src/middleware/errorHandler');
const { crearSugerenciaImporteService } = require('../src/services/SugerenciaImporteService');

function servicio(tarifa = { sucursal_latitud: '0', sucursal_longitud: '0', precio_km: '2.50' }) {
    return crearSugerenciaImporteService({
        pedidos: new Proxy({}, { get() { assert.fail('Estimar en carga no debe leer/escribir pedidos.'); } }),
        tarifas: { obtener: async () => tarifa },
    });
}

test('calcula durante carga con la misma fórmula y redondeo, sin pedido ni confirmación', async () => {
    assert.deepEqual(await servicio().sugerirDuranteCarga({ latitud: 1, longitud: 0 }), {
        disponible: true, distancia_km: 111.2, precio_km: '2.50', importe_sugerido: '278.00', tentativa: true,
    });
});

test('cero km es una estimación cero, no inventa un mínimo ni guarda datos', async () => {
    assert.deepEqual(await servicio().sugerirDuranteCarga({ latitud: 0, longitud: 0 }), {
        disponible: true, distancia_km: 0, precio_km: '2.50', importe_sugerido: '0.00', tentativa: true,
    });
});

test('redondea medio centavo hacia arriba con cálculo entero', async () => {
    const r = await servicio({ sucursal_latitud: 0, sucursal_longitud: 0, precio_km: '0.05' })
        .sugerirDuranteCarga({ latitud: 0.0045, longitud: 0 });
    assert.equal(r.distancia_km, 0.5);
    assert.equal(r.importe_sugerido, '0.03');
});

test('sin sucursal o tarifa devuelve motivo y permite seguir con importe manual', async () => {
    for (const tarifa of [null, { precio_km: '2.50' }, { sucursal_latitud: 91, sucursal_longitud: 0, precio_km: '2.50' }, { sucursal_latitud: 0, sucursal_longitud: 0 }]) {
        const r = await servicio(tarifa).sugerirDuranteCarga({ latitud: 1, longitud: 0 });
        assert.equal(r.disponible, false); assert.ok(r.motivo); assert.equal(r.tentativa, true);
    }
});

test('no sugiere valores que superan el máximo persistible', async () => {
    const r = await servicio({ sucursal_latitud: 0, sucursal_longitud: 0, precio_km: '9999999999.99' })
        .sugerirDuranteCarga({ latitud: 1, longitud: 0 });
    assert.equal(r.disponible, false); assert.match(r.motivo, /máximo/);
});

test('valida coordenadas sin confundir null/vacío con cero', async () => {
    for (const punto of [{}, { latitud: null, longitud: 0 }, { latitud: '', longitud: 0 }, { latitud: '1', longitud: 0 }, { latitud: NaN, longitud: 0 }, { latitud: 91, longitud: 0 }, { latitud: 0, longitud: -181 }]) {
        await assert.rejects(() => servicio().sugerirDuranteCarga(punto), e => e.codigo === 'DATOS_INVALIDOS');
    }
});

test('HTTP: autenticación/roles, validación estricta y cálculo sin escribir', async () => {
    const app = express(); app.use(express.json());
    app.use('/api/pedidos', createPedidosRouter({
        auth: createAuthMiddleware({ config: { jwt: { secret: 'prueba-sintetica-importe-carga' } } }),
        sugerenciaImporteService: servicio(),
    })); app.use(errorHandler);
    const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
    const url = `http://127.0.0.1:${server.address().port}/api/pedidos/importe-sugerido`;
    async function enviar(punto, rol) {
        return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...(rol ? { Authorization: `Bearer ${jwt.sign({ sub: 1, rol }, 'prueba-sintetica-importe-carga')}` } : {}) }, body: JSON.stringify(punto), signal: AbortSignal.timeout(3000) });
    }
    try {
        assert.equal((await enviar({ latitud: 1, longitud: 0 })).status, 401);
        assert.equal((await enviar({ latitud: 1, longitud: 0 }, 'CHOFER')).status, 403);
        for (const rol of ['ADMINISTRADOR', 'OPERADOR']) {
            const r = await enviar({ latitud: 1, longitud: 0 }, rol);
            assert.equal(r.status, 200); assert.equal(r.headers.get('cache-control'), 'no-store');
            assert.equal((await r.json()).importe_sugerido, '278.00');
        }
        for (const punto of [{}, { latitud: null, longitud: 0 }, { latitud: 91, longitud: 0 }, { latitud: '1', longitud: 0 }, { latitud: 1, longitud: 0, precio_km: '0.01' }, { latitud: 1, longitud: 0, importe_sugerido: '1.00' }]) {
            assert.equal((await enviar(punto, 'OPERADOR')).status, 400);
        }
    } finally { await new Promise(resolve => { server.close(resolve); server.closeAllConnections(); }); }
});
