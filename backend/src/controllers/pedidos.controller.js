const { z } = require("zod");
const { validar } = require("../lib/validar");
const { servicioNoDisponible } = require("../lib/errors");
const { ESTADOS_VALIDOS } = require("../constants/estados");
const { CANALES_VALIDOS } = require("../constants/canales");

const ESTADOS_VALIDACION = ["PENDIENTE", "CON_ADVERTENCIAS", "VALIDA", "CONFIRMADA"];

const textoOpcional = (max) => z.string().trim().max(max).optional().nullable();

const esquemaDireccion = z.object({
    calle: z.string().trim().min(1, "La calle es obligatoria.").max(150),
    altura: textoOpcional(20),
    piso_depto: textoOpcional(30),
    entre_calles: textoOpcional(150),
    localidad: textoOpcional(100),
    provincia: textoOpcional(100),
    codigo_postal: textoOpcional(10),
});

const esquemaCrear = z.object({
    importe_base: z.string().optional().nullable(),
    cliente_id: z.coerce.number().int().positive("Elegí un cliente."),
    canal_origen: z.enum(CANALES_VALIDOS, {
        errorMap: () => ({ message: "Elegí un canal de origen válido." }),
    }).optional().nullable(),
    observaciones: z.string().trim().max(2000).optional().nullable(),
    // Sin esta confirmación explícita, un pedido con posible duplicado no se crea.
    confirmar_duplicado: z.boolean().optional().default(false),
    direccion: esquemaDireccion,
});

const esquemaId = z.object({ id: z.coerce.number().int().positive() });
const esquemaGeocodificar = z.object({ indice_candidato: z.coerce.number().int().nonnegative().optional() }).optional();

// Las fechas del listado son días completos (AAAA-MM-DD). Se valida que exista
// la fecha del calendario para no aceptar, por ejemplo, 2026-02-30.
function esFechaCalendario(texto) {
    const [anio, mes, dia] = texto.split("-").map(Number);
    const fecha = new Date(Date.UTC(anio, mes - 1, dia));
    return fecha.getUTCFullYear() === anio
        && fecha.getUTCMonth() === mes - 1
        && fecha.getUTCDate() === dia;
}

const fechaDia = z.string().trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Usá el formato AAAA-MM-DD.")
    .refine(esFechaCalendario, "La fecha no es válida.");

const esquemaListar = z.object({
    estado: z.enum(ESTADOS_VALIDOS).optional(),
    estado_validacion: z.enum(ESTADOS_VALIDACION).optional(),
    cliente: z.string().trim().max(150).optional(),
    fecha_desde: fechaDia.optional(),
    fecha_hasta: fechaDia.optional(),
}).refine(
    (datos) => !datos.fecha_desde || !datos.fecha_hasta || datos.fecha_desde <= datos.fecha_hasta,
    { message: "La fecha hasta no puede ser anterior a la fecha desde.", path: ["fecha_hasta"] }
);

function createPedidosController({ pedidoService, geocodeService, sugerenciaImporteService }) {
    return {
        async listar(req, res) {
            if (!pedidoService) throw servicioNoDisponible();
            const filtros = validar(esquemaListar, req.query ?? {});
            const pedidos = await pedidoService.listar({
                estado: filtros.estado,
                estadoValidacion: filtros.estado_validacion,
                cliente: filtros.cliente,
                fechaDesde: filtros.fecha_desde,
                fechaHasta: filtros.fecha_hasta,
            });
            res.json({ pedidos });
        },

        async obtener(req, res) {
            if (!pedidoService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            res.json({ pedido: await pedidoService.obtener(id) });
        },

        async sugerirImporte(req, res) {
            if (!sugerenciaImporteService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            res.json(await sugerenciaImporteService.sugerir(id));
        },

        async crear(req, res) {
            if (!pedidoService) throw servicioNoDisponible();
            const datos = validar(esquemaCrear, req.body ?? {});
            const resultado = await pedidoService.crear(datos, req.usuario?.id);
            res.status(201).json(resultado);
        },

        async completarImporte(req, res) {
            if (!pedidoService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            const { importe_base } = validar(z.object({ importe_base: z.string() }).strict(), req.body);
            res.json({ pedido: await pedidoService.completarImporte(id, importe_base, req.usuario.id) });
        },

        async actualizarDireccion(req, res) {
            if (!pedidoService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            const direccion = validar(esquemaDireccion, req.body ?? {});
            res.json(await pedidoService.actualizarDireccion(id, direccion));
        },

        async geocodificar(req, res) {
            if (!geocodeService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            const datos = validar(esquemaGeocodificar, req.body ?? {}) || {};
            res.json(await geocodeService.geocodificar(id, req.usuario?.id, datos.indice_candidato ?? null));
        },

        async rechazarUbicacion(req, res) {
            if (!geocodeService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            res.json({ pedido: await geocodeService.rechazar(id, req.usuario?.id) });
        },

        async confirmarDireccion(req, res) {
            if (!geocodeService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            res.json({ pedido: await geocodeService.confirmar(id, req.usuario?.id) });
        },
    };
}

module.exports = { createPedidosController };
