const { errorValidacion, conflicto } = require("../lib/errors");

// Normaliza el DNI a solo dígitos (el skill lo exige así y el DNI identifica al
// cliente). Un DNI sin dígitos no es válido; vacío se guarda como NULL.
function normalizarDni(valor) {
    if (valor === undefined || valor === null) return null;
    const digitos = String(valor).replace(/\D/g, "");
    return digitos || null;
}

// Listado y alta de clientes para el formulario de carga manual. El DNI duplicado
// se rechaza (identifica al cliente); el teléfono o email repetido se avisa sin
// fusionar ni sobrescribir datos de clientes existentes.
function createClienteService({ clientes }) {
    return {
        async listar(filtros = {}) {
            return clientes.listar(filtros);
        },

        async crear({ nombre, dni, telefono, email, tipo, domicilio }) {
            const dniNormalizado = normalizarDni(dni);
            if (dni !== undefined && dni !== null && String(dni).trim() !== "" && !dniNormalizado) {
                throw errorValidacion({ dni: "El DNI debe contener números." });
            }

            const telefonoNormalizado = telefono ? String(telefono).trim() : null;
            const emailNormalizado = email ? String(email).trim().toLowerCase() : null;

            if (dniNormalizado) {
                const existente = await clientes.buscarPorDni(dniNormalizado);
                if (existente) throw conflicto("Ya existe un cliente con ese DNI.");
            }

            const posiblesDuplicados = await clientes.buscarCoincidencias({
                telefono: telefonoNormalizado,
                email: emailNormalizado,
            });

            const id = await clientes.crear({
                nombre,
                dni: dniNormalizado,
                telefono: telefonoNormalizado,
                email: emailNormalizado,
                tipo,
                domicilio,
            });

            return { cliente: await clientes.buscarPorId(id), posiblesDuplicados };
        },
    };
}

module.exports = { createClienteService, normalizarDni };
