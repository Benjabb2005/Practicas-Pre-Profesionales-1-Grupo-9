const mysql = require("mysql2/promise");

// Pool creado solo por el arranque real. SELECT 1 no modifica datos.
function createDatabase(env = process.env) {
    const pool = mysql.createPool({
        host: env.DB_HOST,
        port: Number(env.DB_PORT || 3306),
        user: env.DB_USER,
        password: env.DB_PASSWORD,
        database: env.DB_NAME,
        connectionLimit: 5,
        waitForConnections: true,
        queueLimit: 10,
        connectTimeout: 2000,
        timezone: "Z",
    });
    pool.pool.on("connection", (connection) => {
        connection.query("SET time_zone = '+00:00'");
    });

    return {
        pool,
        async checkDatabase() {
            await pool.query({ sql: "SELECT 1", timeout: 2000 });
            return true;
        },
        close() {
            return pool.end();
        },
    };
}

module.exports = { createDatabase };
