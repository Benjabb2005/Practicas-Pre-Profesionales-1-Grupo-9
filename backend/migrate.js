const { readFileSync } = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { createDatabase } = require("./database");
const { loadCliConfig } = require("./cli-config");

const tables = ["clientes", "direcciones", "pedidos", "historial_geolocalizacion", "historial_estados", "usuarios"];
const files = ["001_sesiones.sql", "002_carga_pedidos.sql", "003_revision_direccion.sql", "004_asignacion_despacho.sql"];

function statements(text) {
    return text.replace(/^--.*$/gm, "").split(";").map((s) => s.trim()).filter(Boolean);
}

async function migrate(pool, { apply = false } = {}) {
    const connection = await pool.getConnection();
    let locked = false;
    try {
        if (apply) {
            const [lock] = await connection.execute("SELECT GET_LOCK('mandatodo_schema_migrations', 5) AS acquired");
            if (lock[0].acquired !== 1) throw new Error("Otro proceso está migrando la base.");
            locked = true;
        }
        const [rows] = await connection.execute("SELECT TABLE_NAME AS name FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE()");
        const existing = new Set(rows.map((r) => r.name));
        const present = tables.filter((table) => existing.has(table));
        if (present.length !== 0 && present.length !== tables.length) {
            throw new Error("Esquema inicial parcial: revisar manualmente antes de migrar.");
        }
        if (!present.length && existing.size > 0) throw new Error("La base no está vacía y no contiene el esquema esperado.");
        const report = { mode: apply ? "apply" : "dry-run", baseline: present.length ? "existing" : "new", migrations: [] };
        if (!present.length && apply) {
            const initial = readFileSync(path.join(__dirname, "../database/init.sql"), "utf8");
            for (const sql of statements(initial)) await connection.query(sql);
        }
        // Precondiciones sobre las tablas realmente usadas por este corte.
        if (present.length || apply) {
            const [columns] = await connection.execute(
                "SELECT COLUMN_NAME AS name, DATA_TYPE AS type, COLUMN_KEY AS keyType FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios'",
            );
            const names = new Set(columns.map((c) => c.name));
            if (!["id", "nombre", "email", "password_hash", "rol", "activo"].every((name) => names.has(name)) ||
                !columns.some((c) => c.name === "id" && c.type === "int" && c.keyType === "PRI")) {
                throw new Error("La tabla usuarios no es compatible con la migración de sesiones.");
            }
        }
        if (apply) await connection.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
            version VARCHAR(100) PRIMARY KEY, checksum CHAR(64) NOT NULL, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
        const [applied] = existing.has("schema_migrations") || apply
            ? await connection.query("SELECT version, checksum FROM schema_migrations") : [[]];
        for (const file of files) {
            const text = readFileSync(path.join(__dirname, "../database/migrations", file), "utf8").replaceAll("\r\n", "\n");
            const checksum = createHash("sha256").update(text).digest("hex");
            const recorded = applied.find((row) => row.version === file);
            if (recorded && recorded.checksum !== checksum) throw new Error("Una migración aplicada fue modificada: revisar antes de continuar.");
            if (!recorded && file === "001_sesiones.sql" && existing.has("sesiones")) {
                throw new Error("Existe sesiones sin migración registrada: no se adopta una tabla desconocida.");
            }
            if (!recorded && file === "002_carga_pedidos.sql" && (present.length || apply)) {
                const [columns] = await connection.query("SELECT TABLE_NAME AS tabla, COLUMN_NAME AS columna FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND ((TABLE_NAME = 'clientes' AND COLUMN_NAME IN ('dni', 'apellido')) OR (TABLE_NAME = 'direcciones' AND COLUMN_NAME = 'piso_depto') OR (TABLE_NAME = 'pedidos' AND COLUMN_NAME IN ('clave_creacion', 'hash_creacion')))");
                if (columns.length) throw new Error("Hay columnas de la migración 002 sin registro; revisar/restaurar antes de aplicar.");
            }
            report.migrations.push({ version: file, status: recorded ? "already-applied" : apply ? "applied" : "pending" });
            if (!recorded && file === "003_revision_direccion.sql" && (present.length || apply)) {
                const [columns] = await connection.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'direcciones' AND COLUMN_NAME = 'revision'");
                const [triggers] = await connection.query("SELECT TRIGGER_NAME FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = 'direcciones_revision'");
                if (columns.length || triggers.length) throw new Error("Hay objetos de la migración 003 sin registro; revisar recuperación antes de aplicar.");
            }
            if (apply && !recorded) {
                if (file === "004_asignacion_despacho.sql") {
                    const [columns] = await connection.query("SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'chofer_id'");
                    const [roles] = await connection.query("SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'usuarios' AND COLUMN_NAME = 'rol'");
                    const [states] = await connection.query("SELECT COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'pedidos' AND COLUMN_NAME = 'estado'");
                    if (columns.length || roles[0].COLUMN_TYPE.includes("'chofer'") || states[0].COLUMN_TYPE.includes("'en_preparacion'")) throw new Error("Objetos parciales de 004 sin registro: revisar recuperación antes de aplicar.");
                }
                for (const sql of statements(text)) await connection.query(sql);
                await connection.execute("INSERT INTO schema_migrations (version, checksum) VALUES (?, ?)", [file, checksum]);
            }
        }
        return report;
    } finally {
        try {
            if (locked) await connection.query("SELECT RELEASE_LOCK('mandatodo_schema_migrations')");
        } finally { connection.release(); }
    }
}

async function main() {
    const args = process.argv.slice(2);
    if (args.some((arg) => !["--apply", "--dry-run"].includes(arg)) || (args.includes("--apply") && args.includes("--dry-run"))) {
        throw new Error("Usá --dry-run (predeterminado) o --apply.");
    }
    const database = createDatabase(loadCliConfig());
    try { console.log(JSON.stringify(await migrate(database.pool, { apply: args.includes("--apply") }), null, 2)); }
    finally { await database.close(); }
}

if (require.main === module) main().catch(() => {
    console.error("No se pudo migrar. Verificá conexión, esquema y respaldo; no se borraron datos. Revisá las precondiciones en la documentación.");
    process.exitCode = 1;
});

module.exports = { migrate };
