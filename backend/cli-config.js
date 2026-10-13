const path = require("node:path");
const dotenv = require("dotenv");

function loadCliConfig() {
    dotenv.config({ path: path.join(__dirname, ".env"), quiet: true });
    dotenv.config({ path: path.join(__dirname, "../.env"), quiet: true });
    const env = process.env;
    return {
        DB_HOST: env.DB_HOST || "127.0.0.1",
        DB_PORT: env.DB_PORT || "3306",
        DB_USER: env.DB_USER || env.MYSQL_USER,
        DB_PASSWORD: env.DB_PASSWORD || env.MYSQL_PASSWORD,
        DB_NAME: env.DB_NAME || env.MYSQL_DATABASE,
    };
}

module.exports = { loadCliConfig };
