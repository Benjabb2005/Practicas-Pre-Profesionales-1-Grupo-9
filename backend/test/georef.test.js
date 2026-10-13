const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createGeoref } = require("../georef");
const { addressVersion, currentConfirmation } = require("../orders");
const address = { direccionOriginal: "Dirección sintética", calle: "Calle sintética", altura: "123", pisoDepto: "", localidad: "Localidad sintética", provincia: "Provincia sintética", codigoPostal: "1000" };
const response = (direcciones) => async () => ({ ok: true, json: async () => ({ direcciones }) });

test("Georef envía solo campos geográficos y no inventa confianza ni confirma", async () => {
    const geocode = createGeoref({ fetchImpl: async (url) => {
        assert.equal(url.searchParams.get("direccion"), "Calle sintética 123");
        assert.equal(url.searchParams.get("provincia"), address.provincia);
        assert.equal(url.searchParams.has("email"), false);
        return { ok: true, json: async () => ({ direcciones: [{ nomenclatura: "Candidato", ubicacion: { lat: -34, lon: -58 } }] }) };
    } });
    const result = await geocode(address);
    assert.equal(result.status, "approximate");
    assert.equal(result.candidates[0].lat, -34);
    assert.equal(Object.hasOwn(result.candidates[0], "confidence"), false);
});
test("sin resultados, múltiples y sin coordenadas son distintos", async () => {
    assert.equal((await createGeoref({ fetchImpl: response([]) })(address)).status, "zero_results");
    const rows = [{ ubicacion: { lat: null, lon: null } }, { ubicacion: { lat: 300, lon: 200 } }];
    const result = await createGeoref({ fetchImpl: response(rows) })(address);
    assert.equal(result.status, "multiple_results");
    assert.ok(result.candidates.every((row) => row.lat === null));
    assert.equal((await createGeoref({ fetchImpl: response([{}]) })(address)).status, "no_coordinates");
});
test("dirección incompleta rechazada sin consultar proveedor", async () => {
    for (const altura of ["", "0", "S/N", "-1"]) await assert.rejects(createGeoref({ fetchImpl: () => assert.fail("No debe consultar") })({ ...address, altura }), { code: "INCOMPLETE_ADDRESS" });
});
test("timeout, límite y respuesta inválida no producen éxito ficticio", async () => {
    await assert.rejects(createGeoref({ fetchImpl: async () => { throw Object.assign(new Error(), { name: "TimeoutError" }); } })(address), { code: "GEOREF_TIMEOUT" });
    await assert.rejects(createGeoref({ fetchImpl: async () => ({ status: 429 }) })(address), { code: "GEOREF_LIMIT" });
    await assert.rejects(createGeoref({ fetchImpl: async () => ({ ok: true, json: async () => ({}) }) })(address), { code: "GEOREF_INVALID_RESPONSE" });
});
test("confirmación solo vigente para los campos revisados; histórico booleano no basta", () => {
    const row = { direccion_enviada: JSON.stringify({ version: addressVersion(address), observation: "Revisada" }), coordenadas_lat: -34, coordenadas_lng: -58 };
    assert.ok(currentConfirmation(address, row));
    for (const field of Object.keys(address)) assert.equal(currentConfirmation({ ...address, [field]: `${address[field]} editada` }, row), null);
    assert.equal(currentConfirmation(address, { ...row, direccion_enviada: "Dirección histórica" }), null);
    assert.equal(currentConfirmation({ ...address, calle: "" }, row), null);
});

test("huella de carga coincide entre navegador y servidor y cambia tras editar", async () => {
    const { initialAddressVersion } = await import('../../frontend/src/api.js');
    const input = { ...address, pisoDepto: ' ', calle: ' Calle sintética ' };
    const version = await initialAddressVersion(input);
    assert.equal(version, addressVersion({ ...address, addressRevision: 1 }));
    assert.notEqual(version, await initialAddressVersion({ ...input, altura: '124' }));
});
