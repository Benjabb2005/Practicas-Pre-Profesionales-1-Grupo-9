const { test } = require("node:test");
const assert = require("node:assert/strict");
const { ESTADOS } = require("../src/constants/estados");
const { transicionPermitida, puedeDespacharse, validarTransicion } = require("../src/services/EstadoPedidoService");

test("la transición EN STOCK -> EN PREPARACIÓN es válida y no salta a EN ENVÍO", () => {
    assert.equal(transicionPermitida(ESTADOS.EN_STOCK, ESTADOS.EN_PREPARACION), true);
    assert.equal(transicionPermitida(ESTADOS.EN_STOCK, ESTADOS.EN_ENVIO), false);
});

test("puedeDespacharse solo acepta una dirección CONFIRMADA", () => {
    assert.equal(puedeDespacharse(null), false);
    assert.equal(puedeDespacharse({ estado_validacion: "VALIDADA" }), false);
    assert.equal(puedeDespacharse({ estado_validacion: "VALIDA" }), false);
    assert.equal(puedeDespacharse({ estado_validacion: "CONFIRMADA" }), true);
});

test("no se puede pasar a EN ENVÍO sin dirección confirmada", () => {
    assert.throws(
        () => validarTransicion({ estadoActual: ESTADOS.EN_PREPARACION, estadoNuevo: ESTADOS.EN_ENVIO, direccion: { estado_validacion: "VALIDA" } }),
        (error) => error.codigo === "CONFLICTO"
    );
});

test("se permite EN PREPARACIÓN -> EN ENVÍO con dirección confirmada", () => {
    assert.doesNotThrow(() =>
        validarTransicion({ estadoActual: ESTADOS.EN_PREPARACION, estadoNuevo: ESTADOS.EN_ENVIO, direccion: { estado_validacion: "CONFIRMADA" } })
    );
});

test("no se permiten saltos ni estados desconocidos", () => {
    assert.throws(
        () => validarTransicion({ estadoActual: ESTADOS.EN_STOCK, estadoNuevo: ESTADOS.ENTREGADO, direccion: null }),
        (error) => error.codigo === "CONFLICTO"
    );
    assert.throws(
        () => validarTransicion({ estadoActual: ESTADOS.EN_STOCK, estadoNuevo: "CANCELADO", direccion: null }),
        (error) => error.codigo === "DATOS_INVALIDOS"
    );
});
