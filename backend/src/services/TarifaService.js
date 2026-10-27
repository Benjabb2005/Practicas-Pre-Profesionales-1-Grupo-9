const { normalizarImporte } = require('../lib/importes');
function createTarifaService({ repositorio }) {
    return {
        obtener: () => repositorio.obtener(),
        guardar: (precio, usuarioId) => repositorio.guardar(normalizarImporte(precio, 'precio_km'), usuarioId),
    };
}
module.exports = { createTarifaService };
