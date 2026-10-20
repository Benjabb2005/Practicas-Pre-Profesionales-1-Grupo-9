const { normalizarTexto } = require("../lib/texto");
const { normalizarProvincia } = require("../constants/provincias");

// Consulta localidades oficiales a Georef. La provincia siempre se manda con su
// nombre canónico; un proveedor caído se informa como NO_VERIFICADO, nunca como
// "no existe", porque Georef no cubre todos los barrios ni localidades chicas.
function createLocalidadService({ cliente } = {}) {
    async function buscar(provincia, nombre) {
        const provinciaCanonica = normalizarProvincia(provincia);
        const consulta = String(nombre == null ? "" : nombre).trim();
        if (!cliente || !provinciaCanonica || !consulta) {
            return { provinciaCanonica, consulta, salida: null };
        }
        const salida = await cliente.buscarLocalidades({ provincia: provinciaCanonica, nombre: consulta });
        return { provinciaCanonica, consulta, salida };
    }

    return {
        async sugerir({ provincia, nombre } = {}) {
            const { salida } = await buscar(provincia, nombre);
            if (!salida || !salida.ok) return [];

            const vistos = new Set();
            const nombres = [];
            for (const localidad of salida.nombres) {
                const clave = normalizarTexto(localidad);
                if (vistos.has(clave)) continue;
                vistos.add(clave);
                nombres.push(localidad);
                if (nombres.length === 10) break;
            }
            return nombres;
        },

        // EXISTE | NO_EXISTE | NO_VERIFICADO
        async verificar({ provincia, localidad } = {}) {
            const provinciaCanonica = normalizarProvincia(provincia);
            const consulta = String(localidad == null ? "" : localidad).trim();
            if (!provinciaCanonica || !consulta) return "NO_VERIFICADO";

            // CABA y sus sinónimos ("CABA", "Capital Federal") identifican la
            // jurisdicción aunque Georef devuelva otro nombre de localidad.
            if (normalizarProvincia(consulta) === provinciaCanonica) return "EXISTE";

            const salida = cliente
                ? await cliente.buscarLocalidades({ provincia: provinciaCanonica, nombre: consulta })
                : null;
            if (!salida || !salida.ok) return "NO_VERIFICADO";

            const buscada = normalizarTexto(consulta);
            return salida.nombres.some((nombre) => normalizarTexto(nombre) === buscada) ? "EXISTE" : "NO_EXISTE";
        },
    };
}

module.exports = { createLocalidadService };
