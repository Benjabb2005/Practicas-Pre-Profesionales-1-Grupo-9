const { test } = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const { once } = require('node:events');
const { createTarifasRouter } = require('../src/routes/tarifas.routes');
const { createTarifaService } = require('../src/services/TarifaService');
const { errorHandler } = require('../src/middleware/errorHandler');

const DIRECCION = {
    calle: 'Av. Corrientes',
    altura: '1234',
    localidad: 'CABA',
    provincia: 'CABA',
};

function crearServidor({ adapter, rol = 'ADMINISTRADOR' }) {
    const guardado = { llamados: 0, datos: null, usuarioId: null };
    const repositorio = {
        async obtener() {
            return { precio_km: '125.00', sucursal_calle: 'Av. Corrientes' };
        },
        async guardarSucursal(datos, usuarioId) {
            guardado.llamados += 1;
            guardado.datos = datos;
            guardado.usuarioId = usuarioId;
            return {
                precio_km: '125.00',
                sucursal_calle: datos.calle,
                sucursal_altura: datos.altura,
                sucursal_localidad: datos.localidad,
                sucursal_provincia: datos.provincia,
                sucursal_direccion: datos.direccion,
                sucursal_latitud: datos.latitud,
                sucursal_longitud: datos.longitud,
                actualizado_por: usuarioId,
            };
        },
    };
    const tarifaService = createTarifaService({ repositorio, geocodeAdapter: adapter });
    const app = express();
    app.use(express.json());
    app.use('/api/tarifas', createTarifasRouter({
        tarifaService,
        auth(req, res, next) {
            req.usuario = { id: 17, rol };
            next();
        },
    }));
    app.use(errorHandler);
    const server = app.listen(0, '127.0.0.1');

    return { server, guardado };
}

async function conServidor(opciones, ejecutar) {
    const { server, guardado } = crearServidor(opciones);
    await once(server, 'listening');
    try {
        await ejecutar(`http://127.0.0.1:${server.address().port}`, guardado);
    } finally {
        server.close();
        await once(server, 'close');
    }
}

function adapterCon(resultado) {
    return {
        async geocodificar() {
            return resultado;
        },
    };
}

test('GET /api/tarifas incluye los datos de sucursal', async () => {
    await conServidor({ adapter: adapterCon({}) }, async (baseUrl) => {
        const respuesta = await fetch(`${baseUrl}/api/tarifas`);
        assert.equal(respuesta.status, 200);
        assert.deepEqual((await respuesta.json()).tarifa, {
            precio_km: '125.00',
            sucursal_calle: 'Av. Corrientes',
        });
    });
});

test('un operador recibe 403 al configurar la sucursal', async () => {
    await conServidor({ adapter: adapterCon({}), rol: 'OPERADOR' }, async (baseUrl, guardado) => {
        const respuesta = await fetch(`${baseUrl}/api/tarifas/sucursal`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(DIRECCION),
        });
        assert.equal(respuesta.status, 403);
        assert.equal(guardado.llamados, 0);
    });
});

test('altura S/N devuelve 400 con el campo y no llama a Georef', async () => {
    let geocodificaciones = 0;
    const adapter = {
        async geocodificar() {
            geocodificaciones += 1;
            return { resultado: 'APPROXIMATE', candidatos: [] };
        },
    };

    await conServidor({ adapter }, async (baseUrl, guardado) => {
        const respuesta = await fetch(`${baseUrl}/api/tarifas/sucursal`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ...DIRECCION, altura: 'S/N' }),
        });
        assert.equal(respuesta.status, 400);
        const cuerpo = await respuesta.json();
        assert.equal(cuerpo.error.campos.altura, 'La altura S/N no sirve para despachar. Ingresá un número.');
        assert.equal(geocodificaciones, 0);
        assert.equal(guardado.llamados, 0);
    });
});

test('Georef sin resultados devuelve 409 y no guarda la sucursal', async () => {
    await conServidor({
        adapter: adapterCon({ resultado: 'ZERO_RESULTS', motivo: 'No se encontró la dirección.', candidatos: [] }),
    }, async (baseUrl, guardado) => {
        const respuesta = await fetch(`${baseUrl}/api/tarifas/sucursal`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(DIRECCION),
        });
        assert.equal(respuesta.status, 409);
        assert.equal((await respuesta.json()).error.mensaje, 'No se encontró la dirección.');
        assert.equal(guardado.llamados, 0);
    });
});

test('guarda dirección normalizada y coordenadas del primer candidato de Georef', async () => {
    const candidatos = [
        { indice: 0, direccion: 'Avenida Corrientes 1234, CABA', latitud: -34.6037, longitud: -58.3816 },
        { indice: 1, direccion: 'Otro candidato', latitud: -34.7, longitud: -58.5 },
    ];

    await conServidor({ adapter: adapterCon({ resultado: 'APPROXIMATE', candidatos }) }, async (baseUrl, guardado) => {
        const respuesta = await fetch(`${baseUrl}/api/tarifas/sucursal`, {
            method: 'PUT',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(DIRECCION),
        });
        assert.equal(respuesta.status, 200);
        const tarifa = (await respuesta.json()).tarifa;
        assert.equal(guardado.llamados, 1);
        assert.equal(guardado.usuarioId, 17);
        assert.equal(guardado.datos.calle, 'Avenida Corrientes');
        assert.equal(guardado.datos.direccion, 'Avenida Corrientes 1234, CABA');
        assert.equal(guardado.datos.latitud, -34.6037);
        assert.equal(guardado.datos.longitud, -58.3816);
        assert.equal(tarifa.sucursal_direccion, 'Avenida Corrientes 1234, CABA');
        assert.equal(tarifa.sucursal_latitud, -34.6037);
        assert.equal(tarifa.sucursal_longitud, -58.3816);
        assert.equal(tarifa.actualizado_por, 17);
    });
});
