const { conflicto, noEncontrado, errorValidacion } = require('../lib/errors');
const { ESTADOS } = require('../constants/estados');
const { puedeDespacharse } = require('./EstadoPedidoService');

function disponibilidadAsignacion(pedido) {
    const antesDelDespacho = [ESTADOS.EN_STOCK, ESTADOS.EN_PREPARACION].includes(pedido.estado);
    const motivo = !antesDelDespacho
        ? 'Sólo podés cambiar la asignación antes del despacho.'
        : !puedeDespacharse(pedido) ? 'Confirmá la dirección antes de asignar un chofer.' : null;
    return {
        ...pedido,
        puede_asignar: motivo === null,
        motivo_bloqueo: motivo,
        puede_quitar: antesDelDespacho && pedido.chofer_id != null,
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

module.exports = { createAsignacionService, validarAsignacion };
