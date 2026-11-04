# B05 · cierre del pago

## Ajuste pedido26/10: acción visible y comprobante

La acreditación sale de Más información: botón Acreditar transferencia directamente en tarjeta de Asignaciones, sólo admin y transferencia pendiente. Abre confirmación con comprobantes; Más información conserva pago sólo lectura. Ver comprobantes visible en tarjeta admin; chofer adjunta al informar transferencia o luego desde Entregados → Adjuntar/ver comprobante. Adjunto opcional, su fallo no duplica ni revierte pago. JPG/PNG/WEBP/PDF5MB máximo, binario validado en servidor por contenido/extensión/nombre/tamaño. Archivos privados persistidos en MySQL003, sin publicar URL estática ni dependencias nuevas. Admin y chofer propio consultan, operador no; sólo chofer propio sube antes de acreditar. Mismo contenido repetido no agrega fila; adjuntos anteriores se conservan. Lista paginada10, imagen interna y PDF descargable con sesión. Sin acreditar automáticamente por adjuntar una imagen.

26/10/2026: Benjamín pide avanzar con lo pendiente tras la propuesta efectivo al confirmar cobro / transferencia informada hasta acreditación admin. Registrar efectivo de pedido propio ENTREGADO guarda pago, pasa a PAGADO e historial atómicamente. Transferencia guarda informe, conserva ENTREGADO; sólo admin activo puede acreditar después de comprobarla fuera del sistema. UI no consulta banco ni presume acreditación. Q02 se documenta con esta regla sin cerrar el ticket de otro integrante automáticamente.

PUT /api/asignaciones/:id/acreditar-pago, cuerpo vacío estricto, sólo ADMINISTRADOR: pedido ENTREGADO y transferencia registrada; idempotente si ya PAGADO. Identidad desde JWT, bloqueo de pedido/usuario/pago, transición compartida e historial con autor/fecha. Chofer/operador no pueden acreditar transferencias. Pago previo no se sobrescribe y doble click/reintento no duplica ni pago ni historial. Sin nueva migración: pagos e historial_estados existentes conservan datos originales.

Chofer ve efectivo confirmado y PAGADO o transferencia pendiente de acreditación. Panel de método muestra total y efecto del guardado; guardado no es ejecución de transferencia. Admin: Asignaciones → Más información → registro de pago con método/monto, confirmación explícita y Acreditar transferencia. Error/reintento, controles ocupados y estado actualizado en lista/detalle/historial. Operador consulta sin botón. Claro/oscuro y móvil.

Pruebas éxito, rol/usuario inactivo, falta pago, método diferente, estado inválido, reintentos concurrentes y rollback real MySQL separado. No acreditar pagos reales durante pruebas; fixtures sólo en DB aislada.

## Comprobante opcional y pendiente visible (26/10/2026)
Benjamín pide mantener comprobante opcional y marcar pendiente de subir si falta. Selector aclara opcional, sin required; transferencias muestran Comprobante pendiente de subir en chofer, tarjeta admin y detalle hasta contar un adjunto real. El conteo viene de DB, no estado local. Al subir cambia a adjuntado y refresca listado del chofer. Pendiente independiente de acreditación: se permite al dueño adjuntar también en PAGADO, sin cambiar pago; supera restricción anterior de subida sólo antes de acreditar. No aplica efectivo. Backend193/3opt-in omitidas y frontend62, lint/build pasan. Se ajustó prueba antigua que confundía WHERE interno de conteo con filtro de listado. MySQL/HTTP aislado prueba conteos0→1 en chofer/admin/detalle y adjunto posterior a acreditación. Sin migración nueva ni commit/push.

## Asignaciones sin finalizados (26/10/2026)
Benjamín pide limpiar Asignar choferes. Filtro de presentación conserva EN STOCK/EN PREPARACIÓN/EN ENVÍO y ENTREGADO sólo con transferencia pendiente de acreditar; oculta PAGADO y otros entregados. Así admin aún puede acreditar desde botón directo y al confirmar desaparece de la lista. Datos completos siguen en Tablero/chofer. Resumen y paginado se calculan sobre lista activa, sin borrar datos ni cambiar API. Frontend63, lint/build pasan; prueba de regresión con estados mezclados. Sin commit/push.

## Vista previa del comprobante (26/10/2026)
Benjamín pide preview. ComprobantesPedido abre imágenes/PDF dentro del panel (antes PDF sólo descargaba). PreviewComprobante reutilizable muestra nombre, imagen o visor PDF nativo, cierre y descarga; fallback de descarga para navegadores sin PDF embebido. SelectorComprobante muestra preview local al elegir antes de subir. URLs blob locales revocadas al cambiar/cerrar/desmontar, sin publicar archivos ni alterar permisos. Frontend64, lint/build pasan; pruebas de render imagen/PDF y descarga. Sin nueva revisión visual del visor PDF nativo en esta corrección; soporte depende del navegador. Sin commit/push.

### Corrección de preview
Al abrir comprobantes se muestra automáticamente el primero. PDF renderizado localmente con PDF.js, carga/error, páginas anterior/siguiente y descarga; no depende del plugin PDF del navegador. Se conserva vista previa de imágenes. Verificado escritorio y360px.

### Separación de entregas del chofer (26/10/2026)
Tres vistas: En envío; Entregados con gestión pendiente; Historial de finalizados. Finalizado = PAGADO y, si transferencia, al menos un comprobante persistido; efectivo no requiere adjunto. Transferencia acreditada sin adjunto sigue en Entregados para poder completarla. Chips con texto/color distinguen entrega, pago por registrar/confirmar/confirmado y comprobante faltante/adjunto. Listado, búsqueda, conteo y paginado10 se calculan sobre la vista elegida, con carga/error/vacío específicos. No modifica estados ni permisos/API. Al adjuntar se reclasifica tras refrescar servidor. Claro/oscuro y móvil.

Registro pendiente ámbar, acreditación pendiente violeta con texto Esperando acreditación de administración, confirmado verde. El chofer sólo consulta el estado de acreditación, no recibe acción para acreditarla. Permiso vigente ADMINISTRADOR conservado; habilitación a OPERADOR no aprobada en este ajuste.

### Recuperación de botones
Descargar preview no bloquea elegir ni subir otro archivo. Adjuntar requiere archivo válido y explica ausencia; sólo guardado real muestra espera. Pago sin importe indica Falta cargar el importe. Admin/operador puede completar baseNULL de entregado sin pago desde Asignaciones/Más información; estado no cambia. No admite modificar base existente, PAGADO ni pedido con pago registrado. El chofer actualiza su lista luego de esa corrección.
