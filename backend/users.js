const express = require("express");
const { createUser } = require("./create-user");

function createUserStore(pool) {
    return {
        async list() {
            const [rows] = await pool.query("SELECT id, nombre, email, rol, activo FROM usuarios ORDER BY nombre, id LIMIT 100");
            return rows;
        },
        async create(input) {
            const id = await createUser(pool, input);
            return { id, nombre: input.nombre.trim(), email: input.email.trim().toLowerCase(), rol: input.rol, activo: 1 };
        },
    };
}

function createUsers({ store, authenticate }) {
    const router = express.Router();
    router.use(authenticate);
    router.use((req, res, next) => {
        if (req.user.rol !== "admin") return res.status(403).json({ error: { code: "FORBIDDEN", message: "Solo un administrador puede gestionar usuarios.", fields: {} } });
        next();
    });
    router.get("/", async (req, res, next) => {
        try { res.json({ data: await store.list() }); }
        catch (error) { next(error); }
    });
    router.post("/", async (req, res, next) => {
        try {
            if (!req.body || Array.isArray(req.body) || typeof req.body !== "object" ||
                Object.keys(req.body).some((key) => !["nombre", "email", "rol", "password"].includes(key))) {
                return res.status(400).json({ error: { code: "INVALID_ACCOUNT", message: "La solicitud contiene campos no admitidos.", fields: {} } });
            }
            res.status(201).json({ data: await store.create(req.body) });
        } catch (error) { next(error); }
    });
    return router;
}

module.exports = { createUserStore, createUsers };
