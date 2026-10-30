# B05 · cierre de pago · 26/10/2026

## Lectura vigente · 28/10/2026

Esta entrega forma parte del módulo de Benjamín publicado en `feature/benjamin-asignacion-entregas`. B01–B07 están finalizados en Jira; esto no acredita merge a `MVP-1`, ensayo físico de celular ni la prueba cruzada X04. Los apartados fechados de abajo conservan la evolución y las verificaciones de cada corte: sus estados de tablero, “sin commit/push” y restricciones luego reemplazadas son históricos. Para el comportamiento actual usamos [decisiones](decisiones.md) y [verificación B06](entrega-b06.md).

El chofer registra efectivo recibido → PAGADO o informa transferencia → ENTREGADO hasta acreditación manual de administrador activo. El importe proviene del servidor. Acreditar transferencia está en la tarjeta de Asignaciones, con confirmación; Más información es de consulta. Los comprobantes son opcionales, privados, JPG/PNG/WEBP/PDF de hasta 5 MB; el chofer propio puede adjuntarlos también después de acreditar. La vista previa PDF usa PDF.js. Un fallo de subida no duplica ni revierte el pago. Los pedidos antiguos sin base pueden completarse una sola vez por administrador/operador si no están PAGADOS y no tienen pago. Q02 sigue siendo un acuerdo del equipo pendiente, distinto del cierre técnico de B05.

## Registro histórico de la entrega

Registramos la autorización de Benjamín para publicar B07 y avanzar con lo pendiente de B05 tras propuesta efectivo confirmado por chofer → PAGADO / transferencia informada → acreditación admin → PAGADO. B07 publicada62c199d943e2529ba00c41b9de7437b418605e5e (#53/KAN-48); esta entrega B05 (#39/KAN-35) es posterior y permanece local sin commit/push.

## Comportamiento

EntregaRepository.pago guarda efectivo propio ya entregado y actualiza PAGADO en la misma transacción con el historial (actor/fecha). Transferencia guarda registro, conserva ENTREGADO; no se consulta banco ni se presume acreditación. Monto siempre total del servidor. Repetición del mismo método devuelve registro sin nueva escritura, método distinto409. Pedido importado PAGADO sin registro no permite crear un nuevo cobro a ciegas.

PUT /api/asignaciones/:id/acreditar-pago, cuerpo vacío estricto, sólo admin activo: bloqueo de pedido/usuario/pago, transferencia existente, transición compartida EstadoPedidoService, historial con autor/fecha. Repetido en PAGADO es idempotente, no duplica. Operador/chofer403 y monto/estado enviado400. Sin nueva migración: tablas existentes.

Chofer: panel aclara confirmar efectivo recibido o informar transferencia, total sólo lectura. Aviso y tarjetas muestran PAGADO/confirmado o pendiente de acreditación. Admin: Asignaciones → Más información → Pago → Acreditar transferencia, seguido de confirmación explícita de verificación. Actualiza detalle, lista e historial sin recargar página. Operador sólo consulta. PedidoRepository incorpora método/monto/fecha a detalle/listado, sin alterar datos originales del pago.

## Verificación

- Backend190 pasan,2MySQL opt-in omitidas en suite. Nuevos casos de efectivo atómico/idempotente/rollback, acreditación sólo admin activo, transferencia/estado válidos, HTTP401/403/400 y reintento. Sintaxis OK.
- MySQL real en contenedor de pruebas previo mandatodo_test_b07/base mandatodo_test_entregas: prueba opt-in ejecutada aparte y pasa. Incluye despacho manual antes de fecha, recargos, transferencia concurrente, rechazo chofer, acreditación concurrente única, rollback real de acreditación ante fallo de historial, efectivo concurrente a PAGADO, un pago por pedido. Sin tocar pagos de desarrollo.
- Frontend59 pruebas pasan, lint/build pasan. Dos casos nuevos de control admin/operador, estado confirmado sin botón y panel efectivo sin monto editable. Advertencia bundle grande preexistente.
- Navegador StrictMode con datos sintéticos360×800 oscuro/claro: operador sin botón, admin pide confirmación, primer fallo de conexión conserva formulario, reintento muestra PAGADO y quita botón. Efectivo avisa estado final, Guardar devuelve PAGADO; transferencia muestra aviso pendiente, Escape funciona. Documento360px sin desborde. Capturas ignoradas temp/b05-acreditado-oscuro.png y b05-transferencia-claro.png. Harness retirado. No se acreditaron pagos reales ni se probó banco/celular físico o recorrido UI+MySQL conjunto.
- Check raíz conserva fallo previo de copia Claude ppp1-mvp1, no se modifica por B05. git diff --check OK.

Jira KAN-35 En revisión/GitHub #39 En progreso (sin revisión). Q02/KAN-38 de Santiago recibe contexto de regla aplicada sin cerrar ni atribuir trabajo del compañero. B07 Finalizado/Hecho publicado y enlace al commit en ambos. B05 local para revisión, sin commit/push.

## Acción visible y comprobantes B05 (26/10/2026)
Definimos para el módulo de Benjamín sacar acreditación de Más información y permitir al chofer foto/archivo. Botón Acreditar transferencia en tarjeta admin, confirmación con comprobantes; Más información pago sólo lectura. Chofer adjunta opcionalmente al informar transferencia o luego en Entregados. JPG/PNG/WEBP/PDF5MB, validación real/tamaño/extensión/nombre en servidor; binario privado en tabla comprobantes_pago, sin dependencias ni enlaces públicos. Admin y chofer propio consultan, operador no; sólo chofer propio pendiente sube. SHA256 único por pago evita duplicado, conserva adjuntos previos; PDF descarga autenticada e imagen interna. Pago y carga separados: error de carga permite reintentar sin duplicar pago.
Migración003 ensayada con respaldo restaurado aislado y conservación de pagos verificada; aplicada local y runner sin pendientes. Respaldo ignorado temp/respaldo-antes-comprobantes.sql, no publicar. MySQL/HTTP real aislado pasa bytes exactos, concurrencia/hash, permisos ajeno/operador, acreditación y rechazo nueva carga posterior. Backend193 pasan/3opt-in omitidas en suite; frontend61, lint/build/sintaxis OK. UI sintética StrictMode360: botón tarjeta, galería con PNG sintético, subida/lista/imagen, admin acredita y desaparece acción; no desborde. Harness retirado, sin comprobantes/pagos reales modificados. Límite5MB por archivo y formatos indicados, archivos en DB aumentan tamaño de respaldos; no antivirus ni banco. Sin commit/push, ambos tickets actualizados y B05 sigue En revisión/En progreso.

## Comprobante opcional y pendiente visible (26/10/2026)
Definimos para el módulo de Benjamín mantener comprobante opcional y marcar pendiente de subir si falta. Selector aclara opcional, sin required; transferencias muestran Comprobante pendiente de subir en chofer, tarjeta admin y detalle hasta contar un adjunto real. El conteo viene de DB, no estado local. Al subir cambia a adjuntado y refresca listado del chofer. Pendiente independiente de acreditación: se permite al dueño adjuntar también en PAGADO, sin cambiar pago; supera restricción anterior de subida sólo antes de acreditar. No aplica efectivo. Backend193/3opt-in omitidas y frontend62, lint/build pasan. Se ajustó prueba antigua que confundía WHERE interno de conteo con filtro de listado. MySQL/HTTP aislado prueba conteos0→1 en chofer/admin/detalle y adjunto posterior a acreditación. Sin migración nueva ni commit/push.

## Asignaciones sin finalizados (26/10/2026)
Definimos para el módulo de Benjamín limpiar Asignar choferes. Filtro de presentación conserva EN STOCK/EN PREPARACIÓN/EN ENVÍO y ENTREGADO sólo con transferencia pendiente de acreditar; oculta PAGADO y otros entregados. Así admin aún puede acreditar desde botón directo y al confirmar desaparece de la lista. Datos completos siguen en Tablero/chofer. Resumen y paginado se calculan sobre lista activa, sin borrar datos ni cambiar API. Frontend63, lint/build pasan; prueba de regresión con estados mezclados. Sin commit/push.

## Vista previa del comprobante (26/10/2026)
Definimos para el módulo de Benjamín preview. ComprobantesPedido abre imágenes/PDF dentro del panel (antes PDF sólo descargaba). PreviewComprobante reutilizable muestra nombre, imagen o visor PDF nativo, cierre y descarga; fallback de descarga para navegadores sin PDF embebido. SelectorComprobante muestra preview local al elegir antes de subir. URLs blob locales revocadas al cambiar/cerrar/desmontar, sin publicar archivos ni alterar permisos. Frontend64, lint/build pasan; pruebas de render imagen/PDF y descarga. Sin nueva revisión visual del visor PDF nativo en esta corrección; soporte depende del navegador. Sin commit/push.

### PDF visible (26/10)
Se comprobó que el visor PDF nativo quedaba blanco. Se reemplazó por PDF.js con worker local y carga dinámica, páginas navegables y descarga. Primer adjunto se abre automáticamente; MIME normalizado y respuestas obsoletas descartadas. Verificado con PDF real sin modificar datos, escritorio/360px. Docker lint/64 tests/build pasan; auditoría producción0. Sin commit/push.

### Vistas del chofer
En envío separado de Entregados con gestión pendiente e Historial de completos. Efectivo PAGADO completo; transferencia PAGADO con adjunto completo. Sin acreditar o sin adjunto permanece en Entregados. Indicadores de color y texto bajo título detallan ambos pendientes. Búsqueda/conteo/paginación por vista, permisos intactos. Docker65 pruebas/lint/build pasan; revisión visual sintética escritorio/360 claro/oscuro. Sin commit/push.

### Cierre para publicación
Autorizado26/10. Incluye colores distintos para registro/acreditación, historial completo separado, preview independiente de subida y recuperación de importeNULL en entregado sin pago por operador/admin. Resumen vigente backend195/3opt-in omitidas, frontend66, lint/build/sintaxis host OK. La nueva recuperación usa prueba transaccional con adaptador, no nueva integración MySQL; pagos/comprobantes sí ensayados previamente en MySQL aislado. Requiere migración003 para otras instalaciones. Publicación con refs #39/KAN-35, sin temporales/datos privados, Docker se detiene sin borrar volumen al finalizar.
