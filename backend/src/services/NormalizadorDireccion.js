const { normalizarProvincia } = require("../constants/provincias");

const CONECTORES = Object.freeze(new Set(["de", "del", "la", "las", "los", "y", "e"]));

// Solo palabras formadas por I, V y X. Con M, C, D o L se confunden palabras
// comunes ("mi", "di", "mil", "Cid"), así que quedan fuera.
const NUMERO_ROMANO = /^[IVX]{2,}$/i;

// Se comparan sin el punto final para aceptar la abreviatura con o sin punto.
const ABREVIATURAS = Object.freeze({
    av: "Avenida",
    avda: "Avenida",
    gral: "General",
    pje: "Pasaje",
    psje: "Pasaje",
    bv: "Boulevard",
    blvd: "Boulevard",
    dr: "Doctor",
    ing: "Ingeniero",
    cnel: "Coronel",
    tte: "Teniente",
    gdor: "Gobernador",
    pres: "Presidente",
    sta: "Santa",
    sto: "Santo",
});

function estaVacio(valor) {
    return String(valor == null ? "" : valor).trim() === "";
}

function limpiarEspacios(valor) {
    return String(valor).replace(/\s+/g, " ").trim();
}

function expandirAbreviaturas(texto) {
    return texto
        .split(" ")
        .map((palabra) => {
            const clave = palabra.replace(/\.$/, "").toLowerCase();
            return Object.prototype.hasOwnProperty.call(ABREVIATURAS, clave) ? ABREVIATURAS[clave] : palabra;
        })
        .join(" ");
}

function capitalizarPalabra(palabra) {
    const minuscula = palabra.toLowerCase();

    if (NUMERO_ROMANO.test(minuscula)) {
        return palabra.toUpperCase();
    }
    if (minuscula === "caba") {
        return "CABA";
    }

    const conInicial = minuscula.charAt(0).toUpperCase() + minuscula.slice(1);
    // No agrega tildes: solo cambia la caja de las letras ya escritas.
    return conInicial.replace(/(['’])([a-záéíóúüñ])/g, (_, apostrofo, letra) => apostrofo + letra.toUpperCase());
}

function aFormatoTitulo(valor) {
    const palabras = limpiarEspacios(valor).split(" ");
    return palabras
        .map((palabra, indice) => {
            const clave = palabra.replace(/\.$/, "").toLowerCase();
            if (CONECTORES.has(clave)) {
                return indice === 0 ? capitalizarPalabra(palabra) : palabra.toLowerCase();
            }
            return capitalizarPalabra(palabra);
        })
        .join(" ");
}

function normalizarCalle(valor) {
    return aFormatoTitulo(expandirAbreviaturas(limpiarEspacios(valor)));
}

function normalizarLocalidad(valor) {
    return aFormatoTitulo(valor);
}

function normalizarCampoProvincia(valor) {
    const oficial = normalizarProvincia(valor);
    return oficial || limpiarEspacios(valor);
}

function normalizarAltura(valor) {
    return String(valor)
        .replace(/(\d)\.(?=\d{3}(?:\D|$))/g, "$1")
        .replace(/(\d)\s*bis/gi, "$1 bis")
        .replace(/bis/gi, "bis")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizarCodigoPostal(valor) {
    return String(valor).toUpperCase().replace(/\s+/g, "");
}

const TRANSFORMACIONES = Object.freeze({
    calle: normalizarCalle,
    entre_calles: normalizarCalle,
    localidad: normalizarLocalidad,
    provincia: normalizarCampoProvincia,
    altura: normalizarAltura,
    piso_depto: limpiarEspacios,
    codigo_postal: normalizarCodigoPostal,
});

// Devuelve un objeto nuevo. Los campos vacíos o ausentes se conservan tal cual.
function normalizarDireccion(direccion) {
    const datos = direccion || {};
    const normalizada = { ...datos };

    for (const [campo, transformar] of Object.entries(TRANSFORMACIONES)) {
        if (campo in normalizada && !estaVacio(normalizada[campo])) {
            normalizada[campo] = transformar(normalizada[campo]);
        }
    }

    return normalizada;
}

module.exports = { normalizarDireccion };
