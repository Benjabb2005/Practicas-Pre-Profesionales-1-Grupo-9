const PEDIDO=`SELECT p.id,p.estado,p.chofer_id,pa.id AS pago_id,pa.metodo AS pago_metodo
    FROM pedidos p LEFT JOIN pagos pa ON pa.pedido_id=p.id WHERE p.id=?`;
function createComprobanteRepository(db) {
    async function usuario(conexion,id) {
        const [[u]]=await conexion.query('SELECT id,rol,activo FROM usuarios WHERE id=?',[id]);return u;
    }
    return {
        async subir(id,usuarioId,datos,validar) {
            const c=await db.getConnection();
            try {
                await c.beginTransaction();
                const [[p]]=await c.query(`${PEDIDO} FOR UPDATE`,[id]);
                validar(p,await usuario(c,usuarioId),true);
                const [[previo]]=await c.query('SELECT id,nombre,tipo,fecha FROM comprobantes_pago WHERE pago_id=? AND sha256=?',[p.pago_id,datos.sha256]);
                if (previo) { await c.commit();return {...previo,repetido:true}; }
                const [r]=await c.query('INSERT INTO comprobantes_pago (pago_id,nombre,tipo,sha256,archivo,subido_por) VALUES (?,?,?,?,?,?)',[p.pago_id,datos.nombre,datos.tipo,datos.sha256,datos.archivo,usuarioId]);
                await c.commit();return {id:r.insertId,nombre:datos.nombre,tipo:datos.tipo,repetido:false};
            }catch(e){await c.rollback();throw e;}finally{c.release();}
        },
        async listar(id,usuarioId,validar) {
            const [[p]]=await db.query(PEDIDO,[id]);validar(p,await usuario(db,usuarioId));
            const [filas]=await db.query('SELECT id,nombre,tipo,LENGTH(archivo) AS tamanio,fecha FROM comprobantes_pago WHERE pago_id=? ORDER BY id DESC',[p.pago_id]);
            return filas;
        },
        async obtener(id,usuarioId,validar) {
            const [[fila]]=await db.query(`SELECT c.id,c.nombre,c.tipo,c.archivo,p.chofer_id,p.estado FROM comprobantes_pago c
                JOIN pagos pa ON pa.id=c.pago_id JOIN pedidos p ON p.id=pa.pedido_id WHERE c.id=?`,[id]);
            validar(fila,await usuario(db,usuarioId));return fila;
        },
    };
}
module.exports={ createComprobanteRepository };
