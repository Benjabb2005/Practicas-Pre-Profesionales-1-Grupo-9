const { noEncontrado, errorValidacion } = require("../lib/errors");
const { ESTADO_INICIAL } = require("../constants/estados");
const { normalizarDireccion: normalizarCamposDireccion } = require("./NormalizadorDireccion");
const { validarDireccion } = require("./ValidadorDireccion");

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

// La dirección original se compone con el texto crudo del operario, antes de
// normalizar los campos estructurados: así conserva lo que realmente escribió.
function prepararDireccion(direccion) {
    const datos = direccion || {};
    const direccionOriginal = datos.direccion_original || componerDireccionOriginal(datos) || null;
    const normalizada = normalizarCamposDireccion(datos);

    return {
        calle: normalizada.calle ?? null,
        altura: normalizada.altura ?? null,
        piso_depto: normalizada.piso_depto ?? null,
        entre_calles: normalizada.entre_calles ?? null,
        localidad: normalizada.localidad ?? null,
        provincia: normalizada.provincia ?? null,
        codigo_postal: normalizada.codigo_postal ?? null,
        direccion_original: direccionOriginal,
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

            const preparada = prepararDireccion(direccion);
            const { estado, problemas } = validarDireccion(preparada);
            const direccionValidada = { ...preparada, estado_validacion: estado };

            const posiblesDuplicados = await pedidos.detectarDuplicados({
                clienteId: cliente_id,
                calle: direccionValidada.calle,
                altura: direccionValidada.altura,
            });

            const pedidoId = await pedidos.crear({
                codigo: null,
                clienteId: cliente_id,
                canalOrigen: canal_origen || "MANUAL",
                estado: ESTADO_INICIAL,
                observaciones: observaciones ?? null,
                creadoPor: usuarioId ?? null,
                direccion: direccionValidada,
            });

            return { pedido: await pedidos.obtenerDetalle(pedidoId), posiblesDuplicados, problemas };
        },

        async actualizarDireccion(pedidoId, direccion) {
            const detalle = await pedidos.obtenerDetalle(pedidoId);
            if (!detalle) throw noEncontrado("El pedido no existe.");
            if (!detalle.direccion_id) throw noEncontrado("El pedido no tiene dirección registrada.");

            const preparada = prepararDireccion(direccion);
            const { estado, problemas } = validarDireccion(preparada);
            const cambio = cambioRelevante(normalizarCamposDireccion(detalle), preparada);

            const invalidar = detalle.estado_validacion === "CONFIRMADA" && cambio;
            // Si cambia la dirección, las coordenadas pertenecen a la versión anterior
            // y no sirven para confirmar la ubicación nueva, aunque no estuviera confirmada.
            const descartarCoordenadas = cambio;
            const estadoFinal = detalle.estado_validacion === "CONFIRMADA" && !invalidar
                ? "CONFIRMADA"
                : estado;

            await pedidos.actualizarDireccion(
                pedidoId,
                { ...preparada, estado_validacion: estadoFinal },
                { invalidar, descartarCoordenadas }
            );

            return { pedido: await pedidos.obtenerDetalle(pedidoId), invalidada: invalidar, problemas };
        },
    };
}

module.exports = { createPedidoService, componerDireccionOriginal, cambioRelevante };
