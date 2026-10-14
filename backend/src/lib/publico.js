// Representación pública de un usuario: nunca incluye password_hash.
function usuarioPublico(usuario) {
    return {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
        activo: Boolean(usuario.activo),
    };
}

module.exports = { usuarioPublico };
