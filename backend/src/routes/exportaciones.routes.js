const express = require('express');
const { z } = require('zod');
const { validar } = require('../lib/validar');
const { requiereRol } = require('../middleware/roles');
const { servicioNoDisponible } = require('../lib/errors');

function createExportacionesRouter(container = {}) {
    const router = express.Router();
    router.use(container.auth || ((req, res, next) => next(servicioNoDisponible())));
    router.use(requiereRol('ADMINISTRADOR', 'OPERADOR', 'CHOFER'));
    router.get('/pedidos/:id', async (req, res) => {
        const { id } = validar(z.object({ id: z.coerce.number().int().positive().safe() }), req.params);
        res.set('Cache-Control', 'no-store');
        res.json(await container.exportacionRepository.obtener(id, req.usuario));
    });
    return router;
}
module.exports = { createExportacionesRouter };
