const express = require("express");
const { createAuth } = require("./auth");
const { createOrders } = require("./orders");
const { createUsers } = require("./users");
const { createDispatch } = require("./dispatch");
const { createDeliveries } = require('./deliveries');

// Las dependencias reales se inyectan desde index.js, nunca al importar la app.
function createApp({ checkDatabase, readinessTimeoutMs = 2500, auth, orders, users, dispatch, deliveries } = {}) {
    const app = express();
    app.disable("x-powered-by");

    app.get("/", (req, res) => {
        res.send("Backend de MandáTodo funcionando con docker uwu");
    });

    app.get("/health/live", (req, res) => {
        res.set("Cache-Control", "no-store");
        res.json({ data: { status: "ok" } });
    });

    app.get("/health/ready", async (req, res) => {
        res.set("Cache-Control", "no-store");
        let timer;
        try {
            if (typeof checkDatabase !== "function") throw new Error("Unavailable");
            const available = await Promise.race([
                Promise.resolve().then(checkDatabase),
                new Promise((resolve) => {
                    timer = setTimeout(() => resolve(false), readinessTimeoutMs);
                }),
            ]);
            if (available !== true) throw new Error("Unavailable");
            // Hasta implementar migraciones, esto acredita conectividad, no esquema.
            res.json({ data: { status: "ok", database: "available", scope: "database" } });
        } catch {
            res.status(503).json({
                error: { code: "DATABASE_UNAVAILABLE", message: "La base de datos no está disponible.", fields: {} },
            });
        } finally {
            clearTimeout(timer);
        }
    });

    app.use(express.json({ limit: "16kb" }));
    const access = createAuth(auth);
    app.use("/api", access.router);
    if (deliveries) app.use('/api', createDeliveries({ store: deliveries, authenticate: access.authenticate }));
    if (users) app.use("/api/usuarios", createUsers({ store: users, authenticate: access.authenticate }));
    if (dispatch) app.use('/api', createDispatch({ store: dispatch, authenticate: access.authenticate }));
    if (orders) app.use("/api", createOrders({ store: orders, authenticate: access.authenticate }));
    app.use((error, req, res, next) => {
        if (res.headersSent) return next(error);
        if (error.status && error.code && error.fields) {
            return res.status(error.status).json({ error: { code: error.code, message: error.message, fields: error.fields } });
        }
        if (error.type === "entity.too.large") {
            return res.status(413).json({ error: { code: "BODY_TOO_LARGE", message: "La solicitud es demasiado grande.", fields: {} } });
        }
        if (error.type === "entity.parse.failed") {
            return res.status(400).json({ error: { code: "INVALID_JSON", message: "La solicitud no tiene un formato válido.", fields: {} } });
        }
        res.status(503).json({ error: { code: "SERVICE_UNAVAILABLE", message: "El servicio no está disponible. Volvé a intentar.", fields: {} } });
    });
    return app;
}

module.exports = createApp();
module.exports.createApp = createApp;
