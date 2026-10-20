const { test } = require("node:test");
const assert = require("node:assert/strict");
const { validarDireccion } = require("../src/services/ValidadorDireccion");

const DIRECCION_VALIDA = {
    calle: "Av. Rivadavia",
    altura: "1234",
    localidad: "Lanús",
    provincia: "Buenos Aires",
};

function codigos(resultado) {
    return resultado.problemas.map((problema) => problema.codigo);
}

test("una dirección completa y válida devuelve estado VALIDA sin problemas", () => {
    const resultado = validarDireccion(DIRECCION_VALIDA);
    assert.equal(resultado.estado, "VALIDA");
    assert.deepEqual(resultado.problemas, []);
});

test("cada campo obligatorio vacío genera un problema CAMPO_OBLIGATORIO con gravedad ERROR", () => {
    for (const campo of ["calle", "altura", "localidad", "provincia"]) {
        const resultado = validarDireccion({ ...DIRECCION_VALIDA, [campo]: "" });
        assert.equal(resultado.estado, "CON_ADVERTENCIAS");
        assert.deepEqual(codigos(resultado), ["CAMPO_OBLIGATORIO"]);
        assert.equal(resultado.problemas[0].campo, campo);
        assert.equal(resultado.problemas[0].gravedad, "ERROR");
    }
});

test("los campos ausentes y con solo espacios cuentan como vacíos", () => {
    assert.deepEqual(codigos(validarDireccion({ ...DIRECCION_VALIDA, calle: undefined })), ["CAMPO_OBLIGATORIO"]);
    assert.deepEqual(codigos(validarDireccion({ ...DIRECCION_VALIDA, localidad: "   " })), ["CAMPO_OBLIGATORIO"]);
});

test("el código postal es opcional y no genera problemas", () => {
    assert.equal(validarDireccion({ ...DIRECCION_VALIDA }).estado, "VALIDA");
    assert.equal(validarDireccion({ ...DIRECCION_VALIDA, codigo_postal: "" }).estado, "VALIDA");
});

test("la altura vacía se reporta como obligatoria y no como altura inválida", () => {
    const resultado = validarDireccion({ ...DIRECCION_VALIDA, altura: "" });
    assert.deepEqual(codigos(resultado), ["CAMPO_OBLIGATORIO"]);
    assert.equal(resultado.problemas[0].campo, "altura");
});

test("la altura 0, 00 o 000 devuelve ALTURA_CERO", () => {
    for (const altura of [0, "0", "00", "000"]) {
        const resultado = validarDireccion({ ...DIRECCION_VALIDA, altura });
        assert.deepEqual(codigos(resultado), ["ALTURA_CERO"], `altura ${altura}`);
        assert.equal(resultado.problemas[0].gravedad, "ERROR");
    }
});

test("las variantes de S/N devuelven ALTURA_SIN_NUMERO", () => {
    for (const altura of ["S/N", "s/n", "S / N", "SN", "sin número", "sin numero", "sin nro"]) {
        const resultado = validarDireccion({ ...DIRECCION_VALIDA, altura });
        assert.deepEqual(codigos(resultado), ["ALTURA_SIN_NUMERO"], `altura ${altura}`);
        assert.equal(resultado.problemas[0].gravedad, "ERROR");
    }
});

test("una altura 0 con 'bis' devuelve ALTURA_CERO y no es válida", () => {
    for (const altura of ["0 bis", "0 BIS", "0bis"]) {
        const resultado = validarDireccion({ ...DIRECCION_VALIDA, altura });
        assert.deepEqual(codigos(resultado), ["ALTURA_CERO"], `altura ${altura}`);
        assert.equal(resultado.problemas[0].gravedad, "ERROR");
    }
});

test("una altura que no es numérica devuelve ALTURA_NO_NUMERICA", () => {
    for (const altura of ["mil doscientos", "1 b", "depto", "abc"]) {
        const resultado = validarDireccion({ ...DIRECCION_VALIDA, altura });
        assert.deepEqual(codigos(resultado), ["ALTURA_NO_NUMERICA"], `altura ${altura}`);
        assert.equal(resultado.problemas[0].gravedad, "ERROR");
    }
});

test("una altura numérica con 'bis' es válida", () => {
    for (const altura of ["1234 bis", "1234 BIS", "1234bis", "1234  Bis"]) {
        const resultado = validarDireccion({ ...DIRECCION_VALIDA, altura });
        assert.equal(resultado.estado, "VALIDA", `altura ${altura}`);
        assert.deepEqual(resultado.problemas, [], `altura ${altura}`);
    }
});

test("varios errores a la vez dejan el estado en CON_ADVERTENCIAS", () => {
    const resultado = validarDireccion({ calle: "", altura: "S/N", localidad: "", provincia: "Buenos Aires" });
    assert.equal(resultado.estado, "CON_ADVERTENCIAS");
    assert.deepEqual(codigos(resultado), ["CAMPO_OBLIGATORIO", "CAMPO_OBLIGATORIO", "ALTURA_SIN_NUMERO"]);
    assert.deepEqual(
        resultado.problemas.map((problema) => problema.campo),
        ["calle", "localidad", "altura"]
    );
});

function resultadoCalle(calle) {
    return validarDireccion({ ...DIRECCION_VALIDA, calle });
}

test("una calle que parece intersección avisa con INTERSECCION_EN_CALLE (ADVERTENCIA)", () => {
    for (const calle of ["Rivadavia y Belgrano", "Mitre e Yrigoyen", "Corrientes esq. Callao", "San Martín esquina Belgrano"]) {
        const resultado = resultadoCalle(calle);
        assert.deepEqual(codigos(resultado), ["INTERSECCION_EN_CALLE"], `calle ${calle}`);
        assert.equal(resultado.problemas[0].gravedad, "ADVERTENCIA");
    }
});

test("una calle que no es intersección no avisa", () => {
    for (const calle of ["Hipólito Yrigoyen", "Avenida de Mayo", "Corrientes"]) {
        const resultado = resultadoCalle(calle);
        assert.deepEqual(resultado.problemas, [], `calle ${calle}`);
        assert.equal(resultado.estado, "VALIDA", `calle ${calle}`);
    }
});

test("piso, depto o teléfono dentro de la calle avisa DATOS_MEZCLADOS_EN_CALLE (ADVERTENCIA)", () => {
    for (const calle of ["Corrientes 4B", "Mitre piso 3", "Belgrano dpto 2", "Alsina 5°", "Corrientes 12345678", "Corrientes 1234"]) {
        const resultado = resultadoCalle(calle);
        assert.deepEqual(codigos(resultado), ["DATOS_MEZCLADOS_EN_CALLE"], `calle ${calle}`);
        assert.equal(resultado.problemas[0].gravedad, "ADVERTENCIA");
    }
});

test("'Alsina 5°' avisa como piso y no como altura al final", () => {
    for (const calle of ["Alsina 5°", "Alsina 5° B"]) {
        const resultado = resultadoCalle(calle);
        assert.equal(resultado.problemas[0].codigo, "DATOS_MEZCLADOS_EN_CALLE", `calle ${calle}`);
        assert.match(resultado.problemas[0].mensaje, /piso o departamento/i, `calle ${calle}`);
    }
});

test("'1° de Mayo' no es piso y no avisa", () => {
    for (const calle of ["1° de Mayo", "1º de Mayo", "Av. 1° de Mayo"]) {
        const resultado = resultadoCalle(calle);
        assert.deepEqual(resultado.problemas, [], `calle ${calle}`);
        assert.equal(resultado.estado, "VALIDA", `calle ${calle}`);
    }
});

test("las rutas con kilómetro no avisan", () => {
    for (const calle of ["Ruta 2 km 45", "Ruta Nacional 3 km 40"]) {
        const resultado = resultadoCalle(calle);
        assert.deepEqual(resultado.problemas, [], `calle ${calle}`);
        assert.equal(resultado.estado, "VALIDA", `calle ${calle}`);
    }
});

test("nombres de calle con número al inicio o tipo genérico no avisan", () => {
    for (const calle of ["Calle 50", "9 de Julio", "25 de Mayo", "Ruta 3", "Ruta Nacional 3", "Ruta Provincial 2", "Diagonal 74", "Pasaje 12", "Camino 5"]) {
        const resultado = resultadoCalle(calle);
        assert.deepEqual(resultado.problemas, [], `calle ${calle}`);
        assert.equal(resultado.estado, "VALIDA", `calle ${calle}`);
    }
});

function resultadoCon(overrides) {
    return validarDireccion({ ...DIRECCION_VALIDA, ...overrides });
}

test("las 24 jurisdicciones argentinas son provincias válidas", () => {
    const provincias = [
        "Buenos Aires",
        "Ciudad Autónoma de Buenos Aires",
        "Catamarca",
        "Chaco",
        "Chubut",
        "Córdoba",
        "Corrientes",
        "Entre Ríos",
        "Formosa",
        "Jujuy",
        "La Pampa",
        "La Rioja",
        "Mendoza",
        "Misiones",
        "Neuquén",
        "Río Negro",
        "Salta",
        "San Juan",
        "San Luis",
        "Santa Cruz",
        "Santa Fe",
        "Santiago del Estero",
        "Tierra del Fuego, Antártida e Islas del Atlántico Sur",
        "Tucumán",
    ];
    for (const provincia of provincias) {
        const resultado = resultadoCon({ provincia });
        assert.deepEqual(resultado.problemas, [], `provincia ${provincia}`);
    }
});

test("acepta variantes de escritura, formas cortas y abreviaturas de provincia", () => {
    const variantes = [
        "CABA",
        "Capital Federal",
        "Ciudad Autónoma de Buenos Aires",
        "c.a.b.a.",
        "Buenos Aires",
        "Bs As",
        "Bs. As.",
        "Provincia de Buenos Aires",
        "Pcia. de Bs. As.",
        "Prov. de Buenos Aires",
        "Provincia de Bs As",
        "Pcia Buenos Aires",
        "Ciudad Autónoma de Bs As",
        "Córdoba",
        "Tucumán",
        "Río Negro",
        "Neuquén",
        "Entre Ríos",
        "Tierra del Fuego",
        "Cba",
        "Sta Fe",
        "Sgo del Estero",
        "Sta Cruz",
    ];
    for (const provincia of variantes) {
        const resultado = resultadoCon({ provincia });
        assert.deepEqual(resultado.problemas, [], `provincia ${provincia}`);
    }
});

test("una provincia desconocida o 'capital' sola devuelve PROVINCIA_INVALIDA", () => {
    for (const provincia of ["Narnia", "Uruguay", "capital"]) {
        const resultado = resultadoCon({ provincia });
        assert.deepEqual(codigos(resultado), ["PROVINCIA_INVALIDA"], `provincia ${provincia}`);
        assert.equal(resultado.problemas[0].campo, "provincia");
        assert.equal(resultado.problemas[0].gravedad, "ERROR");
        assert.equal(resultado.estado, "CON_ADVERTENCIAS");
    }
});

test("la provincia vacía se reporta como obligatoria y no como inválida", () => {
    const resultado = resultadoCon({ provincia: "" });
    assert.deepEqual(codigos(resultado), ["CAMPO_OBLIGATORIO"]);
    assert.equal(resultado.problemas[0].campo, "provincia");
});

test("CABA como localidad con provincia Buenos Aires avisa CABA_PROVINCIA_CONFUNDIDA", () => {
    for (const localidad of ["CABA", "Capital Federal"]) {
        for (const provincia of ["Buenos Aires", "Bs As"]) {
            const resultado = resultadoCon({ localidad, provincia });
            assert.deepEqual(codigos(resultado), ["CABA_PROVINCIA_CONFUNDIDA"], `localidad ${localidad}, provincia ${provincia}`);
            assert.equal(resultado.problemas[0].campo, "localidad");
            assert.equal(resultado.problemas[0].gravedad, "ADVERTENCIA");
            assert.equal(resultado.estado, "VALIDA");
        }
    }
});

test("no avisa CABA_PROVINCIA_CONFUNDIDA cuando la jurisdicción es coherente", () => {
    assert.deepEqual(resultadoCon({ localidad: "CABA", provincia: "CABA" }).problemas, []);
    assert.deepEqual(resultadoCon({ localidad: "Lanús", provincia: "Buenos Aires" }).problemas, []);
});

test("el código postal vacío o con formato válido no genera problemas", () => {
    for (const codigo_postal of ["", undefined, "1828", " 1828 ", "B1828", "b1828", "B1828ABC", "b1828abc"]) {
        const resultado = resultadoCon({ codigo_postal });
        assert.deepEqual(resultado.problemas, [], `codigo_postal ${codigo_postal}`);
    }
});

test("un código postal con formato inválido avisa CP_FORMATO_INVALIDO", () => {
    for (const codigo_postal of ["182", "18288", "B1828AB", "ABC1234", "B1828ABCD"]) {
        const resultado = resultadoCon({ codigo_postal });
        assert.deepEqual(codigos(resultado), ["CP_FORMATO_INVALIDO"], `codigo_postal ${codigo_postal}`);
        assert.equal(resultado.problemas[0].campo, "codigo_postal");
        assert.equal(resultado.problemas[0].gravedad, "ADVERTENCIA");
    }
});

test("la letra del CPA que coincide con la provincia no avisa", () => {
    assert.deepEqual(resultadoCon({ provincia: "Buenos Aires", codigo_postal: "B1828" }).problemas, []);
    assert.deepEqual(resultadoCon({ provincia: "Buenos Aires", codigo_postal: "B1828ABC" }).problemas, []);
    assert.deepEqual(resultadoCon({ provincia: "CABA", codigo_postal: "C1000ABC" }).problemas, []);
    assert.deepEqual(resultadoCon({ provincia: "Córdoba", codigo_postal: "X5000ABC" }).problemas, []);
    assert.deepEqual(resultadoCon({ provincia: "Tierra del Fuego", codigo_postal: "V9410ABC" }).problemas, []);
});

test("la letra del CPA que no coincide con la provincia avisa CP_NO_COINCIDE_PROVINCIA", () => {
    for (const codigo_postal of ["B1828", "B1828ABC"]) {
        const resultado = resultadoCon({ provincia: "Córdoba", codigo_postal });
        assert.deepEqual(codigos(resultado), ["CP_NO_COINCIDE_PROVINCIA"], `codigo_postal ${codigo_postal}`);
        assert.equal(resultado.problemas[0].campo, "codigo_postal");
        assert.equal(resultado.problemas[0].gravedad, "ADVERTENCIA");
    }
});

test("un CP de 4 dígitos no se contrasta con la provincia ni con la letra del CPA", () => {
    assert.deepEqual(resultadoCon({ provincia: "Córdoba", codigo_postal: "1828" }).problemas, []);
});

test("con provincia inválida no se evalúa la letra del CPA", () => {
    const resultado = resultadoCon({ provincia: "Narnia", codigo_postal: "B1828ABC" });
    assert.deepEqual(codigos(resultado), ["PROVINCIA_INVALIDA"]);
});
