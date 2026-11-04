// Fuente única de roles. Nunca comparar con strings escritos a mano.
const ROLES = Object.freeze({
    ADMINISTRADOR: "ADMINISTRADOR",
    OPERADOR: "OPERADOR",
    CHOFER: "CHOFER",
});

const ROLES_VALIDOS = Object.freeze(Object.values(ROLES));

module.exports = { ROLES, ROLES_VALIDOS };
