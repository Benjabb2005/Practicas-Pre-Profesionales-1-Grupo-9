require("dotenv").config();
if (!process.env.SESSION_SECRET && process.env.SESSION_SECRET_FILE) {
    process.env.SESSION_SECRET = require('node:fs').readFileSync(process.env.SESSION_SECRET_FILE, 'utf8').trim();
}

const { createApp } = require("./app");
const { createDatabase } = require("./database");
const { createAuthStore } = require("./auth-store");
const { createOrderStore } = require("./orders");
const { createUserStore } = require("./users");
const { createDispatchStore } = require('./dispatch');
const { createDeliveryStore } = require('./deliveries');
const PORT = process.env.PORT || 3000;
const database = createDatabase();
const app = createApp({
    checkDatabase: database.checkDatabase,
    orders: createOrderStore(database.pool),
    users: createUserStore(database.pool),
    dispatch: createDispatchStore(database.pool),
    deliveries: createDeliveryStore(database.pool),
    auth: {
        store: createAuthStore(database.pool),
        secret: process.env.SESSION_SECRET,
        allowedOrigin: process.env.APP_ORIGIN || "http://localhost:5173",
        secureCookies: process.env.COOKIE_SECURE === "true",
    },
});
const server = app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});

let stopping = false;
function shutdown() {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => process.exit(1), 5000);
    deadline.unref();
    server.close(async () => {
        try {
            await database.close();
            clearTimeout(deadline);
        } catch {
            console.error("No se pudo cerrar la conexión a la base de datos.");
            process.exitCode = 1;
        }
    });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
