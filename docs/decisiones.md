# Decisiones y dudas

Actualizar fecha, responsable y evidencia al resolver; no convertir una propuesta en aceptada sin decisión del equipo.

| ID | Estado | Decisión o pendiente | Evidencia / siguiente acción |
| --- | --- | --- | --- |
| D01 | Vigente | React/Vite JS, Node/Express CommonJS, MySQL, Compose | Código y manifests; conservar stack |
| D02 | Implementada, 13/10/2026 | JWT de sesión stateless para autenticación | `POST /api/auth/login` devuelve `{ token, usuario }`; las rutas protegidas leen `Authorization: Bearer`; `GET /api/auth/me` restaura la sesión. Contrato en `backend/src/services/AuthService.js` |
| D03 | Confirmado según entrevista resumida | Confirmación humana siempre antes de despacho; carga manual estructurada | Confirmación humana y bloqueo de servidor implementados en la rama; ver B01/B02 y B06 |
| D04 | Implementada en el módulo; acuerdo global Q01/Q02 pendiente | Preparación separada de despacho; cambios de chofer antes de EN ENVÍO. Efectivo cobrado → PAGADO; transferencia → ENTREGADO hasta acreditar por administrador activo | Regla de pagos definida el 26/10 y preparación ratificada por Benjamín el 28/10/2026. Ver B02/B05. No cierra acuerdos de otros responsables |
| D05 | Resuelta en lo técnico, 13/10/2026; el equipo debe validar el modelo | Reconciliar SQL con roles, estados, DNI, asignación, confirmación versionada y pago | Esquema objetivo en `database/migrations/001_esquema_inicial.sql` (7 tablas + `schema_migrations`); `database/init.sql` intacto y sin reaplicar |
| D06 | Actualizado por pedido de Benjamín, 23/10/2026 | Georef como proveedor activo + React Leaflet para mapa | Georef es gratuito y devuelve coordenadas aproximadas; se conserva la revisión humana. La selección de Google requiere mapa de Google y retención de coordenadas por no más de 30 días, por lo que no queda activable mientras el mapa y la persistencia sean Leaflet/MySQL. La integración anterior con Nominatim queda reemplazada. |
| D07 | Implementación local como alcance del equipo, 20/10/2026; validación cliente/docentes pendiente | Pantalla independiente ABM Clientes en MVP 1 | ABM completo en `/clientes` (backend + pantalla), separado de datos del pedido y frecuentes. Falta validar con cliente/docentes el alcance académico del CRUD. |
| D08 | Pendiente cliente | Campos obligatorios: DNI, CP, provincia y alternativa cuando falta DNI | Provincia ausente en demo; distinguir CABA de provincia de Buenos Aires |
| D09 | Parcial: borrador y fallo implementados; validación de alcance/cancelación pendiente | Dirección con problemas se guarda como borrador EN STOCK; no se geocodifica mientras haya problemas de validación y no se despacha sin confirmación humana. Fallo → EN PREPARACIÓN, motivo, recargo y próxima visita | B04/B07 y D23. La preparación interna está permitida aunque falte confirmar; Q04 conserva coordinación pendiente |
| D10 | Invalidación y auditoría implementadas; versionado/concurrencia pendiente | Al cambiar dirección descartamos coordenadas e invalidamos confirmación. Registramos responsable y acción de confirmación | No damos por cerrado el modelo de versión ni las carreras entre edición/confirmación; Q03 de Sabrina/Santiago sigue pendiente |
| D11 | Pendiente cliente; detección de clientes y pedidos implementada, 21/10/2026 | Duplicado de pedido y resolución de discrepancias de frecuentes | DNI o dirección compartida no autorizan fusionar envíos. El ABM y la carga avisan coincidencias de teléfono/email con nombre y DNI del otro cliente. La carga detecta pedidos del mismo cliente con la misma dirección normalizada dentro de `DUPLICADOS_VENTANA_HORAS` (24 h por defecto): responde `409 DUPLICADO_POTENCIAL` y exige confirmación explícita antes de crear otro. No se fusionan ni se resuelven discrepancias automáticamente; esa parte sigue pendiente. |
| D12 | Pendiente docentes/equipo | Reporte mínimo Hito 2 y calendario | Separar entrega académica de MVP comerciales |
| D13 | Adoptada en preparación | Una fuente AGENTS.md; skills canónicas .agents/skills; adaptadores Claude generados y comprobados | Compatibilidad documentada, sin instalar agentes ni dependencias |
| D14 | Restricción histórica de la preparación inicial | Las autorizaciones posteriores se registran por tarea; no implican permiso general para commit, push, merge o deploy | Se conserva el alcance original y sus excepciones explícitas en tareas; no se borran datos/volúmenes ni se instalan herramientas globales |
| D15 | Diferida por usuario, 30/09/2026 | Dejar pendiente revisión autenticada de demo y código remoto | Respuesta explícita al solicitar acceso seguro; retomar T08 con sesión de prueba, código autorizado o capturas/exportación, nunca contraseñas por chat |
| D16 | Adoptada en integración, 30/09/2026 | Integrar ZIP actualizado preservando trabajo local | Git ya modificado, docs y seis skills existentes; solo actualizar instrucciones/documentación, separar resultados históricos de verificaciones nuevas |
| D17 | Adoptada en preparación, 30/09/2026 | Reglas de trabajo siempre activas en el `AGENTS.md` raíz, con un `AGENTS.md` por carpeta técnica | `backend/AGENTS.md` y `backend/CLAUDE.md` nuevos para cerrar la asimetría con frontend; los archivos por carpeta complementan al raíz, no lo reemplazan |
| D18 | Adoptada, 13/10/2026 | Importación histórica idempotente por códigos de origen; no unir pedidos ni inventar DNI | `backend/src/import/importador.js`: clientes por `codigo_origen`, pedidos por `codigo`; los intentos de historial no se duplican por dirección/resultado/coordenadas. Reejecución probada contra MySQL |
| D19 | Adoptada, 13/10/2026 | Sesión MVP con token JWT en `localStorage` | Es simple para el MVP; cualquier script de la página podría leerlo. Se evalúa cookie `HttpOnly` en una etapa posterior |
| D20 | Adoptada, 13/10/2026 | Arnés de pruebas: `node:test` en backend y Vitest en frontend | Backend cubre auth, estados e importación; frontend cubre la capa API/sesión. No reemplaza pruebas end-to-end de navegador |
| D21 | Adoptada, 20/10/2026 | Provincias locales en el backend y localidades por Georef, sólo desde el servidor | `GET /api/provincias` devuelve las 24 jurisdicciones desde `constants/provincias.js`; `GET /api/localidades` (ADMINISTRADOR y OPERADOR) consulta Georef con `GEOREF_BASE_URL` y `GEOREF_TIMEOUT_MS`. Si el proveedor falla devuelve lista vacía; al guardar, la localidad no encontrada o no verificada es ADVERTENCIA, nunca ERROR. Barrios y localidades chicas pueden faltar en Georef: no se bloquea el despacho por esta advertencia |
| D22 | Adoptada localmente, 20/10/2026; confirmar catálogo con cliente | Canales de origen del MVP | WhatsApp, Instagram, correo electrónico, sistema externo y carga manual (predeterminado). Se guardan como texto en `pedidos.canal_origen`, sin FK; el backend valida el catálogo y el frontend muestra etiquetas. Se puede ampliar sin migración. |

Histórico corregido: AGENTS.md decía frontend scaffold y esquema inexistente; ambos estaban desactualizados. Se incorporó operador, se retiró la secuencia rígida de estados y la atribución definitiva de PAGADO al chofer. Se quitó el comando destructivo de volúmenes de la guía. Se conservaron simplicidad, explicación para defensa, tratamiento de errores externos y decisión humana en arquitectura.

D10: invalidar la confirmación tras editar dirección es un criterio técnico requerido por esta preparación; sigue pendiente cerrar el versionado y las garantías ante edición/confirmación concurrentes; el responsable y la acción ya se registran. La implementación actual, además, descarta latitud, longitud y nivel de confianza ante cualquier cambio relevante de la dirección, aunque no estuviera `CONFIRMADA`, y compara los valores normalizados para no invalidar por diferencias de escritura.

## Preparación y significado de “Bloqueado” · 28/10/2026

Conservamos la preparación interna EN STOCK → EN PREPARACIÓN aunque falte confirmar la dirección. “Bloqueado” se refiere a asignación y despacho. Preparar no asigna un chofer, no cambia a EN ENVÍO y no habilita la consulta de un envío al chofer. Para asignar exigimos dirección CONFIRMADA; para despachar exigimos además EN PREPARACIÓN y chofer activo. Las mismas reglas se validan en servidor. Benjamín ratificó mantener este comportamiento; no se modificó código en este acuerdo documental.

Reasignación y desasignación quedan limitadas a EN STOCK/EN PREPARACIÓN. Una dirección que pierde su confirmación permite quitar el chofer, pero no asignar uno nuevo ni despachar. La coordinación global Q01 continúa en KAN-37.

## D09 / B04 · entrega e intento fallido

Registramos entrega propia EN ENVÍO → ENTREGADO. Un intento fallido requiere motivo y vuelve a EN PREPARACIÓN, conservando chofer y dirección, con fecha y responsable en historial. Esta excepción no habilita retrocesos genéricos ni agrega estados. Un nuevo despacho vuelve a aplicar las restricciones de dirección y chofer.

Los borradores con problemas de dirección existen en EN STOCK y no obtienen geocodificación ni confirmación hasta corregirse. La aceptación del alcance completo de borradores/cancelación sigue en Q04; no equivale a aprobar cualquier dato incompleto.

## D04 / B05 · efectivo, transferencia y acreditación

En el módulo de Benjamín definimos e implementamos efectivo recibido por el chofer propio → PAGADO y transferencia informada → ENTREGADO hasta acreditación manual de un administrador activo → PAGADO. Operador y chofer no acreditan transferencias. No consultamos al banco ni presumimos una acreditación automática.

El servidor obtiene el monto del total del pedido. Pago, cambio de estado e historial se guardan atómicamente; la repetición equivalente no duplica cobro. Los comprobantes son opcionales y su ausencia se muestra independientemente de la acreditación. El chofer propio puede adjuntarlos después de acreditar. Evidencia y límites en [B05](entrega-b05.md). La coordinación Q02/KAN-38 del equipo sigue pendiente y no se cierra con esta actualización.

## D23 · importe, recargo y próxima visita

Usamos ARS, importe base positivo con hasta dos decimales, cálculo exacto en centavos y límites de DECIMAL(12,2). La tarifa por km sólo la modifica un administrador y no recalcula pedidos existentes. La sugerencia por sucursal/distancia corresponde al trabajo separado KAN-49, no al alcance ya cerrado de B07.

El apartado Caso 7 del giro de requisitos exige un recargo del 50 % del costo base, facturable al emisor, y visita en la jornada posterior. Implementamos cada intento nuevo como la mitad del base original, sin capitalización, redondeando medio centavo hacia arriba. Una repetición de la misma operación no suma ni reprograma otra vez. Estado, costos, próxima visita e historial se guardan en una transacción.

Proponemos como próxima visita el día calendario siguiente de Buenos Aires; calendario hábil/feriados sigue sin definición. Conservamos el despacho manual anticipado acordado en el módulo: la fecha sugerida no bloquea al operador, pero sí siguen vigentes preparación, dirección confirmada y chofer activo. Esto reemplaza el bloqueo por fecha del primer corte de B07. Evidencia y recuperación en [B07](entrega-b07.md); la conformidad global con la interpretación de jornada se mantiene para la revisión del equipo/docentes.

## Recuperación de importe antiguo sin pago

Administrador/operador puede completar una base NULL una sola vez si el pedido no está PAGADO y no tiene pago registrado, incluso si está ENTREGADO. Conservamos estado y bases previas, recalculamos los recargos pendientes de los intentos registrados y dejamos auditoría bajo bloqueo transaccional. El chofer no fija el monto. No inventamos cero ni modificamos pagos anteriores.

## Pendientes registrados · 28/10/2026

- [KAN-51](https://benjabb2005.atlassian.net/browse/KAN-51) / [GitHub #56](https://github.com/Benjabb2005/Practicas-Pre-Profesionales-1-Grupo-9/issues/56): formato de horas 00–23 en historial y vista del chofer; defecto registrado, sin implementar en esta revisión.
- KAN-50: previsualización dinámica de ubicación antes de guardar; tarea compartida de carga/mapa/validación, sin implementar en esta revisión.
- X04/KAN-44: prueba cruzada de Benjamín sobre el núcleo de Santiago, separada de B06.
- Q01–Q04: coordinación y decisiones de equipo según sus responsables; esta documentación no altera sus estados.

## Alta con ubicación verificable · 30/10
Pedido explícito posterior: no guardar un pedido con ubicación inexistente. Sustituye para altas nuevas el comportamiento de borrador admitido antes: rechazar errores estructurales/localidad inexistente y exigir resultado geográfico OK/APPROXIMATE con coordenadas válidas antes de INSERT. Fallo/timeout/cuota o respuesta sin punto:503, sin guardar pedido y con reintento. No equiparar coincidencia aproximada a existencia física garantizada; sigue requiriendo revisión y confirmación humana antes de despacho. Pedidos anteriores no se borran ni migran. Edición/revisión existente no cambia en esta tarea. Pruebas sin proveedor real ni escritura sobre base poblada.
