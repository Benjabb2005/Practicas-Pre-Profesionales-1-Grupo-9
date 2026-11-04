const express = require("express");
const { createUsuariosController } = require("../controllers/usuarios.controller");
const { requiereRol } = require("../middleware/roles");
const { servicioNoDisponible } = require("../lib/errors");
const { ROLES } = require("../constants/roles");

function createUsuariosRouter(container = {}) {
    const router = express.Router();
    const controller = createUsuariosController(container);
    const auth = container.auth || ((req, res, next) => next(servicioNoDisponible()));

    // Toda la ABM queda restringida al administrador.
    router.use(auth, requiereRol(ROLES.ADMINISTRADOR));

    router.get("/", controller.listar);
    router.post("/", controller.crear);
    router.put("/:id", controller.actualizar);

    return router;
}

module.exports = { createUsuariosRouter };
