const { readFileSync, writeFileSync, existsSync } = require("node:fs");
const { randomBytes } = require("node:crypto");
const path = require("node:path");
const dotenv = require("dotenv");

function main() {
    const files = [path.join(__dirname, "../.env"), path.join(__dirname, ".env")];
    const existing = files.filter(existsSync);
    if (!existing.length) throw new Error("Primero creá un .env desde el ejemplo.");
    const contents = existing.map((file) => ({ file, text: readFileSync(file, "utf8") }));
    for (const { text } of contents) {
        const value = dotenv.parse(text).SESSION_SECRET;
        if (value && Buffer.byteLength(value) < 32) throw new Error("Hay un secreto configurado demasiado corto; revisalo sin publicarlo.");
    }
    const secret = contents.map(({ text }) => dotenv.parse(text).SESSION_SECRET).find(Boolean) || randomBytes(48).toString("hex");
    for (const { file, text } of contents) {
        if (dotenv.parse(text).SESSION_SECRET) continue;
        const line = `SESSION_SECRET=${secret}`;
        const updated = /^\s*SESSION_SECRET\s*=/m.test(text)
            ? text.replace(/^\s*SESSION_SECRET\s*=.*$/gm, line)
            : `${text.trimEnd()}\n${line}\n`;
        writeFileSync(file, updated, "utf8");
    }
    console.log("Configuración local de sesión preparada. Los secretos existentes se conservan y no se imprimen.");
}

try { main(); }
catch (error) { console.error(error.message); process.exitCode = 1; }
