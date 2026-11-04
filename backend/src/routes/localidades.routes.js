const express = require("express");
const { createLocalidadesController } = require("../controllers/localidades.controller");
const { requiereRol } = require("../middleware/roles");
const { servicioNoDisponible } = require("../lib/errors");
const { ROLES } = require("../constants/roles");

// Sugerencias de localidades contra Georef. El navegador nunca llama a Georef:
// pasa siempre por esta ruta autenticada. Administrador y operador cargan direcciones.
function createLocalidadesRouter(container = {}) {
    const router = express.Router();
    const controller = createLocalidadesController(container);
    const auth = container.auth || ((req, res, next) => next(servicioNoDisponible()));

    router.use(auth, requiereRol(ROLES.ADMINISTRADOR, ROLES.OPERADOR));

    router.get("/", controller.listar);

    return router;
}

module.exports = { createLocalidadesRouter };
