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

        async geocodificar(pedidoId, usuarioId, indiceCandidato = null) {
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
            const candidatos = salida.candidatos || (
                Number.isFinite(Number(salida.latitud)) && Number.isFinite(Number(salida.longitud))
                    ? [{ indice: 0, latitud: Number(salida.latitud), longitud: Number(salida.longitud), nivelConfianza: salida.nivelConfianza || (salida.resultado === "OK" ? "ALTO" : "MEDIO"), direccion: salida.direccion_normalizada || direccionEnviada }]
                    : []
            );
            const seleccionado = indiceCandidato === null
                ? (candidatos.length === 1 ? candidatos[0] : null)
                : candidatos.find((candidato) => candidato.indice === indiceCandidato);
            if (indiceCandidato !== null && !seleccionado) {
                throw conflicto("La opción elegida ya no está disponible. Volvé a buscar la dirección.");
            }
            if (seleccionado) {
                nivelConfianza = seleccionado.nivelConfianza;
                latitud = seleccionado.latitud;
                longitud = seleccionado.longitud;
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
                accionOperador: indiceCandidato === null ? null : "CORRIGIO",
            });

            return {
                resultado: salida.resultado,
                motivo: salida.motivo ?? null,
                proveedor: adapter.nombre,
                candidatos: candidatos.length > 1 && !seleccionado ? candidatos : [],
                ambiguo: candidatos.length > 1 && !seleccionado,
                pedido: await pedidos.obtenerDetalle(pedidoId),
            };
        },

        async rechazar(pedidoId, usuarioId) {
            const detalle = await cargarDetalle(pedidoId);
            if (detalle.estado_validacion === "CONFIRMADA") throw conflicto("La dirección ya está confirmada.");
            if (detalle.latitud === null || detalle.latitud === undefined) throw conflicto("Primero buscá la dirección en el mapa.");
            await pedidos.registrarAccionGeolocalizacion({ direccionId: detalle.direccion_id, usuarioId: usuarioId ?? null, accionOperador: "RECHAZO" });
            return pedidos.obtenerDetalle(pedidoId);
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
