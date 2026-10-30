const { test } = require("node:test");
const assert = require("node:assert/strict");
const { createPedidoService: crearServicioBase } = require("../src/services/PedidoService");
// Adaptador sintético: estas pruebas no consultan Internet.
const createPedidoService = deps => crearServicioBase({ geocodeAdapter: { async geocodificar() { return { resultado: 'APPROXIMATE', candidatos: [{ latitud: -34.6, longitud: -58.4 }] }; } }, ...deps });


const DIRECCION_VALIDA = {
    calle: "Córdoba",
    altura: "1234",
    localidad: "Rosario",
    provincia: "Santa Fe",
    codigo_postal: "2000",
};

function detalleFixture(overrides = {}) {
    return {
        id: 10,
        direccion_id: 5,
        estado_validacion: "VALIDA",
        direccion_validada: 0,
        calle: "Córdoba",
        altura: "1234",
        piso_depto: null,
        entre_calles: null,
        localidad: "Rosario",
        provincia: "Santa Fe",
        codigo_postal: "2000",
        latitud: null,
        longitud: null,
        nivel_confianza: null,
        direccion_original: "Córdoba 1234 Rosario Santa Fe",
        ...overrides,
    };
}

function reposPedidosFalsos({ detalle = detalleFixture() } = {}) {
    const capturado = { crear: null, actualizarDireccion: null };
    return {
        capturado,
        async buscarCandidatosDuplicados() {
            return [];
        },
        async crear(datos) {
            capturado.crear = datos;
            return 10;
        },
        async listar() {
            return [];
        },
        async obtenerDetalle() {
            return detalle;
        },
        async actualizarDireccion(pedidoId, direccion, opciones) {
            capturado.actualizarDireccion = { pedidoId, direccion, opciones };
        },
    };
}

const clientesFalsos = {
    async buscarPorId(id) {
        return id === 1 ? { id: 1, nombre: "Cliente" } : null;
    },
};

function localidadesFalsas(resultado) {
    const llamadas = [];
    return {
        llamadas,
        async verificar(datos) {
            llamadas.push(datos);
            return resultado;
        },
    };
}

function codigos(problemas) {
    return problemas.map((problema) => problema.codigo);
}

test("una localidad que existe no suma advertencias y consulta con la provincia canónica", async () => {
    const pedidos = reposPedidosFalsos();
    const localidades = localidadesFalsas("EXISTE");
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos, localidades });

    const resultado = await servicio.crear({ cliente_id: 1, importe_base: '100.00', direccion: { ...DIRECCION_VALIDA, provincia: "sta fe" } }, 7);

    assert.deepEqual(resultado.problemas, []);
    assert.deepEqual(localidades.llamadas, [{ provincia: "Santa Fe", localidad: "Rosario" }]);
    assert.equal(pedidos.capturado.crear.direccion.estado_validacion, "VALIDA");
});

test("alta rechazada con localidad NO_EXISTE sin persistir", async()=>{
 const pedidos=reposPedidosFalsos();const servicio=createPedidoService({pedidos,clientes:clientesFalsos,localidades:localidadesFalsas('NO_EXISTE')});
 await assert.rejects(servicio.crear({cliente_id:1,direccion:DIRECCION_VALIDA},7),e=>e.statusCode===400 && Boolean(e.campos.localidad));assert.equal(pedidos.capturado.crear,null);
});

test("alta rechazada con localidad NO_VERIFICADO sin persistir", async()=>{
 const pedidos=reposPedidosFalsos();const servicio=createPedidoService({pedidos,clientes:clientesFalsos,localidades:localidadesFalsas('NO_VERIFICADO')});
 await assert.rejects(servicio.crear({cliente_id:1,direccion:DIRECCION_VALIDA},7),e=>e.statusCode===503);assert.equal(pedidos.capturado.crear,null);
});

test("actualizar la dirección también avisa por la localidad sin cambiar el estado", async () => {
    const pedidos = reposPedidosFalsos();
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos, localidades: localidadesFalsas("NO_EXISTE") });

    const resultado = await servicio.actualizarDireccion(10, { ...DIRECCION_VALIDA, localidad: "Rosario del Tala" });

    assert.deepEqual(codigos(resultado.problemas), ["LOCALIDAD_NO_ENCONTRADA"]);
    assert.equal(pedidos.capturado.actualizarDireccion.direccion.estado_validacion, "VALIDA");
});

test("provincia inválida rechaza alta sin consultar localidad ni persistir",async()=>{
 const pedidos=reposPedidosFalsos();const localidades=localidadesFalsas('EXISTE');const servicio=createPedidoService({pedidos,clientes:clientesFalsos,localidades});
 await assert.rejects(servicio.crear({cliente_id:1,direccion:{...DIRECCION_VALIDA,provincia:'Narnia'}},7),e=>e.statusCode===400);assert.deepEqual(localidades.llamadas,[]);assert.equal(pedidos.capturado.crear,null);
});

test("sin servicio de localidades no se consulta ni se agregan advertencias", async () => {
    const pedidos = reposPedidosFalsos();
    const servicio = createPedidoService({ pedidos, clientes: clientesFalsos });

    const resultado = await servicio.crear({ cliente_id: 1, importe_base: '100.00', direccion: DIRECCION_VALIDA }, 7);

    assert.deepEqual(resultado.problemas, []);
});
