// Seeder idempotente de usuarios de prueba, uno por rol.
// Las contraseñas se leen del entorno (SEED_<ROL>_PASSWORD) y nunca se versionan
// ni se imprimen. Reejecutar no pisa contraseñas existentes ni duplica usuarios.
import "dotenv/config";
import bcrypt from "bcryptjs";
import mysql from "mysql2/promise";

const CUENTAS = [
    { rol: "ADMINISTRADOR", email: process.env.SEED_ADMIN_EMAIL || "admin@mandatodo.com", nombre: "Administración", variable: "SEED_ADMIN_PASSWORD" },
    { rol: "OPERADOR", email: process.env.SEED_OPERADOR_EMAIL || "operador@mandatodo.com", nombre: "Operaciones", variable: "SEED_OPERADOR_PASSWORD" },
    { rol: "CHOFER", email: process.env.SEED_CHOFER_EMAIL || "chofer@mandatodo.com", nombre: "Chofer de prueba", variable: "SEED_CHOFER_PASSWORD" },
];

function dbConfig() {
    const faltantes = ["DB_HOST", "DB_USER", "DB_NAME"].filter((clave) => !process.env[clave]);
    if (faltantes.length) {
        console.error(`Faltan variables de entorno para sembrar: ${faltantes.join(", ")}.`);
        process.exit(1);
    }
    return {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD ?? "",
        database: process.env.DB_NAME,
    };
}

async function main() {
    const faltantes = CUENTAS.filter((cuenta) => !process.env[cuenta.variable]).map((cuenta) => cuenta.variable);
    if (faltantes.length) {
        console.error(`Faltan contraseñas de seed: ${faltantes.join(", ")}. Definilas en el entorno (nunca en el repo).`);
        process.exit(1);
    }

    const connection = await mysql.createConnection(dbConfig());
    try {
        for (const cuenta of CUENTAS) {
            const [existentes] = await connection.query("SELECT id FROM usuarios WHERE email = ?", [cuenta.email]);
            if (existentes.length) {
                console.log(`Usuario ${cuenta.email} ya existe; no se modifica.`);
                continue;
            }
            const hash = await bcrypt.hash(process.env[cuenta.variable], 10);
            await connection.query(
                "INSERT INTO usuarios (nombre, email, password_hash, rol, activo) VALUES (?, ?, ?, ?, 1)",
                [cuenta.nombre, cuenta.email, hash, cuenta.rol]
            );
            console.log(`Usuario ${cuenta.email} creado con rol ${cuenta.rol}.`);
        }
    } finally {
        await connection.end();
    }
}

main().catch((error) => {
    console.error(`Seed fallido: ${error.code || error.message}`);
    process.exit(1);
});
