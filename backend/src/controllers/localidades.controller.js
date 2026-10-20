const { z } = require("zod");
const { validar } = require("../lib/validar");
const { servicioNoDisponible } = require("../lib/errors");

const esquemaLocalidades = z.object({
    provincia: z.string().trim().min(1, "La provincia es obligatoria.").max(100),
    nombre: z.string().trim().min(2, "Escribí al menos dos caracteres.").max(100),
});

function createLocalidadesController({ localidadService }) {
    return {
        async listar(req, res) {
            if (!localidadService) throw servicioNoDisponible();
            const filtros = validar(esquemaLocalidades, req.query ?? {});
            const localidades = await localidadService.sugerir(filtros);
            res.json({ localidades });
        },
    };
}

module.exports = { createLocalidadesController };
