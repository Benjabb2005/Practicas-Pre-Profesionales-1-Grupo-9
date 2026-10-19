const { test } = require("node:test");
const assert = require("node:assert/strict");
const { normalizarDireccion } = require("../src/services/NormalizadorDireccion");

const DIRECCION_BASE = {
    calle: "Av. Rivadavia",
    altura: "1234",
    piso_depto: "",
    entre_calles: "",
    localidad: "Lanús",
    provincia: "Buenos Aires",
    codigo_postal: "1828",
};

function normalizar(overrides = {}) {
    return normalizarDireccion({ ...DIRECCION_BASE, ...overrides });
}

test("devuelve un objeto nuevo y no modifica el original", () => {
    const original = { ...DIRECCION_BASE, calle: "  av. rivadavia  " };
    const copia = { ...original };

    const resultado = normalizarDireccion(original);

    assert.notEqual(resultado, original);
    assert.deepEqual(original, copia);
    assert.equal(resultado.calle, "Avenida Rivadavia");
});

test("saca los espacios de más al principio, al final y en el medio", () => {
    const resultado = normalizar({
        calle: "  Avenida   Hipólito   Yrigoyen  ",
        localidad: "  La   Plata ",
        piso_depto: "  3   B ",
    });

    assert.equal(resultado.calle, "Avenida Hipólito Yrigoyen");
    assert.equal(resultado.localidad, "La Plata");
    assert.equal(resultado.piso_depto, "3 B");
});

test("aplica formato título con conectores en minúscula y conserva las tildes", () => {
    const resultado = normalizar({
        calle: "AVENIDA hipólito yrigoyen",
        entre_calles: "MITRE Y BELGRANO",
        localidad: "LANÚS",
    });

    assert.equal(resultado.calle, "Avenida Hipólito Yrigoyen");
    assert.equal(resultado.entre_calles, "Mitre y Belgrano");
    assert.equal(resultado.localidad, "Lanús");
});

test("un conector que abre el texto va en mayúscula", () => {
    assert.equal(normalizar({ calle: "DE LOS ANDES" }).calle, "De los Andes");
    assert.equal(normalizar({ calle: "Avenida DE LOS ANDES" }).calle, "Avenida de los Andes");
});

test("expande las abreviaturas como palabra suelta, con o sin punto", () => {
    const casos = [
        ["Av. Rivadavia", "Avenida Rivadavia"],
        ["Av Rivadavia", "Avenida Rivadavia"],
        ["Avda. San Martín", "Avenida San Martín"],
        ["Gral. Paz", "General Paz"],
        ["Pje. 12", "Pasaje 12"],
        ["Psje. 12", "Pasaje 12"],
        ["Bv. Oroño", "Boulevard Oroño"],
        ["Blvd. Oroño", "Boulevard Oroño"],
        ["Dr. Alderete", "Doctor Alderete"],
        ["Ing. Huergo", "Ingeniero Huergo"],
        ["Cnel. Brandsen", "Coronel Brandsen"],
        ["Tte. Gral. Perón", "Teniente General Perón"],
        ["Gdor. Vergara", "Gobernador Vergara"],
        ["Pres. Perón", "Presidente Perón"],
        ["Sta. Fe", "Santa Fe"],
        ["Sto. Tomé", "Santo Tomé"],
    ];

    for (const [calle, esperada] of casos) {
        assert.equal(normalizar({ calle }).calle, esperada, calle);
    }
});

test("Pte. no se expande y las abreviaturas dentro de otra palabra no se tocan", () => {
    assert.equal(normalizar({ calle: "Pte. Perón" }).calle, "Pte. Perón");
    assert.equal(normalizar({ calle: "Avenida Rivadavia" }).calle, "Avenida Rivadavia");
    assert.equal(normalizar({ calle: "Ingeniería" }).calle, "Ingeniería");
});

test("los números romanos formados solo por I, V y X van en mayúscula", () => {
    assert.equal(normalizar({ calle: "pío xii" }).calle, "Pío XII");
    assert.equal(normalizar({ calle: "pio xii" }).calle, "Pio XII");
    assert.equal(normalizar({ calle: "juan xxiii" }).calle, "Juan XXIII");
    assert.equal(normalizar({ calle: "papa xiv" }).calle, "Papa XIV");
    assert.equal(normalizar({ calle: "tomo iii" }).calle, "Tomo III");
});

test("las palabras con M, C, D o L no se tratan como romanas", () => {
    const casos = [
        ["mi", "Mi"],
        ["di", "Di"],
        ["mil", "Mil"],
        ["cid", "Cid"],
    ];

    for (const [entrada, esperada] of casos) {
        assert.equal(normalizar({ calle: entrada }).calle, esperada, entrada);
    }
});

test("pone mayúscula después del apóstrofo", () => {
    assert.equal(normalizar({ calle: "o’higgins" }).calle, "O’Higgins");
    assert.equal(normalizar({ calle: "o'higgins" }).calle, "O'Higgins");
    assert.equal(normalizar({ localidad: "O’HIGGINS" }).localidad, "O’Higgins");
});

test("CABA se mantiene en mayúscula", () => {
    assert.equal(normalizar({ localidad: "caba" }).localidad, "CABA");
    assert.equal(normalizar({ calle: "Caba" }).calle, "CABA");
});

test("la provincia usa el nombre oficial cuando se reconoce", () => {
    assert.equal(normalizar({ provincia: "caba" }).provincia, "Ciudad Autónoma de Buenos Aires");
    assert.equal(normalizar({ provincia: "Bs. As." }).provincia, "Buenos Aires");
    assert.equal(normalizar({ provincia: "Sta Fe" }).provincia, "Santa Fe");
});

test("una provincia desconocida queda como texto limpio", () => {
    assert.equal(normalizar({ provincia: "  Narnia   del Sur " }).provincia, "Narnia del Sur");
});

test("la altura quita los puntos de miles y deja bis en minúscula", () => {
    assert.equal(normalizar({ altura: "1.234" }).altura, "1234");
    assert.equal(normalizar({ altura: "12.345" }).altura, "12345");
    assert.equal(normalizar({ altura: "1.234.567" }).altura, "1234567");
    assert.equal(normalizar({ altura: "1234 BIS" }).altura, "1234 bis");
    assert.equal(normalizar({ altura: "1234bis" }).altura, "1234 bis");
    assert.equal(normalizar({ altura: "1234BIS" }).altura, "1234 bis");
    assert.equal(normalizar({ altura: "1234  bis" }).altura, "1234 bis");
    assert.equal(normalizar({ altura: " 1.234   BIS " }).altura, "1234 bis");
    assert.equal(normalizar({ altura: "1.5" }).altura, "1.5");
});

test("'1234bis', '1234BIS' y '1234 bis' quedan iguales", () => {
    const juntos = normalizar({ altura: "1234bis" });
    const mayusculas = normalizar({ altura: "1234BIS" });
    const separado = normalizar({ altura: "1234 bis" });

    assert.equal(juntos.altura, "1234 bis");
    assert.deepEqual(juntos, mayusculas);
    assert.deepEqual(juntos, separado);
});

test("el código postal va en mayúsculas y sin espacios", () => {
    assert.equal(normalizar({ codigo_postal: "b 1828 abc" }).codigo_postal, "B1828ABC");
    assert.equal(normalizar({ codigo_postal: " b1828abc " }).codigo_postal, "B1828ABC");
    assert.equal(normalizar({ codigo_postal: "1828" }).codigo_postal, "1828");
});

test("los campos vacíos o ausentes quedan igual", () => {
    const resultado = normalizarDireccion({
        calle: "",
        altura: "",
        localidad: "   ",
        provincia: null,
        codigo_postal: undefined,
    });

    assert.equal(resultado.calle, "");
    assert.equal(resultado.altura, "");
    assert.equal(resultado.localidad, "   ");
    assert.equal(resultado.provincia, null);
    assert.equal(resultado.codigo_postal, undefined);

    const sinCampos = normalizarDireccion({ calle: "Av. Rivadavia" });
    assert.equal("altura" in sinCampos, false);
    assert.equal("localidad" in sinCampos, false);
});

test("'Av. H. Yrigoyen 1234' y 'Avenida H. Yrigoyen 1234' quedan iguales después de normalizar", () => {
    const abreviada = normalizar({ calle: "Av. H. Yrigoyen 1234" });
    const expandida = normalizar({ calle: "Avenida H. Yrigoyen 1234" });

    assert.equal(abreviada.calle, expandida.calle);
    assert.deepEqual(abreviada, expandida);
    assert.equal(abreviada.calle, "Avenida H. Yrigoyen 1234");
});
