const express = require("express");
const { createClientesController } = require("../controllers/clientes.controller");
const { requiereRol } = require("../middleware/roles");
const { servicioNoDisponible } = require("../lib/errors");
const { ROLES } = require("../constants/roles");

// Clientes accesibles para administrador y operador (insumo del alta de pedidos).
function createClientesRouter(container = {}) {
    const router = express.Router();
    const controller = createClientesController(container);
    const auth = container.auth || ((req, res, next) => next(servicioNoDisponible()));

    router.use(auth, requiereRol(ROLES.ADMINISTRADOR, ROLES.OPERADOR));
    router.get("/", controller.listar);

    return router;
}

module.exports = { createClientesRouter };
