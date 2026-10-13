const { test } = require('node:test');
const assert = require('node:assert/strict');

test('alternativa navegador consulta solo dirección, sin credenciales y sin confirmar', async (t) => {
    const { browserGeoref } = await import('../../frontend/src/georef.js');
    t.mock.method(globalThis, 'fetch', async (url, options) => {
        assert.equal(url.hostname, 'apis.datos.gob.ar');
        assert.equal(url.searchParams.get('direccion'), 'Calle sintética 123');
        assert.equal(url.searchParams.has('email'), false);
        assert.equal(options.credentials, 'omit');
        return { ok: true, json: async () => ({ direcciones: [{ nomenclatura: 'Candidato sintético', ubicacion: { lat: -34, lon: -58 } }, { ubicacion: { lat: null, lon: null } }] }) };
    });
    const result = await browserGeoref({ calle: ' Calle sintética ', altura: '123', localidad: 'Localidad sintética', provincia: 'Provincia sintética' }, new AbortController().signal);
    assert.equal(result.status, 'multiple_results');
    assert.equal(result.candidates[1].lat, null);
    assert.equal(Object.hasOwn(result, 'confirmation'), false);
});

test('alternativa navegador comunica límite del proveedor sin éxito ficticio', async (t) => {
    const { browserGeoref } = await import('../../frontend/src/georef.js');
    t.mock.method(globalThis, 'fetch', async () => ({ ok: false, status: 429 }));
    await assert.rejects(browserGeoref({ calle: 'Calle sintética', altura: '123', localidad: 'Localidad sintética', provincia: 'Provincia sintética' }, new AbortController().signal), /límite/);
});
