const { noEncontrado, errorValidacion, conflictoDuplicado, servicioNoDisponible } = require("../lib/errors");
const { ESTADO_INICIAL } = require("../constants/estados");
const { CANAL_PREDETERMINADO } = require("../constants/canales");
const { normalizarDireccion: normalizarCamposDireccion } = require("./NormalizadorDireccion");
const { validarDireccion, normalizarTexto } = require("./ValidadorDireccion");
const { normalizarProvincia } = require("../constants/provincias");

const VENTANA_DUPLICADOS_HORAS = 24;
const { normalizarImporte } = require('../lib/importes');

const MENSAJES_LOCALIDAD = Object.freeze({
    LOCALIDAD_NO_ENCONTRADA: "La localidad no figura en el listado oficial de esa provincia. Revisá la escritura o la provincia.",
    LOCALIDAD_NO_VERIFICADA: "No se pudo verificar la localidad con el servicio oficial. Revisala manualmente antes de confirmar la dirección.",
});

// Chequeo informativo contra Georef: nunca genera ERROR ni cambia el estado de
// validación, porque el proveedor puede no cubrir barrios o localidades chicas.
async function advertenciasLocalidad(localidades, direccion) {
    if (!localidades) return [];
    const provincia = normalizarProvincia(direccion.provincia);
    const localidad = String(direccion.localidad == null ? "" : direccion.localidad).trim();
    if (!provincia || !localidad) return [];

    const resultado = await localidades.verificar({ provincia, localidad });
    if (resultado === "EXISTE") return [];

    const codigo = resultado === "NO_EXISTE" ? "LOCALIDAD_NO_ENCONTRADA" : "LOCALIDAD_NO_VERIFICADA";
    return [{ codigo, campo: "localidad", mensaje: MENSAJES_LOCALIDAD[codigo], gravedad: "ADVERTENCIA" }];
}

// Compone la dirección original legible a partir de los campos estructurados.
// No inventa datos: solo une lo que el operador cargó.
function componerDireccionOriginal(direccion = {}) {
    return [direccion.calle, direccion.altura, direccion.piso_depto, direccion.localidad, direccion.provincia]
        .map((parte) => (parte === undefined || parte === null ? "" : String(parte).trim()))
        .filter(Boolean)
        .join(" ");
}

const CAMPOS_DIRECCION = ["calle", "altura", "piso_depto", "entre_calles", "localidad", "provincia", "codigo_postal"];

// ¿El cambio toca algún campo que hace a la ubicación? Si es así, se invalida la
// confirmación previa (D09/D10). Los campos ausentes o idénticos no cuentan.
function cambioRelevante(actual, nuevo) {
    return CAMPOS_DIRECCION.some((campo) => {
        const valorNuevo = nuevo[campo];
        if (valorNuevo === undefined) return false;
        const normalizado = valorNuevo === null ? null : String(valorNuevo).trim();
        const actualNormalizado = actual[campo] === undefined || actual[campo] === null ? null : String(actual[campo]).trim();
        return normalizado !== actualNormalizado;
    });
}

// La dirección original se compone con el texto crudo del operario, antes de
// normalizar los campos estructurados: así conserva lo que realmente escribió.
function prepararDireccion(direccion) {
    const datos = direccion || {};
    const direccionOriginal = datos.direccion_original || componerDireccionOriginal(datos) || null;
    const normalizada = normalizarCamposDireccion(datos);

    return {
        calle: normalizada.calle ?? null,
        altura: normalizada.altura ?? null,
        piso_depto: normalizada.piso_depto ?? null,
        entre_calles: normalizada.entre_calles ?? null,
        localidad: normalizada.localidad ?? null,
        provincia: normalizada.provincia ?? null,
        codigo_postal: normalizada.codigo_postal ?? null,
        direccion_original: direccionOriginal,
    };
}

// Clave de comparación para el aviso de duplicados. Usa el normalizador de
// direcciones y además quita tildes, mayúsculas y puntuación para que dos formas
// de escribir la misma dirección coincidan.
function claveDireccion(direccion = {}) {
    const normalizada = normalizarCamposDireccion(direccion);
    return {
        calle: normalizarTexto(normalizada.calle),
        altura: normalizarTexto(normalizada.altura),
        // CABA y Capital Federal son la misma localidad para comparar.
        localidad: normalizarTexto(normalizarProvincia(normalizada.localidad) || normalizada.localidad),
        provincia: normalizarTexto(normalizarProvincia(normalizada.provincia) || normalizada.provincia),
    };
}

function tokensDeCalle(valor) {
    return normalizarTexto(valor).split(" ").filter(Boolean);
}

// Una inicial ("H.") equivale a la palabra completa que empieza con esa letra
// ("Hipólito"). Así "Av. H. Yrigoyen" y "Avenida Hipólito Yrigoyen" se reconocen
// como la misma calle. El aviso siempre queda sujeto a confirmación humana.
function tokensDeCalleEquivalentes(izquierda, derecha) {
    if (izquierda.length !== derecha.length) return false;
    return izquierda.every((token, indice) => {
        const otro = derecha[indice];
        if (token.length !== 1 && otro.length !== 1) return token === otro;
        const inicial = token.length === 1 ? token : otro;
        const palabraCompleta = token.length === 1 ? otro : token;
        return palabraCompleta.startsWith(inicial);
    });
}

// La altura es imprescindible para considerar que hay una dirección repetida.
// Si localidad o provincia están cargadas en ambos pedidos, también deben coincidir.
// El piso/departamento no se compara: dos envíos al mismo edificio siguen siendo
// candidatos a duplicado y el operador decide.
function direccionEquivalente(izquierda, derecha) {
    if (!izquierda.calle || !derecha.calle) return false;
    if (!izquierda.altura || !derecha.altura) return false;
    if (izquierda.altura !== derecha.altura) return false;
    if (!tokensDeCalleEquivalentes(tokensDeCalle(izquierda.calle), tokensDeCalle(derecha.calle))) return false;
    if (izquierda.localidad && derecha.localidad && izquierda.localidad !== derecha.localidad) return false;
    if (izquierda.provincia && derecha.provincia && izquierda.provincia !== derecha.provincia) return false;
    return true;
}

function resumirDuplicado(fila) {
    return {
        id: fila.id,
        codigo: fila.codigo ?? null,
        estado: fila.estado,
        created_at: fila.created_at,
        direccion_original: fila.direccion_original ?? null,
    };
}

// Carga manual y revisión de pedidos. El despacho seguro se apoya en direcciones
// cuya confirmación es siempre humana; acá nunca se marca una dirección CONFIRMADA.
function createPedidoService({
    pedidos,
    clientes,
    localidades,
    geocodeAdapter,
    ventanaDuplicadosHoras = VENTANA_DUPLICADOS_HORAS,
}) {
    const ventanaHoras = Number.isInteger(ventanaDuplicadosHoras) && ventanaDuplicadosHoras > 0
        ? ventanaDuplicadosHoras
        : VENTANA_DUPLICADOS_HORAS;

    async function buscarDuplicados(clienteId, direccion) {
        const candidatos = await pedidos.buscarCandidatosDuplicados({ clienteId, ventanaHoras });
        const clave = claveDireccion(direccion);
        return candidatos
            .filter((candidato) => direccionEquivalente(clave, claveDireccion(candidato)))
            .map(resumirDuplicado);
    }

    return {
        async listar(filtros = {}) {
            return pedidos.listar(filtros);
        },

        async obtener(pedidoId) {
            const detalle = await pedidos.obtenerDetalle(pedidoId);
            if (!detalle) throw noEncontrado("El pedido no existe.");
            // Los problemas se calculan al leer sobre la dirección ya guardada:
            // no se persisten y no alteran el estado_validacion almacenado.
            const problemas = detalle.direccion_id ? validarDireccion(detalle).problemas : [];
            return { ...detalle, problemas };
        },

        async crear({ cliente_id, canal_origen, observaciones, direccion, confirmar_duplicado, importe_base }, usuarioId) {
            const importeVacio = importe_base == null
                || (typeof importe_base === "string" && importe_base.trim() === "");
            const importeBase = importeVacio ? null : normalizarImporte(importe_base);
            const cliente = await clientes.buscarPorId(cliente_id);
            if (!cliente) throw errorValidacion({ cliente_id: "El cliente indicado no existe." });

            const preparada = prepararDireccion(direccion);
            const { estado, problemas } = validarDireccion(preparada);
            // Conservar los avisos específicos aunque el alta se rechace antes de guardar.
            const camposDireccion = Object.fromEntries(problemas.map(p => [p.campo, p.mensaje]));
            const ubicacionNoVerificada = () => {
                const error = servicioNoDisponible('No pudimos verificar la ubicación. No se guardó el pedido; reintentá en unos instantes.');
                error.campos = { ...camposDireccion, direccion: error.mensaje };
                return error;
            };
            const errores = problemas.filter(p => p.gravedad === 'ERROR');
            if (errores.length) throw errorValidacion(camposDireccion);
            const problemasLocalidad = await advertenciasLocalidad(localidades, preparada);
            if (problemasLocalidad.some(p => p.codigo === 'LOCALIDAD_NO_ENCONTRADA')) {
                throw errorValidacion({ ...camposDireccion, localidad: 'La localidad no existe en la provincia indicada. Corregila antes de guardar.' });
            }
            if (problemasLocalidad.length || !geocodeAdapter) throw ubicacionNoVerificada();
            let ubicacion;
            try { ubicacion = await geocodeAdapter.geocodificar(preparada); }
            catch { throw ubicacionNoVerificada(); }
            if (ubicacion?.resultado === 'ZERO_RESULTS') throw errorValidacion({ ...camposDireccion, direccion: 'No encontramos esa ubicación. Revisá calle, altura, localidad y provincia antes de guardar.' });
            const candidatos = Array.isArray(ubicacion?.candidatos) ? ubicacion.candidatos : [ubicacion];
            const tienePunto = candidatos.some(c => {
                if (c?.latitud == null || c?.longitud == null || String(c.latitud).trim() === '' || String(c.longitud).trim() === '') return false;
                const latitud = Number(c.latitud), longitud = Number(c.longitud);
                return Number.isFinite(latitud) && Number.isFinite(longitud) && Math.abs(latitud) <= 90 && Math.abs(longitud) <= 180;
            });
            if (!['OK', 'APPROXIMATE'].includes(ubicacion?.resultado) || !tienePunto) throw ubicacionNoVerificada();
            const direccionValidada = { ...preparada, estado_validacion: estado };

            const posiblesDuplicados = await buscarDuplicados(cliente_id, preparada);
            if (posiblesDuplicados.length && confirmar_duplicado !== true) {
                throw conflictoDuplicado(
                    "Ya existe un pedido de este cliente con la misma dirección en la ventana configurada. Revisá el pedido existente y confirmá si querés crear otro.",
                    posiblesDuplicados
                );
            }

            const pedidoId = await pedidos.crear({
                importeBase,
                codigo: null,
                clienteId: cliente_id,
                canalOrigen: canal_origen || CANAL_PREDETERMINADO,
                estado: ESTADO_INICIAL,
                observaciones: observaciones ?? null,
                creadoPor: usuarioId ?? null,
                direccion: direccionValidada,
            });

            return {
                pedido: await pedidos.obtenerDetalle(pedidoId),
                posiblesDuplicados,
                problemas: [...problemas, ...problemasLocalidad],
            };
        },

        async completarImporte(pedidoId, importe, usuarioId) {
            await pedidos.completarImporte(pedidoId, normalizarImporte(importe), usuarioId);
            return pedidos.obtenerDetalle(pedidoId);
        },

        async actualizarDireccion(pedidoId, direccion) {
            const detalle = await pedidos.obtenerDetalle(pedidoId);
            if (!detalle) throw noEncontrado("El pedido no existe.");
            if (!detalle.direccion_id) throw noEncontrado("El pedido no tiene dirección registrada.");

            const preparada = prepararDireccion(direccion);
            const { estado, problemas } = validarDireccion(preparada);
            const problemasLocalidad = await advertenciasLocalidad(localidades, preparada);
            const cambio = cambioRelevante(normalizarCamposDireccion(detalle), preparada);

            const invalidar = detalle.estado_validacion === "CONFIRMADA" && cambio;
            // Si cambia la dirección, las coordenadas pertenecen a la versión anterior
            // y no sirven para confirmar la ubicación nueva, aunque no estuviera confirmada.
            const descartarCoordenadas = cambio;
            const estadoFinal = detalle.estado_validacion === "CONFIRMADA" && !invalidar
                ? "CONFIRMADA"
                : estado;

            await pedidos.actualizarDireccion(
                pedidoId,
                { ...preparada, estado_validacion: estadoFinal },
                { invalidar, descartarCoordenadas }
            );

            return {
                pedido: await pedidos.obtenerDetalle(pedidoId),
                invalidada: invalidar,
                problemas: [...problemas, ...problemasLocalidad],
            };
        },
    };
}

module.exports = {
    createPedidoService,
    componerDireccionOriginal,
    cambioRelevante,
    claveDireccion,
    direccionEquivalente,
};
