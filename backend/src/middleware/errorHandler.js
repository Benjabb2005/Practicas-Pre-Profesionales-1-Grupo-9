const { AppError } = require("../lib/errors");

// Punto único de errores. Devuelve siempre { error: { codigo, mensaje, campos? } }
// y evita filtrar mensajes de MySQL, stack traces o datos personales.
function errorHandler(error, req, res, next) {
    if (res.headersSent) {
        return next(error);
    }

    if (error instanceof AppError) {
        const cuerpo = { codigo: error.codigo, mensaje: error.message };
        if (error.campos) cuerpo.campos = error.campos;
        if (error.posiblesDuplicados) cuerpo.posiblesDuplicados = error.posiblesDuplicados;
        return res.status(error.statusCode).json({ error: cuerpo });
    }

    // JSON mal formado detectado por express.json().
    if (error.type === "entity.parse.failed") {
        return res.status(400).json({
            error: { codigo: "CUERPO_INVALIDO", mensaje: "El cuerpo de la petición no es JSON válido." },
        });
    }

    // Solo se registra información técnica acotada; nunca el cuerpo de la petición.
    console.error(`[error] ${error.name || "Error"}: ${error.message || "sin detalle"}`);
    return res.status(500).json({
        error: { codigo: "ERROR_INTERNO", mensaje: "Ocurrió un error inesperado." },
    });
}

module.exports = { errorHandler };
