const { createUsuarioRepository } = require("./repositories/UsuarioRepository");
const { createEstadoPedidoRepository } = require("./repositories/EstadoPedidoRepository");
const { createAuthService } = require("./services/AuthService");
const { createUsuarioService } = require("./services/UsuarioService");
const { createEstadoPedidoService } = require("./services/EstadoPedidoService");
const { createAuthMiddleware } = require("./middleware/auth");

// Construye los servicios a partir de la base inyectada. Sin base (pruebas HTTP)
// devuelve un objeto vacío y las rutas responden 503 en vez de romper.
function createContainer({ db, config } = {}) {
    if (!db || !config) return {};

    const usuarios = createUsuarioRepository(db);
    return {
        config,
        auth: createAuthMiddleware({ config }),
        authService: createAuthService({ usuarios, jwt: config.jwt }),
        usuarioService: createUsuarioService({ usuarios }),
        estadoPedidoService: createEstadoPedidoService({ repositorio: createEstadoPedidoRepository(db) }),
    };
}

module.exports = { createContainer };
