const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const { validateResult } = require('../deliveries');
test('Resultado de entrega valida receptor, motivo, observación y clave de reintento', () => {
    const key = randomUUID();
    assert.equal(validateResult({ resultado: 'entregado', receptor: ' Receptor sintético ', metodoPago: 'efectivo' }, key).receptor, 'Receptor sintético');
    assert.throws(() => validateResult({ resultado: 'entregado', receptor: ' ' }, key), { code: 'RECEIVER_REQUIRED' });
    assert.equal(validateResult({ resultado: 'fallido', motivo: 'cliente_ausente' }, key).observacion, '');
    assert.throws(() => validateResult({ resultado: 'entregado', receptor: 'Ensayo' }, key), { code: 'PAYMENT_METHOD_REQUIRED' });
    assert.throws(() => validateResult({ resultado: 'entregado', receptor: 'Ensayo', metodoPago: 'tarjeta' }, key), { code: 'PAYMENT_METHOD_REQUIRED' });
    assert.equal(validateResult({ resultado: 'entregado', receptor: 'Ensayo', metodoPago: 'transferencia' }, key).observacion, '');
    assert.throws(() => validateResult({ resultado: 'fallido', motivo: 'otro', metodoPago: 'efectivo' }, key));
    assert.throws(() => validateResult({ resultado: 'fallido', motivo: 'inventado', observacion: 'Ensayo' }, key));
    assert.throws(() => validateResult({ resultado: 'entregado', receptor: 'Ensayo', estado: 'pagado' }, key));
    assert.throws(() => validateResult({ resultado: 'entregado', receptor: 'Ensayo' }, 'sin-clave'));
    assert.equal(validateResult({ resultado: 'fallido', motivo: 'otro', observacion: 'Ensayo' }, key).resultado, 'fallido');
});
