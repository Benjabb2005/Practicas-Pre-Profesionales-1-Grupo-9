# Migración 005 · KAN-54

Agrega únicamente `direcciones_cliente`; requiere migraciones 001–004. La clave
única `(cliente_id, clave)` contiene SHA256 de los siete campos normalizados,
incluidos piso/depto y entre calles. No se guardan coordenadas ni confirmación.
No modifica ni copia pedidos anteriores: sus direcciones se leen como opciones
históricas y se deduplican junto con las de la libreta. No usa clientes.domicilio.

Antes de actualizar otra copia: respaldo consistente privado de MySQL con datos,
esquema e historial de migraciones, restauración en base separada y verificación
de conservación. Con backend actualizado:

```powershell
docker compose exec -T backend npm run migrate:dry
docker compose exec -T backend npm run migrate
```

Comprobar que sólo 005 esté pendiente, que todos los conteos de tablas anteriores
se conserven (schema_migrations suma uno) y repetir migrate sin pendientes. Probar
GET /api/clientes/:id/direcciones con admin/operador; chofer debe recibir 403.

La copia local aislada ya está migrada (02/11/2026). Respaldo previo privado y
metadatos de conservación están ignorados en temp/kan54-aplicacion.json; el archivo
SQL se indica allí. No versionar esos archivos. Se ensayó restauración en copias
separadas, migración dos veces y una integración MySQL en una tercera base nueva.

Para repetir la integración usar una base de fixtures nueva que comience por
mandatodo_test_direcciones_ y termine en dígitos, con migraciones aplicadas. Nunca
usar la base del usuario. Desde backend, definir DB_NAME y DIRECCIONES_CLIENTE_MYSQL=1
y ejecutar node --test test/direcciones-cliente-mysql.test.js. Los fixtures quedan
en esa base aislada para inspección. No borran registros de la base local.

El DDL de MySQL no ofrece rollback transaccional. Ante un fallo, detener el cambio,
inspeccionar la tabla y el historial; no borrar el volumen ni reaplicar init.sql.
Recuperación de aplicación: volver al código previo conservando la tabla adicional
y los pedidos intactos. Para recuperar desde respaldo, restaurar primero en otra
base y verificar antes de cambiar conexión; no reemplazar datos locales a ciegas.
Si falla el alta de dirección durante una creación, la transacción revierte también
el nuevo pedido y su dirección: no queda un alta parcialmente guardada.
