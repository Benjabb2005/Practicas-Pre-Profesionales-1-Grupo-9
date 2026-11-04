# KAN-54 · direcciones reutilizables por cliente

Pedido explícito de Benjamín: implementar ahora KAN-54 sobre la interfaz vigente;
la precedencia editorial de KAN-53 no bloquea esta tarea. No rediseñar otras pantallas.

Al seleccionar cliente en Cargar pedido se consulta GET /api/clientes/:id/direcciones
(administrador/operador). El selector ofrece sus direcciones y «Otra dirección»;
elegir precarga exclusivamente campos estructurados, nunca coordenadas/confirmación.
Otra dirección limpia los campos; cambiar cliente también limpia selección/dirección
e importe manual, sin afectar pedidos persistidos. Cancelar cliente vuelve a carga
nueva sin conservar una dirección del anterior. Estados: cargando, vacío, error con
reintento; el error no impide escribir otra dirección. UI compacta/responsiva.

Las direcciones de pedidos anteriores son opciones reales, consultadas en lectura
y deduplicadas con la misma regla que las nuevas. No se inventan domicilios a partir
del campo libre clientes.domicilio. Migración005 crea direcciones_cliente sin tocar
las tablas anteriores. El alta de pedido agrega su snapshot a esa libreta en la misma
transacción; error revierte ambos. Unique(cliente_id,clave) evita duplicados incluso
con concurrencia. La clave SHA256 usa campos normalizados (incluye piso/depto y entre
calles, preservando diferencias); no incluye dirección original ni coordenadas.
Una repetida no sobrescribe la primera original ni modifica pedidos anteriores.

GET devuelve sólo campos reutilizables; crear siempre revalida dirección y exige
confirmación humana posterior. La normalización/previsualización/sugerencia de
importe se disparan como al escribir una dirección nueva. No hay editar/borrar
direcciones de libreta ni cambios de tarifas/permisos/estados en este corte.

Antes de aplicar005 en la copia local: respaldo privado, restauración ensayada en
base aislada, migración repetida/idempotencia y conservación verificadas. DDL no se
revierte mediante rollback. Recuperación: volver al código anterior conservando la
tabla adicional; respaldo para restaurar únicamente en una copia, sin borrar datos.
Pruebas con fixtures aislados cubren alta/repetición/piso/depto/referencias, separación
por cliente, rollback, lectura histórica, reinicio de selección y no copiar confirmación.
Prueba visual/móvil conjunta queda pendiente si no se ejecuta.
