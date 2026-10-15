const { z } = require("zod");
const { validar } = require("../lib/validar");
const { servicioNoDisponible } = require("../lib/errors");
const { ESTADOS_VALIDOS } = require("../constants/estados");

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
    cliente_id: z.coerce.number().int().positive("Elegí un cliente."),
    canal_origen: textoOpcional(30),
    observaciones: z.string().trim().max(2000).optional().nullable(),
    direccion: esquemaDireccion,
});

const esquemaId = z.object({ id: z.coerce.number().int().positive() });

const esquemaListar = z.object({
    estado: z.enum(ESTADOS_VALIDOS).optional(),
    estado_validacion: z.enum(ESTADOS_VALIDACION).optional(),
});

function createPedidosController({ pedidoService, geocodeService }) {
    return {
        async listar(req, res) {
            if (!pedidoService) throw servicioNoDisponible();
            const filtros = validar(esquemaListar, req.query ?? {});
            const pedidos = await pedidoService.listar({
                estado: filtros.estado,
                estadoValidacion: filtros.estado_validacion,
            });
            res.json({ pedidos });
        },

        async obtener(req, res) {
            if (!pedidoService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            res.json({ pedido: await pedidoService.obtener(id) });
        },

        async crear(req, res) {
            if (!pedidoService) throw servicioNoDisponible();
            const datos = validar(esquemaCrear, req.body ?? {});
            const resultado = await pedidoService.crear(datos, req.usuario?.id);
            res.status(201).json(resultado);
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
            res.json(await geocodeService.geocodificar(id, req.usuario?.id));
        },

        async confirmarDireccion(req, res) {
            if (!geocodeService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            res.json({ pedido: await geocodeService.confirmar(id, req.usuario?.id) });
        },
    };
}

module.exports = { createPedidosController };
