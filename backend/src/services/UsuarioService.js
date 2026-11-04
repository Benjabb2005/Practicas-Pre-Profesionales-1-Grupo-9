const bcrypt = require("bcryptjs");
const { noEncontrado, conflicto } = require("../lib/errors");
const { usuarioPublico } = require("../lib/publico");

function createUsuarioService({ usuarios }) {
    return {
        async listar() {
            const filas = await usuarios.listar();
            return filas.map(usuarioPublico);
        },

        async crear({ nombre, email, password, rol }) {
            if (await usuarios.existeEmail(email)) {
                throw conflicto("Ya existe un usuario con ese email.");
            }
            const passwordHash = await bcrypt.hash(password, 10);
            const id = await usuarios.crear({ nombre, email, passwordHash, rol });
            return usuarioPublico(await usuarios.buscarPorId(id));
        },

        async actualizar(id, datos) {
            const actual = await usuarios.buscarPorId(id);
            if (!actual) throw noEncontrado("El usuario no existe.");

            const campos = {};
            if (datos.nombre !== undefined) campos.nombre = datos.nombre;
            if (datos.email !== undefined) {
                if (await usuarios.existeEmail(datos.email, id)) {
                    throw conflicto("Ya existe un usuario con ese email.");
                }
                campos.email = datos.email;
            }
            if (datos.rol !== undefined) campos.rol = datos.rol;
            if (datos.activo !== undefined) campos.activo = datos.activo ? 1 : 0;
            if (datos.password !== undefined) campos.password_hash = await bcrypt.hash(datos.password, 10);

            await usuarios.actualizar(id, campos);
            return usuarioPublico(await usuarios.buscarPorId(id));
        },
    };
}

module.exports = { createUsuarioService };
