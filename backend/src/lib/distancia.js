const RADIO_TERRESTRE_KM = 6371;

function distanciaKm(lat1, lon1, lat2, lon2) {
    const latitud1 = Number(lat1);
    const longitud1 = Number(lon1);
    const latitud2 = Number(lat2);
    const longitud2 = Number(lon2);

    const radianes = (grados) => (grados * Math.PI) / 180;
    const diferenciaLatitud = radianes(latitud2 - latitud1);
    const diferenciaLongitud = radianes(longitud2 - longitud1);
    const senoLatitud = Math.sin(diferenciaLatitud / 2);
    const senoLongitud = Math.sin(diferenciaLongitud / 2);
    const haversine = senoLatitud ** 2
        + Math.cos(radianes(latitud1)) * Math.cos(radianes(latitud2)) * senoLongitud ** 2;
    const valorLimitado = Math.min(1, Math.max(0, haversine));
    const angulo = 2 * Math.atan2(Math.sqrt(valorLimitado), Math.sqrt(1 - valorLimitado));

    return RADIO_TERRESTRE_KM * angulo;
}

module.exports = { distanciaKm };
