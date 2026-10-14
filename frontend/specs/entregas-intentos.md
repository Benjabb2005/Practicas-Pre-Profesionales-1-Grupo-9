# Entregas e intentos fallidos

Fecha: 14/10/2026. Corte solicitado después de asignación/despacho. Reglas confirmadas por usuario: chofer asignado, administrador y operador registran resultados; receptor obligatorio en entrega, motivo en fallo; observaciones opcionales en ambos resultados; staff prepara reintentos con historial, sin foto ni firma.

## Problema y alcance

Cerrar un envío real y conservar cada intento con responsable y fecha. Mantener tablero operativo por fila, detalle con tarjetas, portal chofer y mapas modales. Entrega y pago son hechos separados: este corte no acredita cobros ni transferencias. Sin optimización de rutas, fotos o firmas hasta confirmación de requisitos.

## Decisiones aceptadas

- D04: chofer asignado, administrador y operador pueden registrar entrega/intento fallido.
- D09: administrador y operador pueden devolver Fallido a En preparación para nueva salida, conservando historial.
- Evidencia: nombre de receptor obligatorio en entrega, motivo obligatorio en fallo; observación opcional tanto en éxito como en fallo. Sin foto ni firma por ahora.

## Flujo aprobado

En envío ofrece Registrar entrega o No se pudo entregar. Un modal explica pedido/destino, solicita los datos definidos y confirma solo ante respuesta exitosa. Cancelar conserva pedido; guardando bloquea doble clic y errores permanecen junto al formulario. Resultado conserva historial y actualiza listado. Tablero y detalle muestran resultado y datos de cada intento; no asumir PAGADO por una entrega. Reintento explícito por staff si se aprueba, conserva intentos anteriores y exige nuevamente reglas actuales de despacho.

## Criterios técnicos independientes

Validación y autorización en servidor, chofer ajeno sin acceso, transacción atómica estado/historial, reintento de request sin doble registro, rechazo de transiciones incompatibles y de payload con estado arbitrario. Recarga mantiene resultados. Usar historial_estados y estados existentes si el contrato final alcanza; no duplicar tablas sin necesidad. No sobrescribir observaciones de entrega originales. UI responsive, foco contenido en modal, X/Escape/Cancelar y devolución al disparador; errores visibles sin perder datos.

## Verificación prevista

API sin UI: permisos de rol y recurso, datos faltantes, conflicto de estado, dos solicitudes concurrentes y fallo de persistencia. MySQL aislado: estado e historial atómicos, historial conservado entre intentos y consulta tras recarga. Navegador sintético: entrega/fallo/cancelación, estado vacío, actualización y móvil. No confirmar entregas humanas durante QA.

Persistencia implementada: historial_estados con evento JSON de resultado/reintento, actor/fecha, receptor/motivo/observación, chofer y clave idempotente. No nueva migración. Reintento despeja asignación; nueva salida exige chofer activo y ubicación vigente. API POST /pedidos/:id/resultado y /reintentar con Idempotency-Key UUID v4; GET /pedidos/:id/entregas consulta historial autorizado. Claves/hashes internos no se exponen. El portal chofer muestra mensaje de éxito y actualiza pendientes; tablero conserva distintivos y detalle muestra línea de tiempo.

## Ajuste posterior: detalle modal y método de pago
Usuario pide detalle en modal con fondo oscuro, conservando tarjetas/historial y cierre por botón/Escape/fondo. Mapa puede abrirse encima del detalle y cerrar solo la ventana superior. Entrega exitosa exige método de pago: exclusivamente efectivo o transferencia, según respuesta explícita. Se guarda en el evento y muestra en historial; no acredita pago ni modifica estado financiero. Observaciones opcionales en ambos resultados; receptor y motivo siguen obligatorios. Criterios: método omitido/inválido rechazado servidor, fallo sin nota aceptado, entrega sin nota aceptada con receptor/método, historial recargado conserva método, dialog responsive y foco restituido.
