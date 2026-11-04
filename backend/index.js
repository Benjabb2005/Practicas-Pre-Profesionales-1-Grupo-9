require("dotenv").config();

const mysql = require("mysql2/promise");

const createApp = require("./app");
const { loadEnv } = require("./src/config/env");

let config;
try {
    config = loadEnv();
} catch (error) {
    console.error(`Configuración inválida: ${error.message}`);
    process.exit(1);
}

const pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
});

const app = createApp({ db: pool, config });

app.listen(config.puerto, () => {
    console.log(`Servidor funcionando en http://localhost:${config.puerto}`);
});

// La prueba de conexión no bloquea el arranque: el servidor responde HTTP
// aunque MySQL todavía no esté listo (lo refleja /api/health).
pool.query("SELECT 1")
    .then(() => console.log("Conexión a MySQL exitosa"))
    .catch((error) => {
        console.error(`No se pudo conectar con MySQL: ${error.code || error.message}`);
    });
