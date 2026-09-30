const express = require("express");

// Separar la aplicación del arranque permite probar HTTP sin abrir MySQL.
const app = express();

app.get("/", (req, res) => {
    res.send("Backend de MandáTodo funcionando con docker uwu");
});

module.exports = app;
