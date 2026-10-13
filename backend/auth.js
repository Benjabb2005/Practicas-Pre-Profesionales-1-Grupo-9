const express = require("express");
const jwt = require("jsonwebtoken");
const { randomUUID, randomBytes } = require("node:crypto");
const { hashPassword, verifyPassword } = require("./passwords");

const COOKIE = "mandatodo_session";
const HOURS = 8;

function fail(res, status, code, message) {
    return res.status(status).json({ error: { code, message, fields: {} } });
}

function publicUser(user) {
    return { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
}

function readCookie(req) {
    const values = (req.headers.cookie || "").split(";").map((v) => v.trim()).filter((v) => v.startsWith(`${COOKIE}=`));
    if (values.length !== 1) return null;
    return values[0].slice(COOKIE.length + 1);
}

function createAuth({ store, secret, allowedOrigin, secureCookies = false } = {}) {
    const router = express.Router();
    const configured = store && typeof secret === "string" && Buffer.byteLength(secret) >= 32;
    const cookieOptions = { httpOnly: true, sameSite: "lax", secure: secureCookies, path: "/api" };
    // Un hash aleatorio evita saltarse scrypt cuando la cuenta no existe.
    let dummyHash;
    const attempts = new Map();

    router.use((req, res, next) => {
        res.set("Cache-Control", "no-store");
        if (!configured) return fail(res, 503, "AUTH_UNAVAILABLE", "El acceso todavía no está configurado.");
        if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.headers.origin !== allowedOrigin) {
            return fail(res, 403, "ORIGIN_REJECTED", "La solicitud no proviene de la aplicación autorizada.");
        }
        next();
    });

    router.post("/sesion", async (req, res, next) => {
        const now = Date.now();
        for (const [key, value] of attempts) if (value.until <= now) attempts.delete(key);
        const key = req.ip;
        const bucket = attempts.get(key) || { count: 0, until: now + 15 * 60 * 1000 };
        if (bucket.count >= 10 || (!attempts.has(key) && attempts.size >= 10000)) {
            res.set("Retry-After", "900");
            return fail(res, 429, "LOGIN_RATE_LIMIT", "Demasiados intentos. Esperá unos minutos y volvé a intentar.");
        }
        bucket.count++;
        attempts.set(key, bucket);
        const { email, password } = req.body || {};
        if (typeof email !== "string" || email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
            typeof password !== "string" || password.length === 0 || password.length > 128 ||
            Object.keys(req.body).some((k) => !["email", "password"].includes(k))) {
            return fail(res, 400, "INVALID_LOGIN", "Ingresá un email y una contraseña válidos.");
        }
        try {
            const user = await store.findUser(email.trim().toLowerCase());
            const valid = await verifyPassword(password, user?.password_hash || await (dummyHash ||= hashPassword(randomBytes(32).toString("hex"))));
            if (!valid || !user?.activo || !["admin", "operador"].includes(user.rol)) {
                return fail(res, 401, "INVALID_CREDENTIALS", "Usuario o contraseña incorrectos.");
            }
            const jti = randomUUID();
            const token = jwt.sign({}, secret, { algorithm: "HS256", subject: String(user.id), jwtid: jti,
                issuer: "mandatodo", audience: "mandatodo-web", expiresIn: `${HOURS}h` });
            const expiresAt = new Date(jwt.decode(token).exp * 1000);
            await store.createSession(jti, user.id, expiresAt);
            res.cookie(COOKIE, token, { ...cookieOptions, maxAge: HOURS * 3600 * 1000 });
            res.json({ data: { usuario: publicUser(user), expiraEn: expiresAt.toISOString() } });
        } catch (error) { next(error); }
    });

    async function authenticate(req, res, next) {
        let payload;
        try {
            const token = readCookie(req);
            if (!token) throw new Error("Missing cookie");
            payload = jwt.verify(token, secret, { algorithms: ["HS256"], issuer: "mandatodo", audience: "mandatodo-web" });
            if (!payload.jti || !payload.sub || !Number.isInteger(payload.exp)) throw new Error("Invalid claims");
        } catch {
            return fail(res, 401, "SESSION_REQUIRED", "Tu sesión no es válida. Iniciá sesión nuevamente.");
        }
        try {
            const user = await store.findSession(payload.jti);
            if (!user || String(user.id) !== payload.sub || !["admin", "operador"].includes(user.rol)) {
                return fail(res, 401, "SESSION_REQUIRED", "Tu sesión no es válida. Iniciá sesión nuevamente.");
            }
            req.user = publicUser(user);
            req.session = { jti: payload.jti, expiresAt: new Date(payload.exp * 1000).toISOString() };
            next();
        } catch (error) { next(error); }
    }

    router.get("/sesion", authenticate, (req, res) => {
        res.json({ data: { usuario: req.user, expiraEn: req.session.expiresAt } });
    });
    router.delete("/sesion", authenticate, async (req, res, next) => {
        try {
            await store.revokeSession(req.session.jti);
            res.clearCookie(COOKIE, cookieOptions);
            res.sendStatus(204);
        } catch (error) { next(error); }
    });

    // Las próximas rutas operativas deben pasar por authenticate y verificar rol/recurso.
    return { router, authenticate };
}

module.exports = { createAuth };
