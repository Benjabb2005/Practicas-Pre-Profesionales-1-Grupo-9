const { conflicto, noEncontrado, errorValidacion } = require('../lib/errors');
const { ESTADOS } = require('../constants/estados');
const { puedeDespacharse, validarTransicion } = require('./EstadoPedidoService');

function validarDespacho(pedido, estadoNuevo, chofer) {
    if (!pedido) throw noEncontrado('El pedido no existe.');
    if (![ESTADOS.EN_PREPARACION, ESTADOS.EN_ENVIO].includes(estadoNuevo)) {
        throw errorValidacion({ estado: 'Sólo podés preparar o despachar desde asignaciones.' });
    }
    validarTransicion({ estadoActual: pedido.estado, estadoNuevo, direccion: pedido });
    if (estadoNuevo === ESTADOS.EN_ENVIO && (!chofer || chofer.rol !== 'CHOFER' || !chofer.activo)) {
        throw conflicto('Asigná un chofer activo antes de despachar.');
    }
}

function disponibilidadAsignacion(pedido) {
    const antesDelDespacho = [ESTADOS.EN_STOCK, ESTADOS.EN_PREPARACION].includes(pedido.estado);
    const motivo = !antesDelDespacho
        ? 'Sólo podés cambiar la asignación antes del despacho.'
        : !puedeDespacharse(pedido) ? 'Confirmá la dirección antes de asignar un chofer.' : null;
    const motivoDespacho = pedido.estado !== ESTADOS.EN_PREPARACION ? 'Primero poné el pedido en preparación.'
        : !puedeDespacharse(pedido) ? 'Confirmá la dirección antes de despachar.'
        : !pedido.chofer_id || pedido.chofer_rol !== 'CHOFER' || !pedido.chofer_activo ? 'Asigná un chofer activo antes de despachar.' : null;
    return {
        ...pedido,
        puede_asignar: motivo === null,
        motivo_bloqueo: motivo,
        puede_quitar: antesDelDespacho && pedido.chofer_id != null,
        puede_preparar: pedido.estado === ESTADOS.EN_STOCK,
        puede_despachar: motivoDespacho === null,
        motivo_despacho: motivoDespacho,
    };
}

function validarAsignacion(pedido, choferId, chofer) {
    if (!pedido) throw noEncontrado('El pedido no existe.');
    if (![ESTADOS.EN_STOCK, ESTADOS.EN_PREPARACION].includes(pedido.estado)) {
        throw conflicto('Sólo podés cambiar la asignación antes del despacho.');
    }
    if (choferId !== null) {
        if (!puedeDespacharse(pedido)) throw conflicto('Confirmá la dirección antes de asignar un chofer.');
        if (!chofer || chofer.rol !== 'CHOFER' || !chofer.activo) {
            throw errorValidacion({ chofer_id: 'Elegí un chofer activo.' });
        }
    }
}

function createAsignacionService({ repositorio }) {
    return {
        listar: async () => (await repositorio.listar()).map(disponibilidadAsignacion),
        choferes: () => repositorio.choferes(),
        cambiarEstado: async (id, estado, usuarioId) => disponibilidadAsignacion(
            await repositorio.cambiarEstado(id, estado, usuarioId, validarDespacho)
        ),
        asignar: async (id, choferId, usuarioId) => disponibilidadAsignacion(
            await repositorio.asignar(id, choferId, usuarioId, validarAsignacion)
        ),
        propios: (usuarioId) => repositorio.propios(usuarioId),
        async propio(id, usuarioId) {
            const pedido = await repositorio.propio(id, usuarioId);
            if (!pedido) throw noEncontrado('El pedido no está disponible.');
            return pedido;
        },
    };
}

module.exports = { createAsignacionService, validarAsignacion, validarDespacho };
