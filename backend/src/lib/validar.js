const { errorValidacion } = require("./errors");

// Valida con un esquema Zod y traduce los errores al formato común
// { error: { codigo, campos } }. Devuelve el dato ya normalizado.
function validar(schema, datos) {
    const resultado = schema.safeParse(datos);
    if (resultado.success) return resultado.data;

    const campos = {};
    for (const problema of resultado.error.issues) {
        const campo = problema.path.join(".") || "general";
        if (!campos[campo]) campos[campo] = problema.message;
    }
    throw errorValidacion(campos);
}

module.exports = { validar };
