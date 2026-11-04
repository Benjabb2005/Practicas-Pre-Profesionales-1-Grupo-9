const express = require('express');
const { z } = require('zod');
const { validar } = require('../lib/validar');
const { servicioNoDisponible } = require('../lib/errors');
const { requiereRol } = require('../middleware/roles');

const idSchema = z.object({ id: z.coerce.number().int().positive() });
const cuerpoSchema = z.object({ chofer_id: z.number().int().positive().nullable() }).strict();
const estadoSchema = z.object({ estado: z.enum(['EN PREPARACIÓN', 'EN ENVÍO']) }).strict();
const entregaSchema = z.discriminatedUnion('resultado', [
    z.object({ resultado: z.literal('ENTREGADO'), operacion_id: z.string().uuid() }).strict(),
    z.object({ resultado: z.literal('FALLIDA'), operacion_id: z.string().uuid(), motivo: z.string().trim().min(3).max(500) }).strict(),
]);
const pagoSchema = z.object({ metodo: z.enum(['EFECTIVO', 'TRANSFERENCIA']) }).strict();

function createAsignacionesRouter(container = {}) {
    const router = express.Router();
    const servicio = container.asignacionService;
    router.use(container.auth || ((req, res, next) => next(servicioNoDisponible())));
    router.use(requiereRol('ADMINISTRADOR', 'OPERADOR'));
    router.get('/', async (req, res) => res.json({ pedidos: await servicio.listar() }));
    router.get('/choferes', async (req, res) => res.json({ choferes: await servicio.choferes() }));
    router.put('/:id/acreditar-pago', requiereRol('ADMINISTRADOR'), async (req,res) => {
        const { id } = validar(idSchema,req.params);
        validar(z.object({}).strict(),req.body);
        res.json({ pedido:await container.entregaService.acreditar(id,req.usuario.id) });
    });
    router.get('/:id/historial', async (req, res) => {
        const { id } = validar(idSchema, req.params);
        res.json({ historial: await container.entregaService.historial(id, req.usuario) });
    });
    router.put('/:id/estado', async (req, res) => {
        const { id } = validar(idSchema, req.params);
        const { estado } = validar(estadoSchema, req.body);
        res.json({ pedido: await servicio.cambiarEstado(id, estado, req.usuario.id) });
    });
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
    router.get('/entregados', async (req, res) => res.json({ pedidos: await container.entregaService.entregados(req.usuario.id) }));
    router.get('/pedidos/:id/historial', async (req, res) => {
        const { id } = validar(idSchema, req.params);
        res.json({ historial: await container.entregaService.historial(id, req.usuario) });
    });
    router.put('/pedidos/:id/entrega', async (req, res) => {
        const { id } = validar(idSchema, req.params);
        const datos = validar(entregaSchema, req.body);
        res.json({ pedido: await container.entregaService.registrar(id, req.usuario.id, datos) });
    });
    router.put('/pedidos/:id/pago', async (req, res) => {
        const { id } = validar(idSchema, req.params);
        const datos = validar(pagoSchema, req.body);
        res.json({ pago: await container.entregaService.pago(id, req.usuario.id, datos) });
    });
    router.get('/pedidos', async (req, res) => res.json({ pedidos: await servicio.propios(req.usuario.id) }));
    router.get('/pedidos/:id', async (req, res) => {
        const { id } = validar(idSchema, req.params);
        res.json({ pedido: await servicio.propio(id, req.usuario.id) });
    });
    return router;
}

module.exports = { createAsignacionesRouter, createChoferRouter };
