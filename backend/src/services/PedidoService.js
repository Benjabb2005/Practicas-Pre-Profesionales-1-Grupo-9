const { noEncontrado, errorValidacion } = require("../lib/errors");
const { ESTADO_INICIAL } = require("../constants/estados");

// Compone la dirección original legible a partir de los campos estructurados.
// No inventa datos: solo une lo que el operador cargó.
function componerDireccionOriginal(direccion = {}) {
    return [direccion.calle, direccion.altura, direccion.piso_depto, direccion.localidad, direccion.provincia]
        .map((parte) => (parte === undefined || parte === null ? "" : String(parte).trim()))
        .filter(Boolean)
        .join(" ");
}

const CAMPOS_DIRECCION = ["calle", "altura", "piso_depto", "entre_calles", "localidad", "provincia", "codigo_postal"];

// ¿El cambio toca algún campo que hace a la ubicación? Si es así, se invalida la
// confirmación previa (D09/D10). Los campos ausentes o idénticos no cuentan.
function cambioRelevante(actual, nuevo) {
    return CAMPOS_DIRECCION.some((campo) => {
        const valorNuevo = nuevo[campo];
        if (valorNuevo === undefined) return false;
        const normalizado = valorNuevo === null ? null : String(valorNuevo).trim();
        const actualNormalizado = actual[campo] === undefined || actual[campo] === null ? null : String(actual[campo]).trim();
        return normalizado !== actualNormalizado;
    });
}

function normalizarDireccion(direccion) {
    return {
        calle: direccion.calle ?? null,
        altura: direccion.altura ?? null,
        piso_depto: direccion.piso_depto ?? null,
        entre_calles: direccion.entre_calles ?? null,
        localidad: direccion.localidad ?? null,
        provincia: direccion.provincia ?? null,
        codigo_postal: direccion.codigo_postal ?? null,
        direccion_original: direccion.direccion_original || componerDireccionOriginal(direccion) || null,
    };
}

// Carga manual y revisión de pedidos. El despacho seguro se apoya en direcciones
// cuya confirmación es siempre humana; acá nunca se marca una dirección CONFIRMADA.
function createPedidoService({ pedidos, clientes }) {
    return {
        async listar(filtros = {}) {
            return pedidos.listar(filtros);
        },

        async obtener(pedidoId) {
            const detalle = await pedidos.obtenerDetalle(pedidoId);
            if (!detalle) throw noEncontrado("El pedido no existe.");
            return detalle;
        },

        async crear({ cliente_id, canal_origen, observaciones, direccion }, usuarioId) {
            const cliente = await clientes.buscarPorId(cliente_id);
            if (!cliente) throw errorValidacion({ cliente_id: "El cliente indicado no existe." });

            const normalizada = normalizarDireccion(direccion);
            const posiblesDuplicados = await pedidos.detectarDuplicados({
                clienteId: cliente_id,
                calle: normalizada.calle,
                altura: normalizada.altura,
            });

            const pedidoId = await pedidos.crear({
                codigo: null,
                clienteId: cliente_id,
                canalOrigen: canal_origen || "MANUAL",
                estado: ESTADO_INICIAL,
                observaciones: observaciones ?? null,
                creadoPor: usuarioId ?? null,
                direccion: normalizada,
            });

            return { pedido: await pedidos.obtenerDetalle(pedidoId), posiblesDuplicados };
        },

        async actualizarDireccion(pedidoId, direccion) {
            const detalle = await pedidos.obtenerDetalle(pedidoId);
            if (!detalle) throw noEncontrado("El pedido no existe.");
            if (!detalle.direccion_id) throw noEncontrado("El pedido no tiene dirección registrada.");

            const invalidar = detalle.estado_validacion === "CONFIRMADA" && cambioRelevante(detalle, direccion);
            await pedidos.actualizarDireccion(pedidoId, normalizarDireccion(direccion), { invalidar });

            return { pedido: await pedidos.obtenerDetalle(pedidoId), invalidada: invalidar };
        },
    };
}

module.exports = { createPedidoService, componerDireccionOriginal, cambioRelevante };
