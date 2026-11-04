const jwt = require("jsonwebtoken");
const { noAutenticado } = require("../lib/errors");

// Verifica el token Bearer y deja el usuario en req.usuario.
function createAuthMiddleware({ config }) {
    return function auth(req, res, next) {
        const header = req.headers.authorization || "";
        const [tipo, token] = header.split(" ");
        if (tipo !== "Bearer" || !token) {
            return next(noAutenticado());
        }
        try {
            const payload = jwt.verify(token, config.jwt.secret);
            req.usuario = { id: payload.sub, rol: payload.rol, email: payload.email };
            return next();
        } catch (error) {
            return next(noAutenticado());
        }
    };
}

module.exports = { createAuthMiddleware };
