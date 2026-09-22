function notFound(req, res) {
    res.status(404).json({ message: "Ruta no encontrada" });
}

function errorHandler(err, req, res, next) {
    const status = err.status || 500;

    if (status === 500) {
        console.error(err);
    }

    res.status(status).json({ message: err.message || "Error interno del servidor" });
}

module.exports = { notFound, errorHandler };