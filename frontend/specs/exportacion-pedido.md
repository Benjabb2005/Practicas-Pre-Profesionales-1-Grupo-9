# KAN-52 · Exportar información y mapa por separado

Alcance corregido por Benjamín: Descargar información PDF contiene únicamente
lo visible en Más información: los doce campos del detalle, importes/próxima
visita cuando corresponden, pago/estado del comprobante y el historial de estados
que muestra ese panel. Se exportan todos esos movimientos, sin limitarse a la
página visible. No agrega mapa, historial geográfico, dirección original, chofer,
fechas de creación/exportación, coordenadas ni metadatos adicionales.
Los campos del detalle tienen una fuente común con el panel para evitar divergencias.

Descargar mapa PDF contiene únicamente dirección e imagen del mapa. La atribución
OSM forma parte de la imagen; no hay encabezado con ID/código, fechas, coordenadas,
estados, cliente, historial ni pie de página. El ID y la fecha se conservan sólo en
el nombre del archivo. Sin coordenadas o fallo de imagen se informa el problema y
no se descarga un mapa vacío. Descargar información no consulta teselas ni depende
del proveedor del mapa.

Se conservan las ubicaciones de los botones, la consulta fresca al endpoint de
lectura y los permisos existentes (administrador/operador; chofer sólo pedido propio).
La imagen sólo se obtiene al descargar mapa, con caché normal y Referer. jsPDF se
carga dinámicamente; no hay cambio de esquema ni escritura de pedidos. Acciones
bloqueadas mientras genera, errores con reintento y botones adaptables a móvil.
Validación visual y prueba conjunta quedan pendientes por decisión del usuario.

Referencias: [jsPDF](https://parallax.github.io/jsPDF/docs/),
[teselas OSM](https://operations.osmfoundation.org/policies/tiles/).
