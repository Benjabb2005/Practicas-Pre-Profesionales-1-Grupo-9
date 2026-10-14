const { test } = require('node:test');
const assert = require('node:assert/strict');
const { initialize } = require('../initialize');

test('Arranque no aplica migraciones pendientes a una base existente', async () => {
    let writes = 0;
    const migration = async (_pool, options) => { if (options?.apply) writes++; return { baseline: 'existing', migrations: [{ status: 'pending' }] }; };
    await assert.rejects(initialize({}, {}, migration));
    assert.equal(writes, 0);
});
test('Cuenta inicial inválida no crea esquema parcial', async () => {
    let writes = 0;
    const migration = async (_pool, options) => { if (options?.apply) writes++; return { baseline: 'new', migrations: [{ status: 'pending' }] }; };
    await assert.rejects(initialize({}, {}, migration));
    assert.equal(writes, 0);
});
