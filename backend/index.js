require("dotenv").config();

const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 3000;

(async () => {
    try {
        await pool.query("SELECT 1");
        console.log("Conexión a MySQL exitosa");

        app.listen(PORT, () => {
            console.log(`Servidor funcionando en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("Error al conectar con MySQL:");
        console.error(error.message);
        process.exit(1);
    }
})();