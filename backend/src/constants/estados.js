// Fuente única de estados del pedido (opción acordada: un campo con cinco valores).
// Las transiciones permitidas las valida EstadoPedidoService; acá vive solo el catálogo.
const ESTADOS = Object.freeze({
    EN_STOCK: "EN STOCK",
    EN_PREPARACION: "EN PREPARACIÓN",
    EN_ENVIO: "EN ENVÍO",
    ENTREGADO: "ENTREGADO",
    PAGADO: "PAGADO",
});

const ESTADOS_VALIDOS = Object.freeze(Object.values(ESTADOS));

// Estado en el que nace un pedido recién cargado.
const ESTADO_INICIAL = ESTADOS.EN_STOCK;

module.exports = { ESTADOS, ESTADOS_VALIDOS, ESTADO_INICIAL };
