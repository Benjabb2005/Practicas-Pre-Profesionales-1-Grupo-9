const { conflicto, noEncontrado, noAutorizado, errorValidacion } = require('../lib/errors');
const { validarTransicion } = require('./EstadoPedidoService');

function validarPropio(pedido, usuarioId) {
    if (!pedido || Number(pedido.chofer_id) !== Number(usuarioId)) throw noEncontrado('El pedido no está disponible.');
}
function validarEntrega(pedido, usuarioId, resultado) {
    validarPropio(pedido, usuarioId);
    if (resultado === 'ENTREGADO') {
        validarTransicion({ estadoActual: pedido.estado, estadoNuevo: 'ENTREGADO', direccion: pedido });
        if (pedido.estado_validacion !== 'CONFIRMADA') throw conflicto('La dirección cambió. Contactá al operador antes de entregar.');
    } else if (pedido.estado !== 'EN ENVÍO') throw conflicto('Sólo podés registrar un intento de un pedido en envío.');
}
function validarPago(pedido, usuarioId) {
    validarPropio(pedido, usuarioId);
    if (!['ENTREGADO', 'PAGADO'].includes(pedido.estado)) throw conflicto('Primero confirmá la entrega del pedido.');
}
function validarMonto(monto) {
    if (typeof monto !== 'string' || !/^\d{1,10}(\.\d{1,2})?$/.test(monto) || Number(monto) <= 0) {
        throw errorValidacion({ monto: 'Ingresá un monto mayor a cero, con hasta dos decimales.' });
    }
    return Number(monto).toFixed(2);
}
function createEntregaService({ repositorio }) {
    return {
        registrar: (id, usuarioId, datos) => repositorio.registrar(id, usuarioId, datos, validarEntrega),
        pago: (id, usuarioId, datos) => repositorio.pago(id, usuarioId, { ...datos, monto: validarMonto(datos.monto) }, validarPago),
        entregados: usuarioId => repositorio.entregados(usuarioId),
        async historial(id, usuario) {
            return repositorio.historial(id, pedido => {
                if (usuario.rol === 'CHOFER') validarPropio(pedido, usuario.id);
                else if (!['ADMINISTRADOR', 'OPERADOR'].includes(usuario.rol)) throw noAutorizado();
                else if (!pedido) throw noEncontrado();
            });
        },
    };
}
module.exports = { createEntregaService, validarEntrega, validarPago, validarMonto, validarPropio };
