const { noAutenticado, noAutorizado } = require("../lib/errors");

// Autorización por rol: la regla real vive en el servidor, no en la interfaz.
function requiereRol(...rolesPermitidos) {
    return function (req, res, next) {
        if (!req.usuario) return next(noAutenticado());
        if (!rolesPermitidos.includes(req.usuario.rol)) return next(noAutorizado());
        return next();
    };
}

module.exports = { requiereRol };
