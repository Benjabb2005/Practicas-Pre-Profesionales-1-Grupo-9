const express = require("express");
const { createAuthController } = require("../controllers/auth.controller");
const { servicioNoDisponible } = require("../lib/errors");

function createAuthRouter(container = {}) {
    const router = express.Router();
    const controller = createAuthController(container);
    const auth = container.auth || ((req, res, next) => next(servicioNoDisponible()));

    router.post("/login", controller.login);
    router.get("/me", auth, controller.me);

    return router;
}

module.exports = { createAuthRouter };
