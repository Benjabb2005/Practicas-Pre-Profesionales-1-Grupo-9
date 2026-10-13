const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validateOrder } = require("../orders");
const { addressVersion } = require("../orders");

function valid() {
    return { cliente: { nombre: "Nombre sintético", apellido: "Apellido sintético", dni: "80000001", telefono: "1100000001", email: "fixture@example.invalid" },
        direccion: { direccionOriginal: "Dirección ficticia 123", calle: "Calle ficticia", altura: "123", pisoDepto: "", localidad: "Localidad ficticia", provincia: "Provincia ficticia", codigoPostal: "1000" } };
}

test("pedido completo acepta piso/departamento y notas vacíos", () => {
    const parsed = validateOrder(valid());
    assert.equal(parsed.direccion.pisoDepto, "");
    assert.equal(parsed.observaciones, "");
    assert.equal(Object.hasOwn(parsed, "reconocerDuplicado"), false);
});

test("dirección original conserva espacios y texto recibido", () => {
    const input = valid(); input.direccion.direccionOriginal = "  Dirección recibida, tal cual  ";
    assert.equal(validateOrder(input).direccion.direccionOriginal, input.direccion.direccionOriginal);
});

test("cada campo obligatorio se valida sin depender del navegador", () => {
    for (const section of ["cliente", "direccion"]) {
        for (const field of Object.keys(valid()[section]).filter((key) => !["pisoDepto", "direccionOriginal"].includes(key))) {
            const input = valid(); input[section][field] = "";
            assert.throws(() => validateOrder(input), (error) => error.status === 422 && Object.hasOwn(error.fields, field), field);
        }
    }
});

test("dirección original es opcional y no se inventa", () => {
    const empty = valid(); empty.direccion.direccionOriginal = '';
    assert.equal(validateOrder(empty).direccion.direccionOriginal, '');
    delete empty.direccion.direccionOriginal;
    assert.equal(validateOrder(empty).direccion.direccionOriginal, '');
});

test("altura cero, negativa, decimal, S/N o esquina no puede guardarse", () => {
    for (const altura of ["0", "-1", "1.5", "S/N", "esquina", "9007199254740992"]) {
        const input = valid(); input.direccion.altura = altura;
        assert.throws(() => validateOrder(input), (error) => Object.hasOwn(error.fields, "altura"));
    }
});

test("tipos inválidos, campos de estado/confianza y reconocimiento implícito rechazados", () => {
    for (const input of [null, [], { ...valid(), estado: "listo_despacho" }, { ...valid(), reconocerDuplicado: true }, { ...valid(), reconocerDuplicado: false },
        { ...valid(), clienteId: "1" }, { ...valid(), direccion: { ...valid().direccion, confirmado: true } }]) {
        assert.throws(() => validateOrder(input));
    }
});

test("DNI, email, contacto y tamaños inválidos se rechazan", () => {
    for (const [field, value] of [["dni", "S/D"], ["email", "invalido"], ["telefono", "abc"], ["apellido", "x".repeat(101)]]) {
        const input = valid(); input.cliente[field] = value;
        assert.throws(() => validateOrder(input), (error) => Object.hasOwn(error.fields, field));
    }
});

test("confirmación en carga exige coordenadas/observación y la dirección revisada", () => {
    const input = valid();
    input.ubicacion = { version: addressVersion({ ...input.direccion, addressRevision: 1 }), lat: -34, lng: -58, observation: 'Revisión sintética' };
    assert.ok(validateOrder(input).ubicacion);
    assert.throws(() => validateOrder({ ...input, direccion: { ...input.direccion, altura: '124' } }), { code: 'ADDRESS_CHANGED' });
    assert.throws(() => validateOrder({ ...input, ubicacion: { ...input.ubicacion, observation: '' } }), { code: 'INVALID_CONFIRMATION' });
});
