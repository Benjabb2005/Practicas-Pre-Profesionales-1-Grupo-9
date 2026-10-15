const express = require("express");
const { createContainer } = require("./src/container");
const { createHealthRouter } = require("./src/routes/health.routes");
const { createAuthRouter } = require("./src/routes/auth.routes");
const { createUsuariosRouter } = require("./src/routes/usuarios.routes");
const { createEstadosRouter } = require("./src/routes/estados.routes");
const { createPedidosRouter } = require("./src/routes/pedidos.routes");
const { createClientesRouter } = require("./src/routes/clientes.routes");
const { notFound } = require("./src/middleware/notFound");
const { errorHandler } = require("./src/middleware/errorHandler");

// Separar la aplicación del arranque permite probar HTTP sin abrir MySQL.
// Las dependencias (db, config) se inyectan para poder sustituirlas en las pruebas.
function createApp(deps = {}) {
    const app = express();
    const container = createContainer(deps);

    app.disable("x-powered-by");
    app.use(express.json({ limit: "1mb" }));

    app.get("/", (req, res) => {
        res.send("Backend de MandáTodo funcionando con docker uwu");
    });

    app.use("/api", createHealthRouter(deps));
    app.use("/api/auth", createAuthRouter(container));
    app.use("/api/usuarios", createUsuariosRouter(container));
    app.use("/api/estados", createEstadosRouter());
    app.use("/api/pedidos", createPedidosRouter(container));
    app.use("/api/clientes", createClientesRouter(container));

    app.use(notFound);
    app.use(errorHandler);

    return app;
}

module.exports = createApp;
