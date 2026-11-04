const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createPedidoRepository}=require('../src/repositories/PedidoRepository');

function escenario(pedido,pago){
    const cambios=[];
    const c={beginTransaction:async()=>{},commit:async()=>cambios.push('commit'),rollback:async()=>cambios.push('rollback'),release:()=>{},
        query:async(sql,valores)=>{
            if(sql.startsWith('SELECT estado'))return [[pedido]];
            if(sql.startsWith('SELECT id FROM pagos'))return [[pago]];
            cambios.push({sql,valores});return [{}];
        }};
    return {repo:createPedidoRepository({getConnection:async()=>c}),cambios};
}
test('completa importe de entregado antiguo sin pago conservando estado e incluyendo recargos',async()=>{
    const {repo,cambios}=escenario({estado:'ENTREGADO',importe_base:null,intentos_fallidos:2});
    await repo.completarImporte(3,'1000.00',1);
    assert.deepEqual(cambios[0].valores,['1000.00','1000.00',3]);
    assert.deepEqual(cambios[1].valores.slice(0,4),[3,'ENTREGADO','ENTREGADO',1]);
    assert.equal(cambios.at(-1),'commit');
});
test('no modifica importes existentes, pedidos pagados ni pagos ya registrados',async()=>{
    for(const [pedido,pago] of [
        [{estado:'ENTREGADO',importe_base:'1000.00'},null],
        [{estado:'PAGADO',importe_base:null},null],
        [{estado:'ENTREGADO',importe_base:null},{id:9}],
    ]){
        const {repo,cambios}=escenario(pedido,pago);
        await assert.rejects(()=>repo.completarImporte(3,'1000.00',1),e=>e.statusCode===409);
        assert.deepEqual(cambios,['rollback']);
    }
});
