const { createHash } = require('node:crypto');
const { errorValidacion,noAutorizado,noEncontrado,conflicto } = require('../lib/errors');
const LIMITE = 5 * 1024 * 1024;
function validarArchivo(archivo,nombre) {
    if (!Buffer.isBuffer(archivo) || !archivo.length || archivo.length > LIMITE) throw errorValidacion({ archivo:'Elegí una imagen o PDF de hasta 5 MB.' });
    const limpio = String(nombre || '').split(/[\\/]/).pop().replace(/[\x00-\x1f\x7f]/g,'').trim();
    if (!limpio || limpio.length > 180) throw errorValidacion({ archivo:'El nombre del archivo debe tener entre 1 y 180 caracteres.' });
    let tipo;
    if (archivo.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) tipo='image/png';
    else if (archivo[0]===255 && archivo[1]===216 && archivo[2]===255) tipo='image/jpeg';
    else if (archivo.subarray(0,5).toString()==='%PDF-') tipo='application/pdf';
    else if (archivo.subarray(0,4).toString()==='RIFF' && archivo.subarray(8,12).toString()==='WEBP') tipo='image/webp';
    if (!tipo) throw errorValidacion({ archivo:'Formato no admitido. Usá JPG, PNG, WEBP o PDF.' });
    const extensiones={'image/png':/\.png$/i,'image/jpeg':/\.jpe?g$/i,'image/webp':/\.webp$/i,'application/pdf':/\.pdf$/i};
    if (!extensiones[tipo].test(limpio)) throw errorValidacion({archivo:'La extensión del archivo no coincide con su contenido.'});
    return { nombre:limpio,tipo,archivo,sha256:createHash('sha256').update(archivo).digest('hex') };
}
function validarAcceso(pedido,usuario,subida=false) {
    if (!usuario?.activo || !['ADMINISTRADOR','CHOFER'].includes(usuario.rol)) throw noAutorizado();
    if (!pedido || (usuario.rol==='CHOFER' && Number(pedido.chofer_id)!==Number(usuario.id))) throw noEncontrado('El comprobante o pedido no está disponible.');
    if (subida && (usuario.rol!=='CHOFER' || !['ENTREGADO','PAGADO'].includes(pedido.estado) || pedido.pago_metodo!=='TRANSFERENCIA')) throw conflicto('Sólo podés adjuntar a una transferencia registrada de un pedido propio entregado.');
}
function createComprobanteService({ repositorio }) {
    return {
        subir:(id,usuarioId,archivo,nombre)=>repositorio.subir(id,usuarioId,validarArchivo(archivo,nombre),validarAcceso),
        listar:(id,usuarioId)=>repositorio.listar(id,usuarioId,validarAcceso),
        obtener:(id,usuarioId)=>repositorio.obtener(id,usuarioId,validarAcceso),
    };
}
module.exports={ createComprobanteService,validarArchivo,validarAcceso,LIMITE };
