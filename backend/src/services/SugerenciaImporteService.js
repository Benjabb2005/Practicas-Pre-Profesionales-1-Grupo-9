const { noEncontrado } = require('../lib/errors');
const { distanciaKm } = require('../lib/distancia');

function coordenada(valor) {
    if (valor === null || valor === undefined || String(valor).trim() === '') return null;
    const numero = Number(valor);
    return Number.isFinite(numero) ? numero : null;
}

function precioEnCentavos(valor) {
    const texto = String(valor ?? '');
    if (!/^\d{1,10}(?:\.\d{1,2})?$/.test(texto)) return null;
    const [entero, decimales = ''] = texto.split('.');
    const centavos = BigInt(entero) * 100n + BigInt(decimales.padEnd(2, '0'));
    return centavos > 0n ? centavos : null;
}

function importeEnPesos(centavos) {
    return `${centavos / 100n}.${String(centavos % 100n).padStart(2, '0')}`;
}

function crearSugerenciaImporteService({ pedidos, tarifas }) {
    return {
        async sugerir(pedidoId) {
            const pedido = await pedidos.obtenerDetalle(pedidoId);
            if (!pedido) throw noEncontrado('El pedido no existe.');

            if (pedido.estado_validacion !== 'CONFIRMADA') {
                return { disponible: false, motivo: 'La dirección del pedido no está confirmada.' };
            }

            const latitudPedido = coordenada(pedido.latitud);
            const longitudPedido = coordenada(pedido.longitud);
            if (latitudPedido === null || longitudPedido === null) {
                return { disponible: false, motivo: 'La dirección confirmada no tiene coordenadas.' };
            }

            const tarifa = await tarifas.obtener();
            const latitudSucursal = coordenada(tarifa?.sucursal_latitud);
            const longitudSucursal = coordenada(tarifa?.sucursal_longitud);
            if (latitudSucursal === null || longitudSucursal === null) {
                return { disponible: false, motivo: 'La sucursal no tiene coordenadas configuradas.' };
            }

            const precioCentavos = precioEnCentavos(tarifa.precio_km);
            if (precioCentavos === null) {
                return { disponible: false, motivo: 'No hay un precio por km configurado.' };
            }

            const distanciaSinRedondear = distanciaKm(
                latitudSucursal,
                longitudSucursal,
                latitudPedido,
                longitudPedido
            );
            const distanciaDecimos = Math.round(distanciaSinRedondear * 10);
            const importeCentavos = (precioCentavos * BigInt(distanciaDecimos) + 5n) / 10n;

            return {
                disponible: true,
                distancia_km: distanciaDecimos / 10,
                precio_km: importeEnPesos(precioCentavos),
                importe_sugerido: importeEnPesos(importeCentavos),
            };
        },
    };
}

module.exports = { crearSugerenciaImporteService };
