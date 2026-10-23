// Cache pequeño en memoria: evita repetir consultas idénticas durante cinco minutos.
function crearCache({ ttlMs = 5 * 60 * 1000, maxEntradas = 500 } = {}) {
    const entradas = new Map();
    const enCurso = new Map();
    return {
        async obtener(clave, cargar) {
            const ahora = Date.now();
            const existente = entradas.get(clave);
            if (existente && existente.vence > ahora) return existente.valor;
            if (existente) entradas.delete(clave);
            if (enCurso.has(clave)) return enCurso.get(clave);
            const promesa = cargar();
            enCurso.set(clave, promesa);
            let valor;
            try { valor = await promesa; }
            finally { enCurso.delete(clave); }
            if (valor?.resultado === "ERROR") return valor;
            if (entradas.size >= maxEntradas) entradas.delete(entradas.keys().next().value);
            entradas.set(clave, { valor, vence: Date.now() + ttlMs });
            return valor;
        },
    };
}

function normalizarDireccion(direccion = {}) {
    return Object.fromEntries(Object.entries(direccion)
        .map(([campo, valor]) => [campo, String(valor ?? "").trim().toLocaleLowerCase("es-AR")])
        .sort(([a], [b]) => a.localeCompare(b)));
}

module.exports = { crearCache, normalizarDireccion };
