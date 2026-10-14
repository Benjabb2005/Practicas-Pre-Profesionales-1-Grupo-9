const { z } = require("zod");
const { validar } = require("../lib/validar");
const { servicioNoDisponible } = require("../lib/errors");

const esquemaLogin = z.object({
    email: z.string().trim().toLowerCase().email("Ingresá un email válido."),
    password: z.string().min(1, "Ingresá la contraseña.").max(128),
});

function createAuthController({ authService }) {
    return {
        async login(req, res) {
            if (!authService) throw servicioNoDisponible();
            const datos = validar(esquemaLogin, req.body ?? {});
            const resultado = await authService.login(datos);
            res.json(resultado);
        },

        async me(req, res) {
            if (!authService) throw servicioNoDisponible();
            const usuario = await authService.me(req.usuario.id);
            res.json({ usuario });
        },
    };
}

module.exports = { createAuthController };
