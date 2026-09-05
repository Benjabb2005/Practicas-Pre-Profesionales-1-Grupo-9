require("dotenv").config();

const express = require("express");
const mysql = require("mysql2");

const app = express();
const PORT = process.env.PORT || 3000;

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

db.connect((error) => {
    if (error) {
        console.error("Error al conectar con MySQL:");
        console.error(error.message);
        return;
    }

    console.log("Conexión a MySQL exitosa");
});

app.get("/", (req, res) => {
    res.send("Backend de MandáTodo funcionando");
});

app.listen(PORT, () => {
    console.log(`Servidor funcionando en http://localhost:${PORT}`);
});