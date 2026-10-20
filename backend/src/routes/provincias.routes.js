const express = require("express");
const { NOMBRES_PROVINCIAS } = require("../constants/provincias");

// Catálogo estático de las 24 jurisdicciones, igual que /api/estados: no expone
// datos personales y evita que el frontend escriba los nombres a mano.
function createProvinciasRouter() {
    const router = express.Router();
    router.get("/", (req, res) => res.json({ provincias: NOMBRES_PROVINCIAS }));
    return router;
}

module.exports = { createProvinciasRouter };
