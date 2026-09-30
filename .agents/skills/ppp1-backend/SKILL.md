---
name: ppp1-backend
description: Implementar o revisar endpoints Express del TP PPP1, validaciones, autorización por recurso y consultas MySQL.
---

# Backend Express y datos

## Contexto
Leer `docs/arquitectura.md`, `docs/decisiones.md`, `backend/app.js`, `backend/index.js` y `database/init.sql`. Hoy app contiene solo GET /; index carga entorno y conecta DB. No existen CRUD ni middleware de auth.

## Procedimiento
1. Definir contrato: método/ruta, cuerpo, respuesta, errores y matriz de permiso por acción y recurso. No asumir permisos idénticos entre admin y operador ni rol chofer ya soportado por SQL.
2. Validar tipo, formato, longitud y obligatoriedad en servidor según decisión registrada. Separar identidad de cliente de identidad de envío. Rechazar datos insuficientes sin inventarlos.
3. Colocar rutas/middleware en app o módulos enfocados; conservar arranque/conexiones fuera de pruebas HTTP. Extraer acceso a datos cuando haga falta, con dependencias sustituibles para pruebas.
4. Usar SQL parametrizado. No confiar en IDs o roles enviados por navegador. Para chofer, verificar asignación en cada lectura/mutación y no solo al listar.
5. Cambios relacionados de pedido/historial deben ser atómicos. Definir transacciones, manejo de conflicto y reintento según operación; no prometer atomicidad por varias queries independientes.
6. Bloquear despacho sin dirección completa y confirmación vigente; coordenadas o booleano de frontend no bastan. Tratar errores DB sin devolver SQL, contraseñas ni datos personales.
7. Al implementar login, aplicar D02 y contrato de sesión acordado, hash y secretos de entorno; reemplazar la maqueta en el alcance autorizado. Justificar dependencia nueva.

## Verificar
npm --prefix backend run check y npm --prefix backend test. Agregar casos de cuerpo inválido, recurso ausente, sesión ausente/inválida, rol/ID no autorizado, dirección modificada tras confirmar y fallo de transacción según endpoint. Usar node:test y fetch ya disponibles. Para integridad relacional, usar MySQL de prueba separado con datos sintéticos y verificar rollback; un fake no acredita SQL real.

## Entregar
Contrato y ejemplos sin credenciales, explicación de validación/permiso, pruebas con alcance real, variables requeridas sin secretos y cambios en arquitectura/tareas.
