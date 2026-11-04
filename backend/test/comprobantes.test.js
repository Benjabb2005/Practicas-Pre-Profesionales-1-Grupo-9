const {test}=require('node:test');
const assert=require('node:assert/strict');
const {once}=require('node:events');
const jwt=require('jsonwebtoken');
const createApp=require('../app');
const {validarArchivo,validarAcceso,LIMITE}=require('../src/services/ComprobanteService');
test('comprobantes: formato real, nombre, límite y hash idempotente',()=>{
 const pdf=Buffer.from('%PDF-1.4\nfixture sintético\n%%EOF');
 const validado=validarArchivo(pdf,'../recibo.pdf');
 assert.equal(validado.nombre,'recibo.pdf');assert.equal(validado.tipo,'application/pdf');
 assert.equal(validado.sha256,validarArchivo(pdf,'otro.pdf').sha256);
 for(const [contenido,nombre] of [[Buffer.from('<script>alert(1)</script>'),'recibo.pdf'],[pdf,'recibo.exe'],[Buffer.alloc(0),'recibo.pdf'],[Buffer.alloc(LIMITE+1),'recibo.pdf'],[pdf,'']])assert.throws(()=>validarArchivo(contenido,nombre),e=>e.statusCode===400);
 const png=Buffer.from([137,80,78,71,13,10,26,10,0]);
 assert.equal(validarArchivo(png,'foto.png').tipo,'image/png');
});
test('comprobantes: chofer propio pendiente sube, admin consulta, otros no ven ni modifican',()=>{
 const p={id:1,chofer_id:3,estado:'ENTREGADO',pago_metodo:'TRANSFERENCIA'};
 validarAcceso(p,{id:3,rol:'CHOFER',activo:1},true);
 validarAcceso(p,{id:1,rol:'ADMINISTRADOR',activo:1});
 assert.throws(()=>validarAcceso(p,{id:4,rol:'CHOFER',activo:1}),e=>e.statusCode===404);
 for(const usuario of [{id:1,rol:'OPERADOR',activo:1},{id:3,rol:'CHOFER',activo:0}])assert.throws(()=>validarAcceso(p,usuario),e=>e.statusCode===403);
 validarAcceso({...p,estado:'PAGADO'},{id:3,rol:'CHOFER',activo:1},true);
 for(const cambio of [{pago_metodo:'EFECTIVO'},{estado:'EN ENVÍO'}])assert.throws(()=>validarAcceso({...p,...cambio},{id:3,rol:'CHOFER',activo:1},true),e=>e.statusCode===409);
});
test('HTTP comprobantes: sesión/roles, tipo inválido, nombre mal codificado y tamaño413',async()=>{
 const server=createApp({db:{},config:{jwt:{secret:'secreto-sintetico'},geocode:{}}}).listen(0,'127.0.0.1');await once(server,'listening');
 const pedir=(rol,body,nombre='recibo.pdf')=>fetch(`http://127.0.0.1:${server.address().port}/api/comprobantes/pedido/1`,{method:'POST',headers:{'content-type':'application/pdf','x-nombre-archivo':nombre,...(rol?{authorization:`Bearer ${jwt.sign({sub:3,rol},'secreto-sintetico')}`}:{})},body});
 try{
  assert.equal((await pedir(null,Buffer.from('texto'))).status,401);
  for(const rol of ['ADMINISTRADOR','OPERADOR'])assert.equal((await pedir(rol,Buffer.from('texto'))).status,403);
  assert.equal((await pedir('CHOFER',Buffer.from('texto'))).status,400);
  assert.equal((await pedir('CHOFER',Buffer.from('%PDF-1.4'),'%ZZ')).status,400);
  assert.equal((await pedir('CHOFER',Buffer.alloc(LIMITE+1))).status,413);
 }finally{server.close();await once(server,'close');}
});
