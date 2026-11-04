const express = require("express");
const { ESTADOS_VALIDOS } = require("../constants/estados");

// Catálogo de estados para que el frontend no escriba strings a mano.
function createEstadosRouter() {
    const router = express.Router();
    router.get("/", (req, res) => res.json({ estados: ESTADOS_VALIDOS }));
    return router;
}

module.exports = { createEstadosRouter };
