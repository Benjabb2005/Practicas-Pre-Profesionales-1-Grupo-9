// Carga y valida la configuración por entorno. No tiene valores secretos por defecto:
// si falta algo obligatorio, falla con un mensaje claro antes de arrancar.
function leerEnteroPositivo(valor, porDefecto) {
    const numero = Number(valor ?? porDefecto);
    return Number.isInteger(numero) && numero > 0 ? numero : porDefecto;
}

function loadEnv(env = process.env) {
    const config = {
        entorno: env.NODE_ENV || "development",
        puerto: leerEnteroPositivo(env.PORT, 3000),
        db: {
            host: env.DB_HOST,
            port: leerEnteroPositivo(env.DB_PORT, 3306),
            user: env.DB_USER,
            password: env.DB_PASSWORD ?? "",
            database: env.DB_NAME,
        },
        jwt: {
            secret: env.JWT_SECRET,
            expiraEn: env.JWT_EXPIRES_IN || "8h",
        },
        geocode: {
            proveedor: env.GEOCODE_PROVIDER || "nominatim",
            baseUrl: env.GEOCODE_BASE_URL || "https://nominatim.openstreetmap.org",
            userAgent: env.GEOCODE_USER_AGENT || "Mandatodo-MVP1",
            timeoutMs: leerEnteroPositivo(env.GEOCODE_TIMEOUT_MS, 5000),
        },
        duplicados: {
            // Ventana usada para avisar pedidos del mismo cliente y dirección.
            ventanaHoras: leerEnteroPositivo(env.DUPLICADOS_VENTANA_HORAS, 24),
        },
        georef: {
            baseUrl: env.GEOREF_BASE_URL || "https://apis.datos.gob.ar/georef/api",
            timeoutMs: leerEnteroPositivo(env.GEOREF_TIMEOUT_MS, 3000),
        },
    };

    const faltantes = [];
    const obligatorias = [
        ["DB_HOST", config.db.host],
        ["DB_USER", config.db.user],
        ["DB_NAME", config.db.database],
        ["JWT_SECRET", config.jwt.secret],
    ];
    for (const [clave, valor] of obligatorias) {
        if (valor === undefined || valor === "") faltantes.push(clave);
    }
    if (faltantes.length) {
        const error = new Error(`Faltan variables de entorno obligatorias: ${faltantes.join(", ")}. Revisá .env.example.`);
        error.codigo = "CONFIG_INVALIDA";
        throw error;
    }

    return config;
}

module.exports = { loadEnv };
