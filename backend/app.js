const express = require("express");
const cors = require("cors");
const addressRoutes = require("./routes/address.routes");
const { notFound, errorHandler } = require("./middlewares/error.middleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Backend de MandáTodo funcionando con docker uwu");
});

app.use("/api/addresses", addressRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;