function createTarifaRepository(db) {
    return {
        async obtener() {
            const [[tarifa]] = await db.query(
                `SELECT precio_km, actualizado_por, updated_at, sucursal_calle, sucursal_altura,
                    sucursal_localidad, sucursal_provincia, sucursal_direccion,
                    sucursal_latitud, sucursal_longitud
                 FROM tarifas_envio WHERE id=1`
            );
            return tarifa || {
                precio_km: null,
                actualizado_por: null,
                updated_at: null,
                sucursal_calle: null,
                sucursal_altura: null,
                sucursal_localidad: null,
                sucursal_provincia: null,
                sucursal_direccion: null,
                sucursal_latitud: null,
                sucursal_longitud: null,
            };
        },
        async guardar(precio, usuarioId) {
            await db.query('UPDATE tarifas_envio SET precio_km=?,actualizado_por=? WHERE id=1', [precio, usuarioId]);
            return this.obtener();
        },
        async guardarSucursal(sucursal, usuarioId) {
            await db.query(
                `UPDATE tarifas_envio
                 SET sucursal_calle=?, sucursal_altura=?, sucursal_localidad=?, sucursal_provincia=?,
                     sucursal_direccion=?, sucursal_latitud=?, sucursal_longitud=?, actualizado_por=?
                 WHERE id=1`,
                [
                    sucursal.calle,
                    sucursal.altura,
                    sucursal.localidad,
                    sucursal.provincia,
                    sucursal.direccion,
                    sucursal.latitud,
                    sucursal.longitud,
                    usuarioId,
                ]
            );
            return this.obtener();
        },
    };
}
module.exports = { createTarifaRepository };
