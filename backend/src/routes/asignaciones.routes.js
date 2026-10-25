const express = require('express');
const { z } = require('zod');
const { validar } = require('../lib/validar');
const { servicioNoDisponible } = require('../lib/errors');
const { requiereRol } = require('../middleware/roles');

const idSchema = z.object({ id: z.coerce.number().int().positive() });
const cuerpoSchema = z.object({ chofer_id: z.number().int().positive().nullable() }).strict();

function createAsignacionesRouter(container = {}) {
    const router = express.Router();
    const servicio = container.asignacionService;
    router.use(container.auth || ((req, res, next) => next(servicioNoDisponible())));
    router.use(requiereRol('ADMINISTRADOR', 'OPERADOR'));
    router.get('/', async (req, res) => res.json({ pedidos: await servicio.listar() }));
    router.get('/choferes', async (req, res) => res.json({ choferes: await servicio.choferes() }));
    router.put('/:id', async (req, res) => {
        const { id } = validar(idSchema, req.params);
        const { chofer_id } = validar(cuerpoSchema, req.body);
        res.json({ pedido: await servicio.asignar(id, chofer_id, req.usuario.id) });
    });
    return router;
}

function createChoferRouter(container = {}) {
    const router = express.Router();
    const servicio = container.asignacionService;
    router.use(container.auth || ((req, res, next) => next(servicioNoDisponible())));
    router.use(requiereRol('CHOFER'));
    router.get('/pedidos', async (req, res) => res.json({ pedidos: await servicio.propios(req.usuario.id) }));
    router.get('/pedidos/:id', async (req, res) => {
        const { id } = validar(idSchema, req.params);
        res.json({ pedido: await servicio.propio(id, req.usuario.id) });
    });
    return router;
}

module.exports = { createAsignacionesRouter, createChoferRouter };
