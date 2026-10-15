const { z } = require("zod");
const { validar } = require("../lib/validar");
const { servicioNoDisponible } = require("../lib/errors");

const esquemaListar = z.object({ busqueda: z.string().trim().max(100).optional() });

function createClientesController({ clienteService }) {
    return {
        async listar(req, res) {
            if (!clienteService) throw servicioNoDisponible();
            const filtros = validar(esquemaListar, req.query ?? {});
            res.json({ clientes: await clienteService.listar(filtros) });
        },
    };
}

module.exports = { createClientesController };
