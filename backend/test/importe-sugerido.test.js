const { test } = require('node:test');
const assert = require('node:assert/strict');
const { once } = require('node:events');
const express = require('express');
const { crearSugerenciaImporteService } = require('../src/services/SugerenciaImporteService');
const { distanciaKm } = require('../src/lib/distancia');
const { createPedidosRouter } = require('../src/routes/pedidos.routes');
const { errorHandler } = require('../src/middleware/errorHandler');

function escenario({ pedido, tarifa } = {}) {
    const lecturas = { pedidos: 0, tarifas: 0 };
    const pedidos = {
        async obtenerDetalle(id) {
            lecturas.pedidos += 1;
            return pedido === undefined
                ? { id, estado_validacion: 'CONFIRMADA', latitud: '-34.6037', longitud: '-58.3816' }
                : pedido;
        },
    };
    const tarifas = {
        async obtener() {
            lecturas.tarifas += 1;
            return tarifa === undefined
                ? { sucursal_latitud: '-34.6118', sucursal_longitud: '-58.4173', precio_km: '125.00' }
                : tarifa;
        },
    };
    return {
        service: crearSugerenciaImporteService({ pedidos, tarifas }),
        lecturas,
    };
}

test('distanciaKm calcula la distancia de (0,0) a (1,0) y acepta coordenadas de texto', () => {
    const distancia = distanciaKm('0', '0', '1', '0');
    assert.ok(Math.abs(distancia - 111.19) < 0.01);
});

test('la sugerencia no está disponible si la dirección no está confirmada', async () => {
    const { service, lecturas } = escenario({
        pedido: { id: 8, estado_validacion: 'VALIDA', latitud: '-34.6', longitud: '-58.4' },
    });

    assert.deepEqual(await service.sugerir(8), {
        disponible: false,
        motivo: 'La dirección del pedido no está confirmada.',
    });
    assert.equal(lecturas.tarifas, 0);
});

test('la sugerencia no está disponible si el pedido confirmado no tiene coordenadas', async () => {
    const { service } = escenario({
        pedido: { id: 8, estado_validacion: 'CONFIRMADA', latitud: null, longitud: null },
    });

    assert.deepEqual(await service.sugerir(8), {
        disponible: false,
        motivo: 'La dirección confirmada no tiene coordenadas.',
    });
});

test('la sugerencia no está disponible si la sucursal no tiene coordenadas', async () => {
    const { service } = escenario({
        tarifa: { sucursal_latitud: null, sucursal_longitud: null, precio_km: '125.00' },
    });

    assert.deepEqual(await service.sugerir(8), {
        disponible: false,
        motivo: 'La sucursal no tiene coordenadas configuradas.',
    });
});

test('la sugerencia no está disponible si falta el precio por km', async () => {
    const { service } = escenario({
        tarifa: { sucursal_latitud: '-34.6118', sucursal_longitud: '-58.4173', precio_km: null },
    });

    assert.deepEqual(await service.sugerir(8), {
        disponible: false,
        motivo: 'No hay un precio por km configurado.',
    });
});

test('calcula el importe con la distancia ya redondeada y no guarda datos', async () => {
    const { service, lecturas } = escenario({
        pedido: { id: 8, estado_validacion: 'CONFIRMADA', latitud: '1', longitud: '0' },
        tarifa: { sucursal_latitud: '0', sucursal_longitud: '0', precio_km: '2.50' },
    });

    assert.deepEqual(await service.sugerir(8), {
        disponible: true,
        distancia_km: 111.2,
        precio_km: '2.50',
        importe_sugerido: '278.00',
    });
    assert.deepEqual(lecturas, { pedidos: 1, tarifas: 1 });
});

test('GET /api/pedidos/:id/importe-sugerido permite ADMINISTRADOR y OPERADOR', async () => {
    for (const rol of ['ADMINISTRADOR', 'OPERADOR']) {
        let pedidoConsultado = null;
        const app = express();
        app.use('/api/pedidos', createPedidosRouter({
            auth(req, res, next) {
                req.usuario = { id: 1, rol };
                next();
            },
            pedidoService: {},
            sugerenciaImporteService: {
                async sugerir(id) {
                    pedidoConsultado = id;
                    return { disponible: false, motivo: 'Falta configuración.' };
                },
            },
        }));
        app.use(errorHandler);
        const server = app.listen(0, '127.0.0.1');
        await once(server, 'listening');
        try {
            const respuesta = await fetch(`http://127.0.0.1:${server.address().port}/api/pedidos/12/importe-sugerido`);
            assert.equal(respuesta.status, 200);
            assert.deepEqual(await respuesta.json(), { disponible: false, motivo: 'Falta configuración.' });
            assert.equal(pedidoConsultado, 12);
        } finally {
            server.close();
            await once(server, 'close');
        }
    }
});

test('GET /api/pedidos/:id/importe-sugerido rechaza otros roles', async () => {
    const app = express();
    app.use('/api/pedidos', createPedidosRouter({
        auth(req, res, next) {
            req.usuario = { id: 2, rol: 'CHOFER' };
            next();
        },
        pedidoService: {},
        sugerenciaImporteService: {
            async sugerir() {
                assert.fail('No debe consultar la sugerencia para un rol no autorizado.');
            },
        },
    }));
    app.use(errorHandler);
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
        const respuesta = await fetch(`http://127.0.0.1:${server.address().port}/api/pedidos/12/importe-sugerido`);
        assert.equal(respuesta.status, 403);
    } finally {
        server.close();
        await once(server, 'close');
    }
});

test('POST /api/pedidos acepta que el importe_base no venga o venga vacío', async () => {
    const llamadas = [];
    const app = express();
    app.use(express.json());
    app.use('/api/pedidos', createPedidosRouter({
        auth(req, res, next) {
            req.usuario = { id: 1, rol: 'ADMINISTRADOR' };
            next();
        },
        pedidoService: {
            async crear(datos) {
                llamadas.push(datos);
                return { pedido: { importe_base: null } };
            },
        },
        sugerenciaImporteService: { async sugerir() { return { disponible: false }; } },
    }));
    app.use(errorHandler);
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    try {
        const url = `http://127.0.0.1:${server.address().port}/api/pedidos`;
        for (const cuerpo of [
            { cliente_id: 1, direccion: { calle: 'Calle Falsa' } },
            { cliente_id: 1, importe_base: '', direccion: { calle: 'Calle Falsa' } },
        ]) {
            const respuesta = await fetch(url, {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(cuerpo),
            });
            assert.equal(respuesta.status, 201);
        }
        assert.equal(llamadas.length, 2);
        assert.equal(llamadas[0].importe_base, undefined);
        assert.equal(llamadas[1].importe_base, '');
    } finally {
        server.close();
        await once(server, 'close');
    }
});
