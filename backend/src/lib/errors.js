// Errores de aplicación con un código estable y un mensaje seguro para el cliente.
// El detalle interno (SQL, stack) nunca viaja en la respuesta: lo maneja el middleware.
class AppError extends Error {
    constructor(statusCode, codigo, mensaje, campos) {
        super(mensaje);
        this.name = "AppError";
        this.statusCode = statusCode;
        this.codigo = codigo;
        // El middleware usa `mensaje` como texto público; `message` queda para
        // el registro técnico. Sin esta propiedad la respuesta salía sin texto.
        this.mensaje = mensaje;
        if (campos) this.campos = campos;
    }
}

function errorValidacion(campos) {
    return new AppError(400, "DATOS_INVALIDOS", "Los datos enviados no son válidos.", campos);
}

function noAutenticado(mensaje = "Sesión ausente o inválida.") {
    return new AppError(401, "NO_AUTENTICADO", mensaje);
}

function noAutorizado(mensaje = "No tenés permiso para realizar esta acción.") {
    return new AppError(403, "NO_AUTORIZADO", mensaje);
}

function noEncontrado(mensaje = "El recurso solicitado no existe.") {
    return new AppError(404, "NO_ENCONTRADO", mensaje);
}

function conflicto(mensaje) {
    return new AppError(409, "CONFLICTO", mensaje);
}

// Conflicto que además devuelve los pedidos existentes para que el operador
// pueda revisarlos antes de confirmar la creación de otro pedido.
function conflictoDuplicado(mensaje, posiblesDuplicados) {
    const error = new AppError(409, "DUPLICADO_POTENCIAL", mensaje);
    error.posiblesDuplicados = posiblesDuplicados;
    return error;
}

function servicioNoDisponible(mensaje = "El servicio no está disponible en este entorno.") {
    return new AppError(503, "SERVICIO_NO_DISPONIBLE", mensaje);
}

module.exports = {
    AppError,
    errorValidacion,
    noAutenticado,
    noAutorizado,
    noEncontrado,
    conflicto,
    conflictoDuplicado,
    servicioNoDisponible,
};
