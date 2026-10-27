# B04 y avance B05 · 26/10/2026

Implementación local autorizada por Benjamín en feature/benjamin-asignacion-entregas. B04 = GitHub #38 / Jira KAN-34. Pago corresponde a B05 = #39 / KAN-35, también de Benjamín; se registra aparte y no se cierra por anticipado. S06 de Santiago se consume mediante validarTransicion y las tablas existentes; no se modifica su módulo ni el esquema. Decisiones D09/D04 y spec frontend/specs/entrega-pago-chofer.md.

## Comportamiento y archivos

- EntregaService y EntregaRepository: entrega propia EN ENVÍO → ENTREGADO; intento FALLIDA con motivo → EN PREPARACIÓN (elección explícita del usuario). Bloqueo de pedido y comprobación de chofer activo; historial con usuario/fecha/hora de servidor, reversión ante error. UUID de intento conservado al reintentar; operación repetida no duplica historial ni retrocede un nuevo despacho. Consultar historial no expone pedidos ajenos.
- routes/asignaciones y container: rutas protegidas de entrega, pago, entregados e historial; ID positivo, resultado/método de catálogo, motivo3–500, monto textual positivo hasta dos decimales y diez enteros. No se admite identidad/estado arbitrario del navegador.
- PagoService dentro de EntregaService/repositorio: sólo dueño después de entregar, pagos único por pedido existente, monto y método; pago+historial en transacción. Mismo contenido es idempotente, contenido diferente da409. El pago no confirma acreditación ni cambia automáticamente a PAGADO: D04/Q02 sigue pendiente.
- ChoferPedidosPage y AccionChofer: confirmación interna antes de entregar, motivo para fallar, Pendientes/Entregados, pago opcional al entregar o más tarde, error/reintento, controles bloqueados mientras guarda, Escape y compatibilidad StrictMode. Entrega y pago son operaciones separadas; error del pago no revierte entrega.
- HistorialPedido y AsignacionesPage: historial paginado10 en chofer y Más información del operador, con fecha, autor, motivo y transición. API y pruebas ampliadas; estilos claro/oscuro y móvil.

## Verificaciones ejecutadas

- Sintaxis backend host: npm --prefix backend run check OK. El intento dentro del contenedor falló porque /scripts/check-backend.mjs no está montado; no se cambia Compose por esa herramienta.
- Suite backend en Docker:184 pasan,0fallan,2MySQL opt-in omitidas. Seis casos nuevos cubren pertenencia/estados/montos, entrega/fallo idempotente, pago único, rollback simulado, usuario inactivo y HTTP401/403/404/400/409. Se corrigió un alias de objeto del fake que falseaba el estado anterior.
- MySQL8.4 real en mandatodo_test_entregas_b04, base mandatodo_test_entregas nueva y aislada, sin puertos host ni volúmenes de desarrollo. Aplicado sólo allí el esquema001. Prueba entregas-mysql pasa aparte: intentos concurrentes, reenvío tardío después de redespacho, entrega, pago concurrente único, rechazo ajeno, fecha/autor de historial, listado y rollback SQL real de entrega/pago al fallar historial. Primer intento ECONNREFUSED durante inicialización, reintento posterior exitoso. Contenedor de prueba detenido al terminar; base de desarrollo intacta.
- Frontend53 pruebas pasan. Lint/build pasan tras retirar harness; lint inicial del harness detectó una asignación no usada que desapareció al retirarlo. Warning de bundle >500kB previo, no resuelto por esta tarea.
- Navegador con fixtures sintéticos y StrictMode:360×800 oscuro/claro y1440×900. Motivo vacío impide enviar; fallo vuelve a preparación y desaparece de pendientes; confirmar exige segundo toque en panel; pago con error sintético conserva método/monto y reintenta, entrega permanece; Entregados muestra método/monto y Ver historial; Escape cierra. Sin desborde horizontal, contenido desktop452px. Capturas ignoradas temp/b04-entregado-pago-oscuro.png y temp/b04-historial-claro.png. Harness eliminado. Esto no acredita un recorrido UI+API+MySQL en conjunto ni celular físico.
- npm run check raíz conserva fallo previo de copias Claude ppp1-mvp1 fuera de sincronía. No se modifican skills ajenas. git diff --check OK.

## Seguimiento y cómo revisar

Jira KAN-34 En revisión y KAN-35 En curso; GitHub Projects #38/#39 En progreso (no tiene En revisión), con comentarios de alcance, pruebas y límites. No hay commit/push de estos cambios.

Despachar un pedido confirmado a un chofer desde Asignaciones. Ingresar como ese chofer: Confirmar entrega abre confirmación; No se pudo entregar pide motivo y devuelve a preparación. El operador consulta Más información para ver el intento y puede revisar antes de redespachar. Después de entregar, Registrar pago ofrece efectivo/transferencia y monto; Más tarde permite recuperarlo desde Entregados. No se debe cerrar B05 hasta definir quién acredita y verificar la política acordada.

## Ajustes pedidos el26/10/2026: importe, historial y bloqueados
Benjamín pide quitar monto del panel de pago y decide explícitamente dejar pendiente conectarlo al futuro importe del pedido; no modificar carga de Julián ni esquema. AccionChofer sólo permite elegir método, muestra aviso y deshabilita guardado para no inventar un importe ni enviar un pago incompleto. El contrato backend previo con monto se conserva como borrador no conectado; B05 sigue En progreso. Historial muestra estado actual y transiciones reales, sin fechas/usuario/observaciones ni movimientos sin cambio de estado; auditoría DB intacta. Resumen de asignaciones cuenta bloqueados sólo EN STOCK/EN PREPARACIÓN no habilitados: ya no suma EN ENVÍO/ENTREGADO/PAGADO. Caso de regresión mixto54 pruebas frontend; lint/build verificados en Docker. Sin commit/push.

## Historial según branch-benjamin-1 (26/10/2026)
Benjamín rechaza la lista genérica y pide recuperar referencia anterior. Se inspeccionaron DeliveryHistory de DeliveryActions.jsx y su CSS en origin/branch-benjamin-1. Se adapta la línea vertical con tarjetas de Entregado/Intento fallido, fecha de Buenos Aires, responsable y motivo del fallo. Sólo eventos de entrega/intento; no asignaciones, preparación inicial ni pago. Paginado10 conservado. La petición de referencia supera el ajuste anterior de ocultar fecha/usuario. API y auditoría intactas; sin fabricar campos receptor/pago que el evento actual no tiene. Frontend55, lint/build pasan; sin nueva prueba visual en esta corrección. Sin commit/push.

## Ampliación del historial visual (26/10/2026)
Benjamín aclara incluir también cambios de estado con la misma línea vertical de branch-benjamin-1. Ahora incluye creación, preparación, despacho y demás transiciones reales, además de entrega e intento fallido. Título anterior→nuevo para cambios, fecha/autor y motivo de fallo conservados; movimientos sin cambio de estado no se agregan. Paginado10 y auditoría intactos. Frontend55, lint/build pasan. Sin commit/push.

## Etiquetas del historial aclaradas (26/10/2026)
Benjamín aclara que cada entrada muestre sólo estado de destino: En stock, En preparación, Despachado, Entregado o Pagado; sin anterior ni flecha. Conserva todos los movimientos en línea vertical, fecha/autor y motivo del intento fallido (En preparación · Intento fallido). No cambia estado persistido EN ENVÍO, sólo etiqueta Despachado. Frontend55, lint/build pasan; sin commit/push.
