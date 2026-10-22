const { z } = require("zod");
const { validar } = require("../lib/validar");
const { servicioNoDisponible } = require("../lib/errors");

const textoOpcional = (max) => z.string().trim().max(max).optional().nullable();

// El email vacío se limpia explícitamente (NULL); si viene con datos, se valida
// el formato. Así una edición puede borrar el email sin confundirlo con "no enviado".
const emailOpcional = z.preprocess(
    (valor) => (typeof valor === "string" && valor.trim() === "" ? null : valor),
    z.string().trim().email("El email no es válido.").max(150).optional().nullable()
);

const esquemaListar = z.object({ busqueda: z.string().trim().max(100).optional() });

const esquemaId = z.object({
    id: z.coerce.number().int().positive("El cliente indicado no es válido."),
});

const esquemaCliente = z.object({
    nombre: z.string().trim().min(1, "El nombre es obligatorio.").max(150),
    dni: textoOpcional(20),
    telefono: textoOpcional(50),
    email: emailOpcional,
    tipo: textoOpcional(30),
    domicilio: textoOpcional(255),
});

function createClientesController({ clienteService }) {
    return {
        async listar(req, res) {
            if (!clienteService) throw servicioNoDisponible();
            const filtros = validar(esquemaListar, req.query ?? {});
            res.json({ clientes: await clienteService.listar(filtros) });
        },

        async crear(req, res) {
            if (!clienteService) throw servicioNoDisponible();
            const datos = validar(esquemaCliente, req.body ?? {});
            const resultado = await clienteService.crear(datos);
            res.status(201).json(resultado);
        },

        async actualizar(req, res) {
            if (!clienteService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            const datos = validar(esquemaCliente, req.body ?? {});
            res.json(await clienteService.actualizar(id, datos));
        },

        async eliminar(req, res) {
            if (!clienteService) throw servicioNoDisponible();
            const { id } = validar(esquemaId, req.params);
            await clienteService.eliminar(id);
            res.status(204).end();
        },
    };
}

module.exports = { createClientesController };
