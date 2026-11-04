const { ESTADOS, ESTADOS_VALIDOS } = require("../constants/estados");
const { conflicto, noEncontrado, errorValidacion } = require("../lib/errors");

// Transiciones propuestas (D04, pendiente de aval del equipo).
const TRANSICIONES = Object.freeze({
    [ESTADOS.EN_STOCK]: [ESTADOS.EN_PREPARACION],
    [ESTADOS.EN_PREPARACION]: [ESTADOS.EN_ENVIO],
    [ESTADOS.EN_ENVIO]: [ESTADOS.ENTREGADO],
    [ESTADOS.ENTREGADO]: [ESTADOS.PAGADO],
    [ESTADOS.PAGADO]: [],
});

function transicionPermitida(estadoActual, estadoNuevo) {
    return (TRANSICIONES[estadoActual] || []).includes(estadoNuevo);
}

// Único punto de verdad del bloqueo de despacho (D10). Solo una dirección
// CONFIRMADA habilita el paso a EN ENVÍO, se llame desde donde se llame.
function puedeDespacharse(direccion) {
    return Boolean(direccion && direccion.estado_validacion === "CONFIRMADA");
}

function validarTransicion({ estadoActual, estadoNuevo, direccion }) {
    if (!ESTADOS_VALIDOS.includes(estadoNuevo)) {
        throw errorValidacion({ estado: "Estado desconocido." });
    }
    if (estadoNuevo === estadoActual) {
        throw conflicto("El pedido ya está en ese estado.");
    }
    if (!transicionPermitida(estadoActual, estadoNuevo)) {
        throw conflicto(`No se puede pasar de ${estadoActual} a ${estadoNuevo}.`);
    }
    if (estadoNuevo === ESTADOS.EN_ENVIO && !puedeDespacharse(direccion)) {
        throw conflicto("No se puede despachar un pedido sin dirección confirmada.");
    }
}

function createEstadoPedidoService({ repositorio }) {
    return {
        puedeDespacharse,
        validarTransicion,

        async cambiarEstado({ pedidoId, estadoNuevo, usuarioId, observaciones }) {
            const pedido = await repositorio.obtenerPedidoConDireccion(pedidoId);
            if (!pedido) throw noEncontrado("El pedido no existe.");
            validarTransicion({ estadoActual: pedido.estado, estadoNuevo, direccion: pedido });
            await repositorio.registrarCambio({
                pedidoId,
                estadoAnterior: pedido.estado,
                estadoNuevo,
                usuarioId,
                observaciones,
            });
            return { ...pedido, estado: estadoNuevo };
        },
    };
}

module.exports = { createEstadoPedidoService, transicionPermitida, puedeDespacharse, validarTransicion, TRANSICIONES };
