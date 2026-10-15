// Listado de clientes para el formulario de carga manual.
function createClienteService({ clientes }) {
    return {
        async listar(filtros = {}) {
            return clientes.listar(filtros);
        },
    };
}

module.exports = { createClienteService };
