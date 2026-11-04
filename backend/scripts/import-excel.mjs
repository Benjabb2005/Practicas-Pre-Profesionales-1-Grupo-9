// Importa el Excel histórico del Caso 7 desde temp/.
// Uso:  npm run import:dry  ·  npm run import -- --file temp/archivo.xlsx
// Nunca geolocaliza ni marca direcciones como confirmadas: los pedidos entran
// con direccion_validada = 0 y estado_validacion = PENDIENTE.
import "dotenv/config";
import { readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import mysql from "mysql2/promise";
import { analizar, aplicar, HOJAS } from "../src/import/importador.js";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

const raizTemp = fileURLToPath(new URL("../../temp/", import.meta.url));
const dryRun = process.argv.includes("--dry-run") || process.argv.includes("--dry");
const indiceFile = process.argv.indexOf("--file");
const archivoPedido = indiceFile >= 0 ? process.argv[indiceFile + 1] : null;

function resolverArchivo() {
    if (archivoPedido) {
        if (!existsSync(archivoPedido)) {
            console.error(`No se encontró el archivo: ${archivoPedido}`);
            process.exit(1);
        }
        return archivoPedido;
    }
    if (!existsSync(raizTemp)) {
        console.error("No existe la carpeta temp/. Depositá el Excel del Caso 7 ahí.");
        process.exit(1);
    }
    const candidatos = readdirSync(raizTemp).filter((nombre) => /\.(xlsx|xls)$/i.test(nombre));
    if (!candidatos.length) {
        console.error("No hay ningún .xlsx en temp/. Depositá el Excel del Caso 7 o usá --file <ruta>.");
        process.exit(1);
    }
    return join(raizTemp, candidatos[0]);
}

function filasDe(libro, nombre) {
    const hoja = libro.Sheets[nombre];
    if (!hoja) return null;
    return XLSX.utils.sheet_to_json(hoja, { defval: "" });
}

function resumir(grupo) {
    const porMotivo = new Map();
    for (const fila of grupo.revision) porMotivo.set(fila.motivo, (porMotivo.get(fila.motivo) || 0) + 1);
    const motivos = [...porMotivo.entries()].map(([motivo, cantidad]) => `${cantidad} × ${motivo}`).join("; ") || "sin observaciones";
    return `aceptadas ${grupo.aceptadas.length}, revisión ${grupo.revision.length}, rechazadas ${grupo.rechazadas.length} (${motivos})`;
}

function dbConfig() {
    const faltantes = ["DB_HOST", "DB_USER", "DB_NAME"].filter((clave) => !process.env[clave]);
    if (faltantes.length) {
        console.error(`Faltan variables de entorno para importar: ${faltantes.join(", ")}.`);
        process.exit(1);
    }
    return {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 3306),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD ?? "",
        database: process.env.DB_NAME,
        multipleStatements: true,
    };
}

async function main() {
    const ruta = resolverArchivo();
    console.log(`Archivo: ${ruta}${dryRun ? " (dry-run)" : ""}`);
    const libro = XLSX.readFile(ruta);

    const faltantes = Object.values(HOJAS).filter((nombre) => !libro.Sheets[nombre]);
    if (faltantes.length) console.warn(`Atención: faltan las hojas ${faltantes.join(", ")}.`);

    const hojas = {
        clientes: filasDe(libro, HOJAS.clientes) || [],
        pedidos: filasDe(libro, HOJAS.pedidos) || [],
        historial: filasDe(libro, HOJAS.historial) || [],
    };

    const plan = analizar(hojas);
    console.log(`Clientes:    ${resumir(plan.clientes)}`);
    console.log(`Pedidos:     ${resumir(plan.pedidos)}`);
    console.log(`Historial:   ${resumir(plan.historial)}`);

    if (dryRun) {
        console.log("Dry-run: no se escribió nada en la base.");
        return;
    }

    const conexion = mysql.createPool(dbConfig());
    try {
        const resultado = await aplicar(conexion, plan);
        console.log(`Aplicado: clientes +${resultado.clientes.insertados} (existentes ${resultado.clientes.existentes}), pedidos +${resultado.pedidos.insertados} (existentes ${resultado.pedidos.existentes}), direcciones +${resultado.direcciones.insertados}, historial +${resultado.historial.insertados} (existentes ${resultado.historial.existentes}, sin pedido ${resultado.historial.sinPedido}).`);
    } finally {
        await conexion.end();
    }
}

main().catch((error) => {
    console.error(`Importación fallida: ${error.code || error.message}`);
    process.exit(1);
});
