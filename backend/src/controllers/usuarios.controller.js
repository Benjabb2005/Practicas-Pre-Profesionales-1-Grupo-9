const { z } = require("zod");
const { validar } = require("../lib/validar");
const { servicioNoDisponible } = require("../lib/errors");
const { ROLES_VALIDOS } = require("../constants/roles");

const esquemaCrear = z.object({
    nombre: z.string().trim().min(2, "El nombre es obligatorio.").max(100),
    email: z.string().trim().toLowerCase().email("Ingresá un email válido.").max(150),
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(128),
    rol: z.enum(ROLES_VALIDOS),
});

const esquemaActualizar = z
    .object({
        nombre: z.string().trim().min(2, "El nombre es obligatorio.").max(100).optional(),
        email: z.string().trim().toLowerCase().email("Ingresá un email válido.").max(150).optional(),
        password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres.").max(128).optional(),
        rol: z.enum(ROLES_VALIDOS).optional(),
        activo: z.boolean().optional(),
    })
    .refine((datos) => Object.keys(datos).length > 0, { message: "No enviaste ningún cambio." });

const esquemaId = z.object({ id: z.coerce.number().int().positive() });

function createUsuariosController({ usuarioService }) {
    return {
        async listar(req, res) {
            if (!usuarioService) throw servicioNoDisponible();
            res.json({ usuarios: await usuarioService.listar() });
        },

        async crear(req, res) {
            if (!usuarioService) throw servicioNoDisponible();
            const datos = validar(esquemaCrear, req.body ?? {});
            const usuario = await usuarioService.crear(datos);
            res.status(201).json({ usuario });
        },

        async actualizar(req, res) {
            if (!usuarioService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            const datos = validar(esquemaActualizar, req.body ?? {});
            const usuario = await usuarioService.actualizar(id, datos);
            res.json({ usuario });
        },
    };
}

module.exports = { createUsuariosController };
