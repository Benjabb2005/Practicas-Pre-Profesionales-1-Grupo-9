const { test } = require("node:test");
const assert = require("node:assert/strict");
const { analizar, aplicar, normalizarEstado } = require("../src/import/importador");

function crearFakeDb() {
    const estado = { clientes: [], pedidos: [], direcciones: [], historial: [] };
    let idCliente = 0;
    let idPedido = 0;
    let idDireccion = 0;

    const conexion = {
        beginTransaction: async () => {},
        commit: async () => {},
        rollback: async () => {},
        release: () => {},
        async query(sql, params = []) {
            if (sql.includes("SELECT id, codigo_origen FROM clientes")) {
                return [estado.clientes.map((c) => ({ id: c.id, codigo_origen: c.codigo_origen }))];
            }
            if (sql.startsWith("INSERT INTO clientes")) {
                const id = ++idCliente;
                estado.clientes.push({ id, codigo_origen: params[0], nombre: params[1] });
                return [{ insertId: id }];
            }
            if (sql.includes("SELECT id, codigo FROM pedidos")) {
                return [estado.pedidos.map((p) => ({ id: p.id, codigo: p.codigo }))];
            }
            if (sql.startsWith("INSERT INTO pedidos")) {
                const id = ++idPedido;
                estado.pedidos.push({ id, codigo: params[0], cliente_id: params[1] });
                return [{ insertId: id }];
            }
            if (sql.startsWith("INSERT INTO direcciones")) {
                const id = ++idDireccion;
                estado.direcciones.push({ id, pedido_id: params[0] });
                return [{ insertId: id }];
            }
            if (sql.includes("SELECT id, pedido_id FROM direcciones")) {
                return [estado.direcciones.map((d) => ({ id: d.id, pedido_id: d.pedido_id }))];
            }
            if (sql.includes("SELECT id FROM historial_geolocalizacion")) {
                const iguales = estado.historial.filter((h) =>
                    h.direccion_id === params[0] &&
                    h.direccion_enviada === params[1] &&
                    h.resultado === params[2] &&
                    (h.latitud ?? null) === (params[3] ?? null) &&
                    (h.longitud ?? null) === (params[4] ?? null)
                );
                return [iguales.map((h) => ({ id: h.id }))];
            }
            if (sql.startsWith("INSERT INTO historial_geolocalizacion")) {
                estado.historial.push({ id: estado.historial.length + 1, direccion_id: params[0], direccion_enviada: params[1], resultado: params[2], latitud: params[3], longitud: params[4] });
                return [{ insertId: estado.historial.length }];
            }
            throw new Error(`Consulta no simulada: ${sql}`);
        },
    };

    return { estado, getConnection: async () => conexion };
}

test("normalizarEstado reconoce variantes y rechaza desconocidos", () => {
    assert.equal(normalizarEstado("en stock"), "EN STOCK");
    assert.equal(normalizarEstado("pendiente"), "EN STOCK");
    assert.equal(normalizarEstado("En camino"), "EN ENVÍO");
    assert.equal(normalizarEstado("ENTREGADO"), "ENTREGADO");
    assert.equal(normalizarEstado("fallido"), null);
    assert.equal(normalizarEstado("duplicado?"), null);
});

test("analizar clasifica clientes, pedidos e historial", () => {
    const plan = analizar({
        clientes: [
            { cliente_id: "C1", nombre_completo: "Cliente Uno", telefono: "11", email: "a@b.com", tipo_cliente: "mayorista", direccion_fiscal: "Calle 1" },
            { cliente_id: "C1", nombre_completo: "Repetido", telefono: "", email: "", tipo_cliente: "", direccion_fiscal: "" },
            { cliente_id: "C3", nombre_completo: "", telefono: "", email: "", tipo_cliente: "", direccion_fiscal: "" },
        ],
        pedidos: [
            { pedido_id: "P1", calle: "Rivadavia", numero: "123", localidad: "CABA", provincia: "CABA", codigo_postal: "1000", cliente_id: "C1", estado: "En Stock", notas_operador: "tocar timbre" },
            { pedido_id: "P2", calle: "Belgrano", numero: "S/N", localidad: "Quilmes", provincia: "Buenos Aires", codigo_postal: "1878", cliente_id: "C3", estado: "estado raro", notas_operador: "" },
        ],
        historial: [
            { intento_id: "H1", pedido_id: "P1", direccion_enviada_a_api: "Rivadavia 123 CABA", resultado_api: "OK", latitud: "-34,6", longitud: "-58,4", confianza_score: "0.9", operador_que_reviso: "ana" },
        ],
    });

    assert.deepEqual(plan.resumen.clientes, { aceptadas: 1, revision: 1, rechazadas: 1 });
    assert.deepEqual(plan.resumen.pedidos, { aceptadas: 1, revision: 1, rechazadas: 0 });
    assert.deepEqual(plan.resumen.historial, { aceptadas: 1, revision: 0, rechazadas: 0 });
    assert.equal(plan.clientes.aceptadas[0].tipo, "mayorista");
    assert.equal(plan.pedidos.revision[0].motivo.includes("Altura"), false);
    assert.equal(plan.pedidos.revision[0].motivo.includes("Estado"), true);
});

test("un pedido con altura dudosa entra igual como borrador y conserva el texto original", () => {
    const plan = analizar({
        clientes: [{ cliente_id: "C1", nombre_completo: "Cliente", telefono: "", email: "", tipo_cliente: "", direccion_fiscal: "" }],
        pedidos: [{ pedido_id: "P1", calle: "San Martín", numero: "mil doscientos", localidad: "CABA", provincia: "CABA", codigo_postal: "", cliente_id: "C1", estado: "pendiente", notas_operador: "" }],
    });
    assert.equal(plan.resumen.pedidos.aceptadas, 1);
    assert.equal(plan.pedidos.aceptadas[0].estado, "EN STOCK");
    assert.equal(plan.pedidos.aceptadas[0].direccion.altura, "mil doscientos");
});

test("aplicar inserta una vez y no duplica en la segunda ejecución", async () => {
    const db = crearFakeDb();
    const plan = analizar({
        clientes: [{ cliente_id: "C1", nombre_completo: "Cliente", telefono: "", email: "", tipo_cliente: "", direccion_fiscal: "" }],
        pedidos: [{ pedido_id: "P1", calle: "Rivadavia", numero: "123", localidad: "CABA", provincia: "CABA", codigo_postal: "1000", cliente_id: "C1", estado: "En Stock", notas_operador: "" }],
        historial: [{ intento_id: "H1", pedido_id: "P1", direccion_enviada_a_api: "Rivadavia 123", resultado_api: "OK", latitud: "1", longitud: "2" }],
    });

    const primero = await aplicar(db, plan);
    assert.equal(primero.clientes.insertados, 1);
    assert.equal(primero.pedidos.insertados, 1);
    assert.equal(primero.direcciones.insertados, 1);
    assert.equal(primero.historial.insertados, 1);

    const segundo = await aplicar(db, plan);
    assert.equal(segundo.clientes.insertados, 0);
    assert.equal(segundo.clientes.existentes, 1);
    assert.equal(segundo.pedidos.insertados, 0);
    assert.equal(segundo.pedidos.existentes, 1);
    assert.equal(segundo.historial.insertados, 0);
    assert.equal(segundo.historial.existentes, 1);
    assert.equal(db.estado.clientes.length, 1);
    assert.equal(db.estado.pedidos.length, 1);
    assert.equal(db.estado.direcciones.length, 1);
    assert.equal(db.estado.historial.length, 1);
});
