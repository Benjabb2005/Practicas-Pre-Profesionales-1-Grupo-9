const { errorValidacion, conflicto } = require('./errors');
const MAXIMO = 999999999999n;
function centavos(valor, campo = 'importe_base') {
    const texto = typeof valor === 'number' ? String(valor) : valor;
    if (typeof texto !== 'string' || !/^\d{1,10}(\.\d{1,2})?$/.test(texto)) {
        throw errorValidacion({ [campo]: 'Ingresá un importe positivo con hasta dos decimales.' });
    }
    const [entero, decimal = ''] = texto.split('.');
    const c = BigInt(entero) * 100n + BigInt(decimal.padEnd(2, '0'));
    if (c <= 0n || c > MAXIMO) throw errorValidacion({ [campo]: 'El importe debe ser mayor a cero y menor a 10.000.000.000.' });
    return c;
}
function decimal(c) { return `${c / 100n}.${String(c % 100n).padStart(2, '0')}`; }
function normalizarImporte(valor, campo) { return decimal(centavos(valor, campo)); }
function recargoPorIntentos(base, cantidad) {
    if (base == null) return '0.00'; // Importe pendiente: total permanece NULL.
    const c = centavos(base);
    const recargo = ((c + 1n) / 2n) * BigInt(cantidad);
    if (c + recargo > MAXIMO) throw conflicto('El total con recargos supera el importe máximo permitido.');
    return decimal(recargo);
}
module.exports = { normalizarImporte, recargoPorIntentos };
