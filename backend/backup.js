const { spawnSync } = require("node:child_process");
const { mkdirSync, writeFileSync, readFileSync } = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { loadCliConfig } = require("./cli-config");

function validDatabaseName(name) {
    if (!/^[a-zA-Z0-9_]{1,64}$/.test(name || "") || ["mysql", "sys", "performance_schema", "information_schema"].includes(name.toLowerCase())) {
        throw new Error("Nombre de base inválido.");
    }
    return name;
}

function dockerMysql(command, input) {
    const result = spawnSync("docker", ["compose", "exec", "-T", "mysql", "sh", "-c", command], {
        cwd: path.join(__dirname, ".."), input, encoding: "utf8", maxBuffer: 64 * 1024 * 1024, timeout: 30000,
    });
    if (result.error || result.status !== 0) throw new Error("No se pudo completar respaldo/restauración con el contenedor MySQL.");
    return result.stdout;
}

function backupDatabase(databaseName) {
    const name = validDatabaseName(databaseName);
    // La contraseña se resuelve dentro del contenedor; no se imprime ni se pasa en argumentos de proceso.
    const dump = dockerMysql(`MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysqldump -uroot --single-transaction --no-tablespaces --skip-add-drop-table --skip-add-locks --skip-lock-tables --set-gtid-purged=OFF ${name}`);
    if (!dump.includes("CREATE TABLE")) throw new Error("El respaldo no contiene un esquema.");
    const directory = path.join(__dirname, "../temp/backups");
    mkdirSync(directory, { recursive: true });
    const file = path.join(directory, `${name}_${Date.now()}.sql`);
    writeFileSync(file, dump, { encoding: "utf8", flag: "wx" });
    return { file, sha256: createHash("sha256").update(dump).digest("hex") };
}

function restoreTestDatabase(file, databaseName) {
    const name = validDatabaseName(databaseName);
    if (!/^mandatodo_restore_test_[a-z0-9_]+$/.test(name)) throw new Error("Solo se restaura en una base nueva de pruebas.");
    const dump = readFileSync(file, "utf8");
    if (/\b(?:DROP\s+(?:DATABASE|TABLE)|TRUNCATE|USE\s+|CREATE\s+DATABASE)\b/i.test(dump)) {
        throw new Error("El respaldo contiene instrucciones incompatibles con restauración aislada.");
    }
    dockerMysql(`MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql -uroot ${name}`, dump);
}

if (require.main === module) {
    try {
        const config = loadCliConfig();
        const result = backupDatabase(config.DB_NAME);
        console.log(`Respaldo local creado en temp/backups/. SHA-256: ${result.sha256}`);
        console.log("El SQL puede contener datos personales: no se versiona ni se publica.");
    } catch {
        console.error("No se pudo respaldar. Comprobá Docker, base configurada y permisos; no se modificaron datos.");
        process.exitCode = 1;
    }
}

module.exports = { backupDatabase, restoreTestDatabase };
