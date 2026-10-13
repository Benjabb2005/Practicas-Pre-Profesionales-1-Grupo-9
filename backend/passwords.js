const { randomBytes, scrypt: scryptCallback, timingSafeEqual } = require("node:crypto");
const { promisify } = require("node:util");
const scrypt = promisify(scryptCallback);
const options = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

async function hashPassword(password) {
    if (typeof password !== "string" || password.length < 12 || password.length > 128) {
        throw new Error("La contraseña debe tener entre 12 y 128 caracteres.");
    }
    const salt = randomBytes(16).toString("hex");
    const hash = await scrypt(password, salt, 64, options);
    return `scrypt$${salt}$${hash.toString("hex")}`;
}

async function verifyPassword(password, encoded) {
    if (typeof password !== "string" || password.length > 128 || typeof encoded !== "string") return false;
    const match = /^scrypt\$([a-f0-9]{32})\$([a-f0-9]{128})$/.exec(encoded);
    if (!match) return false;
    const hash = await scrypt(password, match[1], 64, options);
    return timingSafeEqual(hash, Buffer.from(match[2], "hex"));
}

module.exports = { hashPassword, verifyPassword };
