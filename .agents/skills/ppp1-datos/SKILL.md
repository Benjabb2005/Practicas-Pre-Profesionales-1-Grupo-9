---
name: ppp1-datos
description: Preparar cambios MySQL y saneamiento o migración del Excel histórico PPP1 con trazabilidad, dry-run e idempotencia.
---

# Esquema e importación histórica

## Contexto
Leer `docs/fuentes.md`, `docs/arquitectura.md`, `docs/decisiones.md` y `database/init.sql`. El Excel original no se versiona: el equipo lo deja en `temp/`. No hay runner de migraciones ni importador; crear uno solo como parte de una tarea autorizada.

## Procedimiento: esquema
1. Contrastar esquema existente y estado real de DB en lectura, sin publicar datos personales. Resolver D05 antes de cambios estructurales.
2. Diseñar migración versionada para BD nueva y existente, con precondiciones y validación posterior. init.sql no es idempotente completo; CREATE TABLE IF NOT EXISTS no migra tablas y CREATE INDEX puede fallar al repetir.
3. Preparar backup/restauración en copia y explicar reversión o recuperación antes de aplicar. Revisar cascadas y referencias; no borrar volúmenes ni usar DROP/TRUNCATE para resolver conflictos.
4. Registrar migraciones aplicadas y evitar doble aplicación. DDL MySQL puede confirmar implícitamente: no prometer rollback de DDL por envolverlo en una transacción.

## Procedimiento: Excel
1. Abrir fuente en lectura desde `temp/`, registrar nombre/hash y hoja/fila. Conservar el original sin versionarlo ni copiarlo al resto del árbol. Inventario inicial: Pedidos, Clientes e Historial_Geo, 12 registros por hoja.
2. Perfilar vacíos, fechas ambiguas, códigos duplicados, estados y relaciones antes de transformar. No perder intentos históricos.
3. Acordar mapeo de columnas y estados; preservar texto original y decisión de limpieza. Clientes no trae DNI: no generarlo ni impedir toda migración sin revisar alternativa.
4. Distinguir clientes candidatos a duplicado y pedidos legítimos. No unir registros solo por nombre, dirección, DNI o normalización de código sin revisión.
5. Diseñar dry-run sin escrituras con aceptadas/rechazadas/revisión y causas; ejemplos sintéticos en pruebas. No enviar datos históricos a geocodificador como efecto oculto de importar.
6. Importar con claves de origen estables y relaciones reconciliadas, transacciones DML y reporte por lote. Reejecutar mismo archivo debe evitar duplicación sin sobrescribir cambios posteriores silenciosamente.
7. No convertir score alto o coordenadas históricas en confirmación humana vigente.

## Verificar
En base separada: suma de aceptadas/rechazadas/revisión igual a filas de origen; sin huérfanos; dos ejecuciones no duplican; fallo intermedio no deja lote parcial; correcciones trazables. Verificar conservación de datos previos y restauración. npm run check es adicional, no prueba migración SQL.

## Entregar
Mapeo, decisiones pendientes, plan de recuperación, comandos exactos del runner creado, reporte agregado sin datos personales, evidencia de dry-run/aplicación y tareas actualizadas. No declarar migración ejecutada si solo se diseñó.
