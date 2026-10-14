const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { noAutenticado } = require("../lib/errors");
const { usuarioPublico } = require("../lib/publico");

// Hash ficticio para igualar el tiempo de respuesta cuando el email no existe.
// No es una credencial: se usa solo para evitar filtrar qué emails están registrados.
const HASH_SENAL = bcrypt.hashSync("senal-de-tiempo-no-usar", 10);

function createAuthService({ usuarios, jwt: jwtConfig }) {
    return {
        async login({ email, password }) {
            const usuario = await usuarios.buscarPorEmail(email);
            const hash = usuario ? usuario.password_hash : HASH_SENAL;
            const coincide = await bcrypt.compare(password, hash);

            // Mismo mensaje para usuario inexistente, inactivo o contraseña errónea.
            if (!usuario || !usuario.activo || !coincide) {
                throw noAutenticado("Usuario o contraseña incorrectos.");
            }

            const token = jwt.sign(
                { sub: usuario.id, rol: usuario.rol, email: usuario.email },
                jwtConfig.secret,
                { expiresIn: jwtConfig.expiraEn }
            );
            return { token, usuario: usuarioPublico(usuario) };
        },

        async me(usuarioId) {
            const usuario = await usuarios.buscarPorId(usuarioId);
            if (!usuario || !usuario.activo) throw noAutenticado();
            return usuarioPublico(usuario);
        },
    };
}

module.exports = { createAuthService };
