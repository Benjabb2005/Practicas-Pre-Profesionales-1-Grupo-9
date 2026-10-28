const express = require("express");
const { createPedidosController } = require("../controllers/pedidos.controller");
const { requiereRol } = require("../middleware/roles");
const { servicioNoDisponible } = require("../lib/errors");
const { ROLES } = require("../constants/roles");

// Carga y revisión de pedidos: administrador y operador. La autorización real vive
// acá, no en la interfaz.
function createPedidosRouter(container = {}) {
    const router = express.Router();
    const controller = createPedidosController(container);
    const auth = container.auth || ((req, res, next) => next(servicioNoDisponible()));

    router.use(auth, requiereRol(ROLES.ADMINISTRADOR, ROLES.OPERADOR));

    router.get("/", controller.listar);
    router.post("/", controller.crear);
    router.put('/:id/importe', controller.completarImporte);
    router.get("/:id", controller.obtener);
    router.put("/:id/direccion", controller.actualizarDireccion);
    router.post("/:id/geocodificar", controller.geocodificar);
    router.post("/:id/rechazar-ubicacion", controller.rechazarUbicacion);
    router.post("/:id/confirmar-direccion", controller.confirmarDireccion);

    return router;
}

module.exports = { createPedidosRouter };
