const { errorValidacion, conflicto, noEncontrado } = require("../lib/errors");

// Normaliza el DNI quitando únicamente los separadores admitidos: puntos,
// espacios y guiones. Otros caracteres se rechazan para no inventar un DNI a
// partir de una entrada inválida. Vacío se guarda como NULL.
function normalizarDni(valor) {
    if (valor === undefined || valor === null) return null;
    const texto = String(valor).trim();
    if (!texto) return null;
    const limpio = texto.replace(/[.\s-]/g, "");
    return /^\d+$/.test(limpio) ? limpio : null;
}

// Teléfono uniforme: solo dígitos, sin espacios, guiones ni paréntesis.
function normalizarTelefono(valor) {
    if (valor === undefined || valor === null) return null;
    const digitos = String(valor).replace(/\D/g, "");
    return digitos || null;
}

function normalizarEmail(valor) {
    if (valor === undefined || valor === null) return null;
    const texto = String(valor).trim().toLowerCase();
    return texto || null;
}

// El chequeo previo de DNI evita el caso normal; esta traducción cubre una
// carrera entre dos altas simultáneas que MySQL resuelve con la clave única.
function esDuplicadoDeDni(error) {
    return error?.code === "ER_DUP_ENTRY" || error?.errno === 1062;
}

// Valida y normaliza los campos editables. El nombre es el único obligatorio;
// los datos opcionales vacíos se guardan como NULL.
function normalizarDatos({ nombre, dni, telefono, email, tipo, domicilio }) {
    const nombreLimpio = String(nombre ?? "").trim();
    if (!nombreLimpio) throw errorValidacion({ nombre: "El nombre es obligatorio." });

    const dniNormalizado = normalizarDni(dni);
    if (dni !== undefined && dni !== null && String(dni).trim() !== "" && !dniNormalizado) {
        throw errorValidacion({ dni: "El DNI debe contener solo números y puede incluir puntos, espacios o guiones." });
    }

    return {
        nombre: nombreLimpio,
        dni: dniNormalizado,
        telefono: normalizarTelefono(telefono),
        email: normalizarEmail(email),
        tipo: String(tipo ?? "").trim() || "particular",
        domicilio: String(domicilio ?? "").trim() || null,
    };
}

// Alta, edición, baja y aviso de duplicados de clientes. El DNI repetido bloquea
// porque identifica al cliente; teléfono o email repetido solo se avisa, sin
// fusionar ni sobrescribir datos de otros clientes.
function createClienteService({ clientes }) {
    async function asegurarDniDisponible(dni, exceptoId = null) {
        if (!dni) return;
        const existente = await clientes.buscarPorDni(dni);
        if (existente && existente.id !== exceptoId) {
            throw conflicto("Ya existe un cliente con ese DNI.");
        }
    }

    async function buscarCoincidencias({ telefono, email, exceptoId = null }) {
        return clientes.buscarCoincidencias({ telefono, email, exceptoId });
    }

    return {
        async listar(filtros = {}) {
            return clientes.listar(filtros);
        },

        async crear(datos) {
            const normalizado = normalizarDatos(datos);
            await asegurarDniDisponible(normalizado.dni);
            const posiblesDuplicados = await buscarCoincidencias(normalizado);

            let id;
            try {
                id = await clientes.crear(normalizado);
            } catch (error) {
                if (esDuplicadoDeDni(error)) throw conflicto("Ya existe un cliente con ese DNI.");
                throw error;
            }

            return { cliente: await clientes.buscarPorId(id), posiblesDuplicados };
        },

        // PUT con los campos editables. Los que no vienen conservan el valor
        // actual; los que vienen vacíos se limpian (por ejemplo, borrar el DNI).
        async actualizar(id, datos) {
            const actual = await clientes.buscarPorId(id);
            if (!actual) throw noEncontrado("El cliente no existe.");

            const combinado = {
                nombre: datos.nombre ?? actual.nombre,
                dni: datos.dni !== undefined ? datos.dni : actual.dni,
                telefono: datos.telefono !== undefined ? datos.telefono : actual.telefono,
                email: datos.email !== undefined ? datos.email : actual.email,
                tipo: datos.tipo !== undefined ? datos.tipo : actual.tipo,
                domicilio: datos.domicilio !== undefined ? datos.domicilio : actual.domicilio,
            };

            const normalizado = normalizarDatos(combinado);
            await asegurarDniDisponible(normalizado.dni, actual.id);
            const posiblesDuplicados = await buscarCoincidencias({
                telefono: normalizado.telefono,
                email: normalizado.email,
                exceptoId: actual.id,
            });

            try {
                await clientes.actualizar(actual.id, normalizado);
            } catch (error) {
                if (esDuplicadoDeDni(error)) throw conflicto("Ya existe un cliente con ese DNI.");
                throw error;
            }

            const cliente = await clientes.buscarPorId(actual.id);
            if (!cliente) throw noEncontrado("El cliente no existe.");
            return { cliente, posiblesDuplicados };
        },

        // Baja física solo si no hay pedidos asociados. La FK ya lo impediría,
        // pero se devuelve un conflicto legible en lugar de un error de MySQL.
        async eliminar(id) {
            const actual = await clientes.buscarPorId(id);
            if (!actual) throw noEncontrado("El cliente no existe.");
            if (await clientes.tienePedidos(actual.id)) {
                throw conflicto("No se puede eliminar un cliente con pedidos asociados.");
            }

            let borrados;
            try {
                borrados = await clientes.eliminar(actual.id);
            } catch (error) {
                if (error?.code === "ER_ROW_IS_REFERENCED_2" || error?.errno === 1451) {
                    throw conflicto("No se puede eliminar un cliente con pedidos asociados.");
                }
                throw error;
            }

            if (!borrados) throw noEncontrado("El cliente no existe.");
            return { eliminado: true };
        },
    };
}

module.exports = { createClienteService, normalizarDni };
