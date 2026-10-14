// Cualquier ruta no declarada responde 404 con el mismo formato de error.
function notFound(req, res) {
    res.status(404).json({
        error: {
            codigo: "NO_ENCONTRADO",
            mensaje: `No existe la ruta ${req.method} ${req.path}.`,
        },
    });
}

module.exports = { notFound };
