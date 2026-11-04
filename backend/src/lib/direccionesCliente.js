const { createHash } = require('node:crypto');
const { normalizarDireccion } = require('../services/NormalizadorDireccion');

const CAMPOS = ['calle', 'altura', 'piso_depto', 'entre_calles', 'localidad', 'provincia', 'codigo_postal'];
function direccionReutilizable(entrada) {
    const normalizada = normalizarDireccion(entrada);
    const campos = Object.fromEntries(CAMPOS.map(campo => [campo, String(normalizada[campo] ?? '').trim() || null]));
    const valores = CAMPOS.map(campo => (campos[campo] ?? '').normalize('NFC').toLocaleLowerCase('es-AR'));
    return { clave: createHash('sha256').update(JSON.stringify(valores)).digest('hex'),
        direccion_original: entrada.direccion_original ?? null, ...campos };
}
function direccionesUnicas(filas) {
    const unicas = new Map();
    for (const fila of filas) {
        const direccion = direccionReutilizable(fila);
        if (!CAMPOS.some(campo => direccion[campo])) continue;
        if (!unicas.has(direccion.clave)) unicas.set(direccion.clave, direccion);
    }
    return [...unicas.values()];
}

async function recordarDireccion(conexion, clienteId, entrada) {
    const direccion = direccionReutilizable(entrada);
    await conexion.query(`INSERT INTO direcciones_cliente
        (cliente_id,clave,direccion_original,calle,altura,piso_depto,entre_calles,localidad,provincia,codigo_postal)
        VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)`,
    [clienteId, direccion.clave, direccion.direccion_original, ...CAMPOS.map(campo => direccion[campo])]);
}
module.exports = { direccionReutilizable, direccionesUnicas, recordarDireccion };
