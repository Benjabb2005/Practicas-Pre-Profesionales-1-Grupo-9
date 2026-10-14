const express = require("express");

// Endpoint de readiness: distingue que el HTTP responde de que la base esté disponible.
// Sin base inyectada (pruebas HTTP) informa "no_configurada" y sigue respondiendo 200.
function createHealthRouter({ db } = {}) {
    const router = express.Router();

    router.get("/health", async (req, res) => {
        let estadoDb = "no_configurada";
        if (db) {
            try {
                await db.query("SELECT 1");
                estadoDb = "ok";
            } catch (error) {
                console.error(`[health] MySQL no responde: ${error.code || error.message}`);
                estadoDb = "error";
            }
        }
        const ok = estadoDb !== "error";
        res.status(ok ? 200 : 503).json({
            estado: ok ? "ok" : "degradado",
            servicios: { http: "ok", db: estadoDb },
        });
    });

    return router;
}

module.exports = { createHealthRouter };
