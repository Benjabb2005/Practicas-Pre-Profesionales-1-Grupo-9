function createTarifaRepository(db) {
    return {
        async obtener() {
            const [[tarifa]] = await db.query('SELECT precio_km,updated_at FROM tarifas_envio WHERE id=1');
            return tarifa || { precio_km: null };
        },
        async guardar(precio, usuarioId) {
            await db.query('UPDATE tarifas_envio SET precio_km=?,actualizado_por=? WHERE id=1', [precio, usuarioId]);
            return this.obtener();
        },
    };
}
module.exports = { createTarifaRepository };
