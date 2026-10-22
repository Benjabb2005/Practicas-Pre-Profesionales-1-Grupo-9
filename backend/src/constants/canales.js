// Canales informativos del MVP. No son una clave foránea: pedidos.canal_origen
// sigue siendo texto, pero el servidor sólo acepta este catálogo para evitar
// variantes escritas a mano. Para sumar un canal hay que agregarlo acá y en la
// lista visible del frontend.
const CANALES = Object.freeze({
    MANUAL: "MANUAL",
    WHATSAPP: "WHATSAPP",
    INSTAGRAM: "INSTAGRAM",
    CORREO: "CORREO",
    SISTEMA_EXTERNO: "SISTEMA EXTERNO",
});

const CANALES_VALIDOS = Object.freeze(Object.values(CANALES));

const CANAL_PREDETERMINADO = CANALES.MANUAL;

module.exports = { CANALES, CANALES_VALIDOS, CANAL_PREDETERMINADO };
