const { normalizarTexto } = require("../lib/texto");

const PROVINCIA_CABA = "Ciudad Autónoma de Buenos Aires";
const PROVINCIA_BUENOS_AIRES = "Buenos Aires";

// Las 24 jurisdicciones argentinas. `variantes` suma escrituras y abreviaturas comunes;
// el nombre oficial se agrega solo al construir el índice. Los prefijos ("provincia de",
// "pcia", etc.) se quitan al normalizar, por eso no se listan combinaciones.
const PROVINCIAS = Object.freeze([
    { nombre: "Buenos Aires" },
    { nombre: PROVINCIA_CABA, variantes: ["caba", "capital federal", "ciudad de buenos aires"] },
    { nombre: "Catamarca" },
    { nombre: "Chaco" },
    { nombre: "Chubut" },
    { nombre: "Córdoba", variantes: ["cba"] },
    { nombre: "Corrientes" },
    { nombre: "Entre Ríos" },
    { nombre: "Formosa" },
    { nombre: "Jujuy" },
    { nombre: "La Pampa" },
    { nombre: "La Rioja" },
    { nombre: "Mendoza" },
    { nombre: "Misiones" },
    { nombre: "Neuquén" },
    { nombre: "Río Negro" },
    { nombre: "Salta" },
    { nombre: "San Juan" },
    { nombre: "San Luis" },
    { nombre: "Santa Cruz", variantes: ["sta cruz"] },
    { nombre: "Santa Fe", variantes: ["sta fe"] },
    { nombre: "Santiago del Estero", variantes: ["sgo del estero"] },
    {
        nombre: "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
        variantes: ["tierra del fuego", "tierra del fuego antartida e islas del atlantico sur"],
    },
    { nombre: "Tucumán" },
]);

const NOMBRES_PROVINCIAS = Object.freeze(PROVINCIAS.map(({ nombre }) => nombre));

const PROVINCIA_POR_VARIANTE = new Map();
for (const { nombre, variantes = [] } of PROVINCIAS) {
    for (const variante of [nombre, ...variantes]) {
        PROVINCIA_POR_VARIANTE.set(normalizarTexto(variante), nombre);
    }
}

// Letra inicial del CPA según ISO 3166-2:AR.
const PROVINCIA_POR_LETRA_CPA = Object.freeze({
    A: "Salta",
    B: PROVINCIA_BUENOS_AIRES,
    C: PROVINCIA_CABA,
    D: "San Luis",
    E: "Entre Ríos",
    F: "La Rioja",
    G: "Santiago del Estero",
    H: "Chaco",
    J: "San Juan",
    K: "Catamarca",
    L: "La Pampa",
    M: "Mendoza",
    N: "Misiones",
    P: "Formosa",
    Q: "Neuquén",
    R: "Río Negro",
    S: "Santa Fe",
    T: "Tucumán",
    U: "Chubut",
    V: "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
    W: "Corrientes",
    X: "Córdoba",
    Y: "Jujuy",
    Z: "Santa Cruz",
});

const PREFIJO_PROVINCIA = /^(provincia|prov|pcia)\s+(de\s+)?/;

function estaVacio(valor) {
    return String(valor == null ? "" : valor).trim() === "";
}

function normalizarProvincia(valor) {
    if (estaVacio(valor)) return null;
    const normalizada = normalizarTexto(valor)
        .replace(/\b(bs as|bsas)\b/g, "buenos aires")
        .replace(PREFIJO_PROVINCIA, "")
        .trim();
    return PROVINCIA_POR_VARIANTE.get(normalizada) || null;
}

module.exports = {
    PROVINCIAS,
    NOMBRES_PROVINCIAS,
    PROVINCIA_CABA,
    PROVINCIA_BUENOS_AIRES,
    PROVINCIA_POR_LETRA_CPA,
    normalizarProvincia,
};
