const { normalizarTexto } = require("../lib/texto");
const {
    PROVINCIA_CABA,
    PROVINCIA_BUENOS_AIRES,
    PROVINCIA_POR_LETRA_CPA,
    normalizarProvincia,
} = require("../constants/provincias");

const GRAVEDAD = Object.freeze({ ERROR: "ERROR", ADVERTENCIA: "ADVERTENCIA" });

const CAMPOS_OBLIGATORIOS = Object.freeze([
    { campo: "calle", mensaje: "Ingresá la calle." },
    { campo: "altura", mensaje: "Ingresá la altura." },
    { campo: "localidad", mensaje: "Ingresá la localidad." },
    { campo: "provincia", mensaje: "Ingresá la provincia." },
]);

const FORMAS_SIN_NUMERO = Object.freeze(new Set(["s/n", "sn", "sin numero", "sin nro", "sin n"]));

function estaVacio(valor) {
    return String(valor == null ? "" : valor).trim() === "";
}

// Clasifica la altura ya normalizada. Devuelve un código de problema o null si es válida.
// Una altura numérica con "bis" opcional ("1234", "1234 bis") es válida.
function clasificarAltura(valorNormalizado) {
    const sinBis = valorNormalizado.replace(/\s*bis$/, "").trim();
    if (/^\d+$/.test(sinBis) && Number(sinBis) === 0) {
        return "ALTURA_CERO";
    }
    if (FORMAS_SIN_NUMERO.has(valorNormalizado)) {
        return "ALTURA_SIN_NUMERO";
    }
    if (/^\d+$/.test(sinBis)) {
        return null;
    }
    return "ALTURA_NO_NUMERICA";
}

const MENSAJES_ALTURA = Object.freeze({
    ALTURA_CERO: "La altura no puede ser 0. Ingresá un número.",
    ALTURA_SIN_NUMERO: "La altura S/N no sirve para despachar. Ingresá un número.",
    ALTURA_NO_NUMERICA: "La altura debe ser un número (podés agregar 'bis').",
});

const MENSAJE_INTERSECCION = "La calle parece una intersección (dos calles). Cargá una sola calle.";

const MENSAJES_MEZCLADOS = Object.freeze({
    PISO: "Parece haber un piso o departamento dentro de la calle. Separá esos datos.",
    TELEFONO: "Parece haber un teléfono dentro de la calle. Cargá la altura por separado.",
    ALTURA_FINAL: "Parece que la altura está dentro de la calle. Cargala en el campo Altura.",
});

// Conector de intersección como palabra suelta: no confunde la "y" de "Yrigoyen".
const CONECTOR_INTERSECCION = /\b(y|e|esq|esquina)\b/;
const PALABRA_PISO = /\b(piso|depto|dpto|dep|pb|planta|entrepiso)\b/;
// El grado solo indica piso si cierra la calle ("5°") o ante una letra suelta ("5° B").
// No lo es cuando sigue un nombre ("1° de Mayo").
const SIMBOLO_PISO = /[º°]\s*(?:$|[a-z]\b)/i;
const LETRA_JUNTO_A_NUMERO = /\d\s*[a-z](?![a-z])/;
const TELEFONO = /\d{8,}/;
const TERMINA_EN_NUMERO = /\d+\s*$/;
// Calle cuyo nombre es un tipo genérico + número ("Calle 50", "Ruta Nacional 3").
const CALLE_TIPO_NUMERO = /^(calle|ruta|avenida|av|avda|pasaje|pje|autopista|camino|boulevard|bulevar|bv|diagonal|colectora)(\s+(nacional|provincial|general|gral))?\s+\d+$/;
// Ruta con kilómetro ("Ruta 2 km 45", "Ruta Nacional 3 km 40").
const RUTA_CON_KM = /^ruta(\s+(nacional|provincial|general|gral))?\s+\d+\s+(km|kilometro)\s+\d+$/;

const MENSAJES_PROVINCIA = Object.freeze({
    PROVINCIA_INVALIDA: "La provincia no es una jurisdicción argentina válida. Elegila de la lista.",
    CABA_PROVINCIA_CONFUNDIDA: "La localidad es CABA/Capital Federal pero la provincia cargada es Buenos Aires. Revisá la jurisdicción.",
    CP_FORMATO_INVALIDO: "El código postal debe tener 4 dígitos (1828), letra + 4 dígitos (B1828) o formato CPA (B1828ABC).",
    CP_NO_COINCIDE_PROVINCIA: "La letra del CPA no coincide con la provincia cargada.",
});

function detectarInterseccionEnCalle(calleNormalizada) {
    return CONECTOR_INTERSECCION.test(calleNormalizada);
}

// Devuelve el mensaje del subcaso detectado o null. Un solo problema por calle.
function detectarDatosMezclados(calleOriginal, calleNormalizada) {
    if (
        SIMBOLO_PISO.test(String(calleOriginal)) ||
        PALABRA_PISO.test(calleNormalizada) ||
        LETRA_JUNTO_A_NUMERO.test(calleNormalizada)
    ) {
        return MENSAJES_MEZCLADOS.PISO;
    }
    if (TELEFONO.test(calleNormalizada)) {
        return MENSAJES_MEZCLADOS.TELEFONO;
    }
    if (TERMINA_EN_NUMERO.test(calleNormalizada) && !CALLE_TIPO_NUMERO.test(calleNormalizada) && !RUTA_CON_KM.test(calleNormalizada)) {
        return MENSAJES_MEZCLADOS.ALTURA_FINAL;
    }
    return null;
}

function validarDireccion(direccion) {
    const datos = direccion || {};
    const problemas = [];

    for (const { campo, mensaje } of CAMPOS_OBLIGATORIOS) {
        if (estaVacio(datos[campo])) {
            problemas.push({ codigo: "CAMPO_OBLIGATORIO", campo, mensaje, gravedad: GRAVEDAD.ERROR });
        }
    }

    // La altura vacía ya se reporta como obligatoria: no se duplica el problema.
    if (!estaVacio(datos.altura)) {
        const codigo = clasificarAltura(normalizarTexto(datos.altura));
        if (codigo) {
            problemas.push({ codigo, campo: "altura", mensaje: MENSAJES_ALTURA[codigo], gravedad: GRAVEDAD.ERROR });
        }
    }

    // Advertencias de calle: avisan pero no bloquean. Una calle vacía ya se reportó
    // como obligatoria, así que no se analiza.
    if (!estaVacio(datos.calle)) {
        const calleNormalizada = normalizarTexto(datos.calle);
        if (detectarInterseccionEnCalle(calleNormalizada)) {
            problemas.push({
                codigo: "INTERSECCION_EN_CALLE",
                campo: "calle",
                mensaje: MENSAJE_INTERSECCION,
                gravedad: GRAVEDAD.ADVERTENCIA,
            });
        }
        const mensajeMezclado = detectarDatosMezclados(datos.calle, calleNormalizada);
        if (mensajeMezclado) {
            problemas.push({
                codigo: "DATOS_MEZCLADOS_EN_CALLE",
                campo: "calle",
                mensaje: mensajeMezclado,
                gravedad: GRAVEDAD.ADVERTENCIA,
            });
        }
    }

    const provinciaCanonica = normalizarProvincia(datos.provincia);

    // Una provincia vacía ya se reportó como obligatoria: no se duplica el problema.
    if (!estaVacio(datos.provincia) && !provinciaCanonica) {
        problemas.push({
            codigo: "PROVINCIA_INVALIDA",
            campo: "provincia",
            mensaje: MENSAJES_PROVINCIA.PROVINCIA_INVALIDA,
            gravedad: GRAVEDAD.ERROR,
        });
    }

    if (provinciaCanonica === PROVINCIA_BUENOS_AIRES && normalizarProvincia(datos.localidad) === PROVINCIA_CABA) {
        problemas.push({
            codigo: "CABA_PROVINCIA_CONFUNDIDA",
            campo: "localidad",
            mensaje: MENSAJES_PROVINCIA.CABA_PROVINCIA_CONFUNDIDA,
            gravedad: GRAVEDAD.ADVERTENCIA,
        });
    }

    const codigoPostal = String(datos.codigo_postal == null ? "" : datos.codigo_postal).trim();
    if (codigoPostal !== "") {
        const esCp4 = /^\d{4}$/.test(codigoPostal);
        const esCpConLetra = /^[A-Za-z]\d{4}$/.test(codigoPostal);
        const esCpa = /^[A-Za-z]\d{4}[A-Za-z]{3}$/.test(codigoPostal);
        if (!esCp4 && !esCpConLetra && !esCpa) {
            problemas.push({
                codigo: "CP_FORMATO_INVALIDO",
                campo: "codigo_postal",
                mensaje: MENSAJES_PROVINCIA.CP_FORMATO_INVALIDO,
                gravedad: GRAVEDAD.ADVERTENCIA,
            });
        } else if (esCpConLetra || esCpa) {
            // Limitación: no se verifica que un CP de 4 dígitos corresponda a la
            // localidad, porque no existe una fuente oficial abierta para hacerlo.
            const provinciaCpa = PROVINCIA_POR_LETRA_CPA[codigoPostal[0].toUpperCase()];
            if (provinciaCanonica && provinciaCpa && provinciaCanonica !== provinciaCpa) {
                problemas.push({
                    codigo: "CP_NO_COINCIDE_PROVINCIA",
                    campo: "codigo_postal",
                    mensaje: MENSAJES_PROVINCIA.CP_NO_COINCIDE_PROVINCIA,
                    gravedad: GRAVEDAD.ADVERTENCIA,
                });
            }
        }
    }

    const hayError = problemas.some((problema) => problema.gravedad === GRAVEDAD.ERROR);
    return { estado: hayError ? "CON_ADVERTENCIAS" : "VALIDA", problemas };
}

module.exports = { validarDireccion, clasificarAltura, normalizarTexto, detectarInterseccionEnCalle, detectarDatosMezclados, normalizarProvincia };
