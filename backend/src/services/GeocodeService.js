const { noEncontrado, conflicto } = require("../lib/errors");
const { componerDireccionOriginal } = require("./PedidoService");

// Geocodificación y confirmación. Invariante central: ningún resultado automático
// deja una dirección CONFIRMADA; solo la acción humana de confirmar habilita despacho.
function createGeocodeService({ pedidos, adapter }) {
    async function cargarDetalle(pedidoId) {
        const detalle = await pedidos.obtenerDetalle(pedidoId);
        if (!detalle) throw noEncontrado("El pedido no existe.");
        if (!detalle.direccion_id) throw noEncontrado("El pedido no tiene dirección registrada.");
        return detalle;
    }

    return {
        proveedor: adapter.nombre,

        async geocodificar(pedidoId, usuarioId) {
            const detalle = await cargarDetalle(pedidoId);
            const direccion = {
                calle: detalle.calle,
                altura: detalle.altura,
                piso_depto: detalle.piso_depto,
                entre_calles: detalle.entre_calles,
                localidad: detalle.localidad,
                provincia: detalle.provincia,
                codigo_postal: detalle.codigo_postal,
            };
            const direccionEnviada = detalle.direccion_original || componerDireccionOriginal(direccion) || direccion.calle;

            const salida = await adapter.geocodificar(direccion);

            let estadoValidacion = "PENDIENTE";
            let nivelConfianza = null;
            let latitud = null;
            let longitud = null;
            if (salida.resultado === "OK") {
                estadoValidacion = "VALIDA";
                nivelConfianza = salida.nivelConfianza || "ALTO";
                latitud = salida.latitud;
                longitud = salida.longitud;
            } else if (salida.resultado === "APPROXIMATE") {
                estadoValidacion = "CON_ADVERTENCIAS";
                nivelConfianza = salida.nivelConfianza || "MEDIO";
                latitud = salida.latitud;
                longitud = salida.longitud;
            }

            await pedidos.registrarGeocodificacion({
                pedidoId,
                direccionId: detalle.direccion_id,
                direccionEnviada,
                resultado: salida.resultado,
                latitud,
                longitud,
                nivelConfianza,
                estadoValidacion,
                usuarioId: usuarioId ?? null,
            });

            return {
                resultado: salida.resultado,
                motivo: salida.motivo ?? null,
                proveedor: adapter.nombre,
                pedido: await pedidos.obtenerDetalle(pedidoId),
            };
        },

        async confirmar(pedidoId, usuarioId) {
            const detalle = await cargarDetalle(pedidoId);

            if (!["VALIDA", "CON_ADVERTENCIAS"].includes(detalle.estado_validacion)) {
                throw conflicto("Solo se puede confirmar una dirección ya geocodificada (con resultado).");
            }
            if (detalle.latitud === null || detalle.latitud === undefined || detalle.longitud === null || detalle.longitud === undefined) {
                throw conflicto("La dirección no tiene coordenadas para confirmar.");
            }

            await pedidos.confirmarDireccion({
                pedidoId,
                direccionId: detalle.direccion_id,
                direccionEnviada: detalle.direccion_original || componerDireccionOriginal(detalle) || detalle.calle,
                latitud: detalle.latitud,
                longitud: detalle.longitud,
                nivelConfianza: detalle.nivel_confianza,
                usuarioId: usuarioId ?? null,
            });

            return pedidos.obtenerDetalle(pedidoId);
        },
    };
}

module.exports = { createGeocodeService };
