// Importación histórica del Excel (MVP1). Separa análisis (puro y testeable) de
// aplicación en base. Conserva códigos y textos de origen, no inventa DNI, no une
// pedidos por parecido y nunca convierte un intento histórico en confirmación humana.
const { ESTADOS } = require("../constants/estados");

const HOJAS = {
    clientes: "Clientes",
    pedidos: "Pedidos",
    historial: "Historial_Geo",
};

function limpiar(valor) {
    if (valor === undefined || valor === null) return "";
    return String(valor).trim();
}

function normalizarTexto(valor) {
    return limpiar(valor)
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ");
}

// Clave canónica para comparar códigos: el collation de MySQL es case-insensitive,
// así que "CLI-01" y "cli-01" chocan en UNIQUE aunque en JS sean distintos.
function normalizarCodigo(valor) {
    return limpiar(valor).toUpperCase();
}

function normalizarEstado(valor) {
    const texto = normalizarTexto(valor);
    if (!texto) return null;
    if (texto.includes("stock")) return ESTADOS.EN_STOCK;
    if (texto.includes("pendiente")) return ESTADOS.EN_STOCK;
    if (texto.includes("preparacion")) return ESTADOS.EN_PREPARACION;
    if (texto.includes("envio") || texto.includes("camino") || texto.includes("ruta")) return ESTADOS.EN_ENVIO;
    if (texto.includes("entregado")) return ESTADOS.ENTREGADO;
    if (texto.includes("pagado") || texto.includes("cobrado")) return ESTADOS.PAGADO;
    return null;
}

function normalizarResultado(valor) {
    const texto = normalizarTexto(valor);
    if (["ok", "success", "exito", "exacta"].includes(texto)) return "OK";
    if (texto.includes("zero") || texto.includes("sin resultado")) return "ZERO_RESULTS";
    if (texto.includes("approx") || texto.includes("aproxim")) return "APPROXIMATE";
    return "ERROR";
}

function alturaValida(altura) {
    const texto = limpiar(altura);
    if (!texto) return false;
    if (/^(0+|s\/?n|sin\s*numero|sn)$/i.test(texto)) return false;
    return /\d/.test(texto);
}

function aNumero(valor) {
    const texto = limpiar(valor).replace(",", ".");
    if (!texto) return null;
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : null;
}

function resumen(grupo) {
    return {
        aceptadas: grupo.aceptadas.length,
        revision: grupo.revision.length,
        rechazadas: grupo.rechazadas.length,
    };
}

// Análisis sin escribir nada: clasifica cada fila en aceptada, revisión o rechazada.
function analizar(hojas = {}) {
    const plan = {
        clientes: { aceptadas: [], revision: [], rechazadas: [] },
        pedidos: { aceptadas: [], revision: [], rechazadas: [] },
        historial: { aceptadas: [], revision: [], rechazadas: [] },
    };
    const codigosClientes = new Set();
    const codigosPedidos = new Set();
    const numeroFilaDe = (indice) => indice + 2; // +1 encabezado, +1 base 1

    (hojas.clientes || []).forEach((fila, indice) => {
        const filaExcel = numeroFilaDe(indice);
        const codigo = limpiar(fila.cliente_id);
        const nombre = limpiar(fila.nombre_completo);
        if (!codigo || !nombre) {
            plan.clientes.rechazadas.push({ codigo, fila: filaExcel, motivo: "Falta cliente_id o nombre." });
            return;
        }
        const claveCliente = normalizarCodigo(codigo);
        if (codigosClientes.has(claveCliente)) {
            plan.clientes.revision.push({ codigo, fila: filaExcel, motivo: "Código repetido (posible cliente duplicado)." });
            return;
        }
        codigosClientes.add(claveCliente);
        plan.clientes.aceptadas.push({
            codigo_origen: codigo,
            nombre,
            telefono: limpiar(fila.telefono) || null,
            email: limpiar(fila.email) || null,
            tipo: limpiar(fila.tipo_cliente) || "particular",
            domicilio: limpiar(fila.direccion_fiscal) || null,
        });
    });

    const clientesAceptados = new Set(plan.clientes.aceptadas.map((c) => normalizarCodigo(c.codigo_origen)));

    (hojas.pedidos || []).forEach((fila, indice) => {
        const filaExcel = numeroFilaDe(indice);
        const codigo = limpiar(fila.pedido_id);
        if (!codigo) {
            plan.pedidos.rechazadas.push({ codigo, fila: filaExcel, motivo: "Falta pedido_id." });
            return;
        }
        if (codigosPedidos.has(normalizarCodigo(codigo))) {
            plan.pedidos.revision.push({ codigo, fila: filaExcel, motivo: "pedido_id duplicado en el origen." });
            return;
        }
        codigosPedidos.add(normalizarCodigo(codigo));

        const clienteCodigo = limpiar(fila.cliente_id);
        const estado = normalizarEstado(fila.estado);
        const calle = limpiar(fila.calle);
        const altura = limpiar(fila.numero);
        const direccionOriginal = [calle, altura, limpiar(fila.localidad), limpiar(fila.provincia)].filter(Boolean).join(" ");

        const motivos = [];
        if (!clienteCodigo) motivos.push("Sin cliente_id.");
        else if (!clientesAceptados.has(normalizarCodigo(clienteCodigo))) motivos.push("cliente_id no presente en Clientes.");
        if (!calle) motivos.push("Sin calle.");
        if (!estado) motivos.push("Estado desconocido.");

        const item = {
            codigo,
            clienteCodigoOrigen: clienteCodigo,
            estado,
            observaciones: limpiar(fila.notas_operador) || null,
            direccion: {
                calle,
                altura,
                piso_depto: limpiar(fila.piso_depto) || null,
                localidad: limpiar(fila.localidad) || null,
                provincia: limpiar(fila.provincia) || null,
                codigo_postal: limpiar(fila.codigo_postal) || null,
                direccion_original: direccionOriginal || limpiar(fila.calle) || null,
            },
        };

        if (motivos.length) plan.pedidos.revision.push({ codigo, fila: filaExcel, motivo: motivos.join(" ") });
        else plan.pedidos.aceptadas.push(item);
    });

    (hojas.historial || []).forEach((fila, indice) => {
        const filaExcel = numeroFilaDe(indice);
        const pedidoCodigo = limpiar(fila.pedido_id);
        const direccionEnviada = limpiar(fila.direccion_enviada_a_api);
        if (!pedidoCodigo || !direccionEnviada) {
            plan.historial.rechazadas.push({ fila: filaExcel, motivo: "Falta pedido_id o dirección enviada." });
            return;
        }
        plan.historial.aceptadas.push({
            pedidoCodigo,
            direccion_enviada: direccionEnviada,
            resultado: normalizarResultado(fila.resultado_api),
            latitud: aNumero(fila.latitud),
            longitud: aNumero(fila.longitud),
        });
    });

    plan.resumen = {
        clientes: resumen(plan.clientes),
        pedidos: resumen(plan.pedidos),
        historial: resumen(plan.historial),
    };
    return plan;
}

// Aplica el plan en una transacción. Idempotente: usa codigo_origen/codigo estables
// y no pisa registros existentes ni sobrescribe datos ya presentes.
async function aplicar(db, plan) {
    const conexion = await db.getConnection();
    const resultado = { clientes: { insertados: 0, existentes: 0 }, pedidos: { insertados: 0, existentes: 0, sinCliente: 0 }, direcciones: { insertados: 0 }, historial: { insertados: 0, existentes: 0, sinPedido: 0 } };
    try {
        await conexion.beginTransaction();

        const [clientesExistentes] = await conexion.query("SELECT id, codigo_origen FROM clientes WHERE codigo_origen IS NOT NULL");
        const idClientePorCodigo = new Map(clientesExistentes.map((fila) => [normalizarCodigo(fila.codigo_origen), fila.id]));

        for (const cliente of plan.clientes.aceptadas) {
            if (idClientePorCodigo.has(normalizarCodigo(cliente.codigo_origen))) {
                resultado.clientes.existentes += 1;
                continue;
            }
            const [insercion] = await conexion.query(
                "INSERT INTO clientes (codigo_origen, nombre, telefono, email, tipo, domicilio) VALUES (?, ?, ?, ?, ?, ?)",
                [cliente.codigo_origen, cliente.nombre, cliente.telefono, cliente.email, cliente.tipo, cliente.domicilio]
            );
            idClientePorCodigo.set(normalizarCodigo(cliente.codigo_origen), insercion.insertId);
            resultado.clientes.insertados += 1;
        }

        const [pedidosExistentes] = await conexion.query("SELECT id, codigo FROM pedidos WHERE codigo IS NOT NULL");
        const idPedidoPorCodigo = new Map(pedidosExistentes.map((fila) => [normalizarCodigo(fila.codigo), fila.id]));

        for (const pedido of plan.pedidos.aceptadas) {
            if (idPedidoPorCodigo.has(normalizarCodigo(pedido.codigo))) {
                resultado.pedidos.existentes += 1;
                continue;
            }
            const clienteId = idClientePorCodigo.get(normalizarCodigo(pedido.clienteCodigoOrigen)) || null;
            if (!clienteId) {
                resultado.pedidos.sinCliente += 1; // cliente no importado: no se fuerza una relación dudosa
                continue;
            }
            const [insercionPedido] = await conexion.query(
                "INSERT INTO pedidos (codigo, cliente_id, estado, direccion_validada, observaciones) VALUES (?, ?, ?, 0, ?)",
                [pedido.codigo, clienteId, pedido.estado, pedido.observaciones]
            );
            idPedidoPorCodigo.set(normalizarCodigo(pedido.codigo), insercionPedido.insertId);
            resultado.pedidos.insertados += 1;

            const direccion = pedido.direccion;
            await conexion.query(
                `INSERT INTO direcciones (pedido_id, direccion_original, calle, altura, piso_depto, localidad, provincia, codigo_postal, estado_validacion)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDIENTE')`,
                [insercionPedido.insertId, direccion.direccion_original, direccion.calle, direccion.altura, direccion.piso_depto, direccion.localidad, direccion.provincia, direccion.codigo_postal]
            );
            resultado.direcciones.insertados += 1;
        }

        const [direccionesPorPedido] = await conexion.query("SELECT id, pedido_id FROM direcciones");
        const idDireccionPorPedido = new Map(direccionesPorPedido.map((fila) => [fila.pedido_id, fila.id]));

        for (const intento of plan.historial.aceptadas) {
            const pedidoId = idPedidoPorCodigo.get(normalizarCodigo(intento.pedidoCodigo));
            const direccionId = pedidoId ? idDireccionPorPedido.get(pedidoId) : null;
            if (!direccionId) {
                resultado.historial.sinPedido += 1;
                continue;
            }
            const [yaExiste] = await conexion.query(
                "SELECT id FROM historial_geolocalizacion WHERE direccion_id = ? AND direccion_enviada = ? AND resultado = ? AND latitud <=> ? AND longitud <=> ? LIMIT 1",
                [direccionId, intento.direccion_enviada, intento.resultado, intento.latitud, intento.longitud]
            );
            if (yaExiste.length) {
                resultado.historial.existentes += 1;
                continue;
            }
            await conexion.query(
                `INSERT INTO historial_geolocalizacion (direccion_id, direccion_enviada, resultado, latitud, longitud, nivel_confianza, accion_operador)
                 VALUES (?, ?, ?, ?, ?, NULL, NULL)`,
                [direccionId, intento.direccion_enviada, intento.resultado, intento.latitud, intento.longitud]
            );
            resultado.historial.insertados += 1;
        }

        await conexion.commit();
        return resultado;
    } catch (error) {
        await conexion.rollback();
        throw error;
    } finally {
        conexion.release();
    }
}

module.exports = { analizar, aplicar, normalizarEstado, normalizarResultado, alturaValida, HOJAS };
