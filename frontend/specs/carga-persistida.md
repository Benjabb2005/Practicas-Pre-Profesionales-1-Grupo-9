# Carga persistida: corte inicial T04

Fecha: 13/10/2026. Admin/operador cargan y consultan pedidos completos. Campos obligatorios acordados: nombre, apellido, DNI, teléfono, email, calle, altura positiva, localidad, provincia y CP. Piso/Depto y notas opcionales. No guardar borradores incompletos. Mantener el estilo existente y separar las llamadas API.

Flujo: seleccionar frecuente mediante búsqueda explícita o cargar datos de cliente; completar dirección; guardar; ver pedido en tablero y detalle tras recargar. No modificar un frecuente silenciosamente: discrepancia rechazada. Coincidencia en DNI/email/teléfono impide crear otra persona: aviso al salir del campo y selección del frecuente. No hay opción de registrar aparte ni bandera API de excepción. Teléfono compara dígitos; email ignora espacios externos/mayúsculas. El mismo cliente puede tener varios pedidos. No hay ABM Clientes (MVP 2).

El guardado usa transacción cliente/dirección/pedido/historial y clave idempotente por envío. Una petición repetida no genera otro pedido; clave con contenido diferente devuelve conflicto. Dirección original se conserva. Estado inicial pendiente_validacion; guardar no confirma ubicación ni habilita despacho.

API inicial: GET/POST /api/pedidos, GET /api/pedidos/:id y GET /api/clientes/frecuentes?q=. Roles admitidos admin/operador. La creación no admite estado, score ni confirmación enviados por la UI. Históricos incompletos no se borran ni se convierten automáticamente en pedidos nuevos válidos.

Estados UI: cargando, sin registros, guardando, guardado, error de validación/red/duplicado y sesión vencida. Mantener valores tras error, impedir doble envío y mostrar éxito solo tras respuesta. Tablero lista pedidos reales; filtros por estado y fechas, indicadores a partir del mismo conjunto visible. Detalle muestra datos, original y estado geográfico pendiente.

Aceptación: campos faltantes/altura cero rechazados también por API; usuario sin sesión rechazado; repetición no duplica; caída de transacción no deja cliente/dirección huérfanos; guardado seguido de recarga mantiene pedido; búsqueda frecuente no modifica cliente; móvil/teclado utilizables. Mapa, confirmación, edición y despacho todavía pendientes de T05; mostrar ese límite.

Ajuste visual pedido el 13/10: escritorio con controles de 30 px, áreas de texto de 52 px y bloques compactos; email ocupa fila completa y dirección usa columnas proporcionadas. Eliminado el escalado global de 1,5 en escritorio; tamaños CSS directos. Móvil mantiene controles de 36 px y columnas adaptadas, sin desborde global. No cambian campos obligatorios, contratos ni guardado.

Búsqueda en vivo solicitada posteriormente: filtrar desde el primer carácter de DNI/email/teléfono, sin pulsar Buscar. Espera breve de 250 ms, cancela consultas anteriores y muestra solo resultados del texto actual. Lista acotada a 20, con nombre, DNI, email/teléfono; carga, sin resultados y error visibles. Coincidencias exactas primero; teléfono sin separadores. Seleccionar explícitamente completa datos y cierra lista, sin alterar cliente. Enter en búsqueda no guarda pedido. Búsqueda vacía no consulta toda la base. Bloqueo de identidad duplicada permanece.
