// Normalización de texto compartida por el validador y el catálogo de provincias.
// Vive en lib para que provincias.js no dependa de un servicio y no haya ciclo.
function normalizarTexto(valor) {
    return String(valor == null ? "" : valor)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[º°.]/g, "")
        .replace(/\s*\/\s*/g, "/")
        .replace(/\s+/g, " ")
        .trim();
}

module.exports = { normalizarTexto };
