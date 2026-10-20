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
            if (detalle.estado_validacion === "PENDIENTE") {
                throw conflicto("Esta dirección todavía no fue revisada. Guardala de nuevo para validarla antes de buscarla en el mapa.");
            }
            if (detalle.estado_validacion === "CONFIRMADA") {
                throw conflicto("Esta dirección ya está confirmada.");
            }
            if (detalle.estado_validacion !== "VALIDA") {
                throw conflicto("La dirección tiene errores para revisar. Corregila y guardala de nuevo antes de buscarla en el mapa.");
            }

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

            // El resultado del proveedor solo aporta coordenadas y confianza.
            // El estado de validación lo decide el validador al guardar la dirección.
            let nivelConfianza = null;
            let latitud = null;
            let longitud = null;
            if (salida.resultado === "OK" || salida.resultado === "APPROXIMATE") {
                nivelConfianza = salida.nivelConfianza || (salida.resultado === "OK" ? "ALTO" : "MEDIO");
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

            if (detalle.estado_validacion !== "VALIDA") {
                throw conflicto("Solo se puede confirmar una dirección validada. Corregí los errores, guardala de nuevo y geocodificala.");
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
