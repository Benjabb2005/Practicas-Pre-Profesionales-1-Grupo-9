const { createDatabase } = require("./database");
const { loadCliConfig } = require("./cli-config");
const { hashPassword } = require("./passwords");

function validationError(status, code, message, fields = {}) {
    return Object.assign(new Error(message), { status, code, fields });
}

async function createUser(pool, { nombre, email, password, rol }) {
    if (typeof nombre !== "string" || !nombre.trim() || nombre.trim().length > 100 ||
        typeof email !== "string" || email.length > 150 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
        !["admin", "operador"].includes(rol)) throw validationError(422, "INVALID_ACCOUNT", "Completá nombre, email y un rol válido.");
    if (typeof password !== "string" || password.length < 12 || password.length > 128) {
        throw validationError(422, "INVALID_ACCOUNT", "La contraseña debe tener entre 12 y 128 caracteres.", { password: "Usá entre 12 y 128 caracteres." });
    }
    const hash = await hashPassword(password);
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        const [existing] = await connection.execute("SELECT id FROM usuarios WHERE email = ? FOR UPDATE", [email.trim().toLowerCase()]);
        if (existing.length) throw validationError(409, "ACCOUNT_EXISTS", "Ya existe una cuenta con ese email.");
        const [result] = await connection.execute(
            "INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, 1)",
            [nombre.trim(), email.trim().toLowerCase(), hash, rol],
        );
        await connection.commit();
        return result.insertId;
    } catch (error) {
        await connection.rollback();
        if (error.code === "ER_DUP_ENTRY") throw validationError(409, "ACCOUNT_EXISTS", "Ya existe una cuenta con ese email.");
        throw error;
    } finally { connection.release(); }
}

async function main() {
    const config = loadCliConfig();
    let password = process.env.ACCOUNT_PASSWORD;
    delete process.env.ACCOUNT_PASSWORD;
    let account = { nombre: process.env.ACCOUNT_NAME, email: process.env.ACCOUNT_EMAIL, password, rol: process.env.ACCOUNT_ROLE };
    if (!password || process.argv.includes("--admin")) {
        if (!process.stdin.isTTY) throw new Error("Ejecutá este comando desde una consola interactiva.");
        const { createInterface } = require("node:readline/promises");
        const { Writable } = require("node:stream");
        let hidden = false;
        const output = new Writable({ write(chunk, encoding, callback) { if (!hidden) process.stdout.write(chunk, encoding); callback(); } });
        const prompt = createInterface({ input: process.stdin, output, terminal: true });
        try {
            const nombre = await prompt.question("Nombre: ");
            const email = await prompt.question("Email: ");
            const rol = process.argv.includes("--admin") ? "admin" : (await prompt.question("Rol (admin/operador): ")).trim();
            async function askPassword(label) {
                process.stdout.write(label); hidden = true;
                try { return await prompt.question(""); }
                finally { hidden = false; process.stdout.write("\n"); }
            }
            password = await askPassword("Contraseña (12 a 128 caracteres, no se muestra): ");
            const confirmation = await askPassword("Repetí la contraseña: ");
            if (password !== confirmation) throw new Error("Las contraseñas no coinciden.");
            account = { nombre, email, rol, password };
        } finally { prompt.close(); output.end(); }
    }
    const database = createDatabase(config);
    try {
        await createUser(database.pool, account);
        console.log("Cuenta creada. No se imprimen datos de acceso.");
    } finally { await database.close(); }
}

if (require.main === module) main().catch((error) => {
    console.error(error.status ? error.message : "No se pudo crear la cuenta. Revisá datos, coincidencia de contraseñas, consola interactiva y conexión.");
    process.exitCode = 1;
});

module.exports = { createUser };
