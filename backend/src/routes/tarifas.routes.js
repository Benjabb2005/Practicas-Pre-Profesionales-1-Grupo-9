const express = require('express');
const { z } = require('zod');
const { validar } = require('../lib/validar');
const { requiereRol } = require('../middleware/roles');
const { servicioNoDisponible } = require('../lib/errors');
function createTarifasRouter(container) {
    const router = express.Router();
    router.use(container.auth || ((req, res, next) => next(servicioNoDisponible())));
    router.get('/', requiereRol('ADMINISTRADOR', 'OPERADOR'), async (req, res) => res.json({ tarifa: await container.tarifaService.obtener() }));
    router.put('/', requiereRol('ADMINISTRADOR'), async (req, res) => {
        const { precio_km } = validar(z.object({ precio_km: z.string() }).strict(), req.body);
        res.json({ tarifa: await container.tarifaService.guardar(precio_km, req.usuario.id) });
    });
    return router;
}
module.exports = { createTarifasRouter };
