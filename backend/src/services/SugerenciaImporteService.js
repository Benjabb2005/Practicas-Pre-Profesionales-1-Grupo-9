const { noEncontrado, errorValidacion } = require('../lib/errors');
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

function calcularSugerencia(latitud, longitud, tarifa) {
    const latitudSucursal = coordenada(tarifa?.sucursal_latitud);
    const longitudSucursal = coordenada(tarifa?.sucursal_longitud);
    if (latitudSucursal === null || longitudSucursal === null || Math.abs(latitudSucursal) > 90 || Math.abs(longitudSucursal) > 180) {
        return { disponible: false, motivo: 'La sucursal no tiene coordenadas configuradas.' };
    }
    const precioCentavos = precioEnCentavos(tarifa.precio_km);
    if (precioCentavos === null) return { disponible: false, motivo: 'No hay un precio por km configurado.' };
    const distanciaDecimos = Math.round(distanciaKm(latitudSucursal, longitudSucursal, latitud, longitud) * 10);
    const importeCentavos = (precioCentavos * BigInt(distanciaDecimos) + 5n) / 10n;
    if (importeCentavos > 999999999999n) {
        return { disponible: false, motivo: 'El importe sugerido supera el máximo permitido. Ingresá un importe manual.' };
    }
    return {
        disponible: true,
        distancia_km: distanciaDecimos / 10,
        precio_km: importeEnPesos(precioCentavos),
        importe_sugerido: importeEnPesos(importeCentavos),
    };
}

function crearSugerenciaImporteService({ pedidos, tarifas }) {
    return {
        async sugerirDuranteCarga({ latitud, longitud }) {
            if (typeof latitud !== 'number' || !Number.isFinite(latitud) || Math.abs(latitud) > 90
                || typeof longitud !== 'number' || !Number.isFinite(longitud) || Math.abs(longitud) > 180) {
                throw errorValidacion({ coordenadas: 'Indicá latitud y longitud válidas.' });
            }
            // El punto es tentativo y sólo se usa para estimar. No consulta pedidos
            // ni confía en precio/importe del navegador; la tarifa sale del servidor.
            return { ...calcularSugerencia(latitud, longitud, await tarifas.obtener()), tentativa: true };
        },
        async sugerir(pedidoId) {
            const pedido = await pedidos.obtenerDetalle(pedidoId);
            if (!pedido) throw noEncontrado('El pedido no existe.');
            if (pedido.estado_validacion !== 'CONFIRMADA') {
                return { disponible: false, motivo: 'La dirección del pedido no está confirmada.' };
            }
            const latitud = coordenada(pedido.latitud), longitud = coordenada(pedido.longitud);
            if (latitud === null || longitud === null) {
                return { disponible: false, motivo: 'La dirección confirmada no tiene coordenadas.' };
            }
            return calcularSugerencia(latitud, longitud, await tarifas.obtener());
        },
    };
}

module.exports = { crearSugerenciaImporteService };
