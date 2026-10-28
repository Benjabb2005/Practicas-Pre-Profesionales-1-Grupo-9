const express=require('express');
const { z }=require('zod');
const { validar }=require('../lib/validar');
const { errorValidacion,servicioNoDisponible }=require('../lib/errors');
const { requiereRol }=require('../middleware/roles');
const { LIMITE }=require('../services/ComprobanteService');
const idSchema=z.object({id:z.coerce.number().int().positive()});
function createComprobantesRouter(container) {
    const router=express.Router();
    router.use(container.auth || ((req,res,next)=>next(servicioNoDisponible())));
    router.use(requiereRol('ADMINISTRADOR','CHOFER'));
    router.get('/pedido/:id',async(req,res)=>{
        const {id}=validar(idSchema,req.params);
        res.json({comprobantes:await container.comprobanteService.listar(id,req.usuario.id)});
    });
    router.post('/pedido/:id',requiereRol('CHOFER'),express.raw({type:()=>true,limit:LIMITE}),async(req,res)=>{
        const {id}=validar(idSchema,req.params);
        let nombre;try{nombre=decodeURIComponent(req.get('X-Nombre-Archivo') || '');}catch{throw errorValidacion({archivo:'Nombre de archivo inválido.'});}
        res.status(201).json({comprobante:await container.comprobanteService.subir(id,req.usuario.id,req.body,nombre)});
    });
    router.get('/:id',async(req,res)=>{
        const {id}=validar(idSchema,req.params);
        const archivo=await container.comprobanteService.obtener(id,req.usuario.id);
        res.set({'Content-Type':archivo.tipo,'Content-Disposition':`attachment; filename*=UTF-8''${encodeURIComponent(archivo.nombre)}`,'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-store'});
        res.send(archivo.archivo);
    });
    return router;
}
module.exports={createComprobantesRouter};
