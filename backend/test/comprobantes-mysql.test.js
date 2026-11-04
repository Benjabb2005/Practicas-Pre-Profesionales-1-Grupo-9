const{test}=require('node:test');const assert=require('node:assert/strict');const{once}=require('node:events');
const mysql=require('mysql2/promise'),jwt=require('jsonwebtoken'),createApp=require('../app');
test('MySQL/HTTP comprobantes: persistencia binaria, permisos, duplicados concurrentes y acreditación', {skip:process.env.COMPROBANTES_MYSQL!=='1'},async()=>{
 assert.equal(process.env.DB_NAME,'mandatodo_test_entregas');
 const db=mysql.createPool({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,connectionLimit:4});
 let server;
 try{
  const ids=[];for(const rol of ['ADMINISTRADOR','CHOFER','CHOFER','OPERADOR']){const[r]=await db.query('INSERT INTO usuarios(nombre,email,password_hash,rol)VALUES(?,?,?,?)',['Prueba adjunto',`${rol}-${Date.now()}-${ids.length}@example.invalid`,'hash-no-utilizable',rol]);ids.push(r.insertId);}
  const[cl]=await db.query('INSERT INTO clientes(nombre)VALUES(?)',['Cliente sintético adjunto']);
  const[p]=await db.query('INSERT INTO pedidos(cliente_id,estado,chofer_id,importe_base)VALUES(?,?,?,?)',[cl.insertId,'ENTREGADO',ids[1],'1500.00']);
  const id=p.insertId;await db.query('INSERT INTO pagos(pedido_id,metodo,monto,registrado_por)VALUES(?,?,?,?)',[id,'TRANSFERENCIA','1500.00',ids[1]]);
  server=createApp({db,config:{jwt:{secret:'secreto-sintetico'},geocode:{}}}).listen(0,'127.0.0.1');await once(server,'listening');
  const roles=['ADMINISTRADOR','CHOFER','CHOFER','OPERADOR'];
  async function pedir(path,idx=1,method='GET',body){return fetch(`http://127.0.0.1:${server.address().port}/api${path}`,{method,headers:{authorization:`Bearer ${jwt.sign({sub:ids[idx],rol:roles[idx]},'secreto-sintetico')}`,'content-type':Buffer.isBuffer(body)?'application/pdf':'application/json','x-nombre-archivo':encodeURIComponent('Comprobante sintético.pdf')},body:body?(Buffer.isBuffer(body)?body:JSON.stringify(body)):undefined});}
  const bytes=Buffer.from('%PDF-1.4\ncomprobante sintético de prueba\n%%EOF');
  assert.equal((await(await pedir('/chofer/entregados')).json()).pedidos.find(p=>p.id===id).comprobantes_cantidad,0);
  const subidas=await Promise.all([pedir(`/comprobantes/pedido/${id}`,1,'POST',bytes),pedir(`/comprobantes/pedido/${id}`,1,'POST',bytes)]);
  assert.ok(subidas.every(r=>r.status===201));
  const archivos=(await(await pedir(`/comprobantes/pedido/${id}`)).json()).comprobantes;assert.equal(archivos.length,1);
  const comprobanteId=archivos[0].id;
  assert.equal((await(await pedir('/chofer/entregados')).json()).pedidos.find(p=>p.id===id).comprobantes_cantidad,1);
  assert.equal((await(await pedir('/asignaciones',0)).json()).pedidos.find(p=>p.id===id).comprobantes_cantidad,1);
  assert.equal((await(await pedir(`/pedidos/${id}`,3)).json()).pedido.comprobantes_cantidad,1);
  const descarga=await pedir(`/comprobantes/${comprobanteId}`,0);assert.equal(descarga.status,200);assert.equal(descarga.headers.get('content-type'),'application/pdf');assert.equal(descarga.headers.get('x-content-type-options'),'nosniff');assert.deepEqual(Buffer.from(await descarga.arrayBuffer()),bytes);
  assert.equal((await pedir(`/comprobantes/${comprobanteId}`,2)).status,404);
  assert.equal((await pedir(`/comprobantes/${comprobanteId}`,3)).status,403);
  assert.equal((await pedir(`/comprobantes/pedido/${id}`,2,'POST',bytes)).status,404);
  assert.equal((await pedir(`/asignaciones/${id}/acreditar-pago`,0,'PUT',{})).status,200);
  assert.equal((await pedir(`/comprobantes/pedido/${id}`,1,'POST',Buffer.from('%PDF-1.4\notro\n%%EOF'))).status,201);
  assert.equal((await pedir(`/comprobantes/${comprobanteId}`,1)).status,200);
  const[[fila]]=await db.query('SELECT estado FROM pedidos WHERE id=?',[id]);assert.equal(fila.estado,'PAGADO');
 }finally{if(server){server.close();await once(server,'close');}await db.end();}
});
