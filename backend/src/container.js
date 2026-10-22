const { createUsuarioRepository } = require("./repositories/UsuarioRepository");
const { createEstadoPedidoRepository } = require("./repositories/EstadoPedidoRepository");
const { createClienteRepository } = require("./repositories/ClienteRepository");
const { createPedidoRepository } = require("./repositories/PedidoRepository");
const { createAuthService } = require("./services/AuthService");
const { createUsuarioService } = require("./services/UsuarioService");
const { createEstadoPedidoService } = require("./services/EstadoPedidoService");
const { createClienteService } = require("./services/ClienteService");
const { createPedidoService } = require("./services/PedidoService");
const { createGeocodeService } = require("./services/GeocodeService");
const { createLocalidadService } = require("./services/LocalidadService");
const { createGeocodeAdapter } = require("./geocode");
const { createGeorefClient } = require("./georef/localidades");
const { createAuthMiddleware } = require("./middleware/auth");

// Construye los servicios a partir de la base inyectada. Sin base (pruebas HTTP)
// devuelve un objeto vacío y las rutas responden 503 en vez de romper.
// `georef` se puede inyectar para probar sin internet.
function createContainer({ db, config, georef } = {}) {
    if (!db || !config) return {};

    const usuarios = createUsuarioRepository(db);
    const clientes = createClienteRepository(db);
    const pedidos = createPedidoRepository(db);
    const geocodeAdapter = createGeocodeAdapter(config.geocode);
    const georefClient = georef || createGeorefClient(config.georef);
    const localidadService = createLocalidadService({ cliente: georefClient });

    return {
        config,
        auth: createAuthMiddleware({ config }),
        authService: createAuthService({ usuarios, jwt: config.jwt }),
        usuarioService: createUsuarioService({ usuarios }),
        estadoPedidoService: createEstadoPedidoService({ repositorio: createEstadoPedidoRepository(db) }),
        clienteService: createClienteService({ clientes }),
        pedidoService: createPedidoService({
            pedidos,
            clientes,
            localidades: localidadService,
            ventanaDuplicadosHoras: config.duplicados?.ventanaHoras,
        }),
        geocodeService: createGeocodeService({ pedidos, adapter: geocodeAdapter }),
        localidadService,
    };
}

module.exports = { createContainer };
