# Nueva experiencia web · primera implementación · 30/10/2026

## Base y autorización
Rama `feature/nueva-experiencia-web`, creada por pedido del usuario sobre `origin/MVP-1` d9c9108. Se incorporaron siete commits por fast-forward desde 70b09ea. La documentación local se guardó temporalmente en stash y se restauró; el único conflicto, tareas.md, conserva tanto el apartado remoto de sucursal como la continuidad local. El stash y un parche ignorado quedan como respaldo, sin commit/push.

Referencia: [propuesta Figma aprobada](https://www.figma.com/design/YT7P6DkBYVTl62QIXFG4iB/MandaTodo?node-id=124-6), página 123:2. Figma bloqueó get_design_context por cuota; el usuario autorizó explícitamente implementar con el diseño y las capturas existentes. Spec: [nueva-experiencia](../frontend/specs/nueva-experiencia.md).

## Cambios de producto
- AppNavigation reemplaza la barra lateral por navegación superior responsive. Conserva las rutas y accesos por rol, salida, tema y Rutas deshabilitado. App conserva intactas las guardas.
- Experience.css adapta tamaños reales con grid/flex, sin escalado global. Unifica tablero, carga/revisión, clientes/usuarios, asignaciones/configuración y chofer; conserva claro/oscuro, tablas desplazables y formularios completos.
- El tablero conserva consultas/filtros/paginado y muestra pendientes calculados de la respuesta real, con accesos a revisión y asignaciones. No se agrega actividad ficticia.
- La carga muestra progreso derivado de pedido/confirmación y ProcesoCarga mientras las solicitudes están pendientes. No se inventa porcentaje, éxito, latencia mínima ni persistencia. Se preserva guardar borrador antes de geocodificar, importe sugerido, duplicados, candidatos, advertencias y confirmación humana. El estado vivo de carga queda fuera de la región aria-busy del formulario.
- El chofer mantiene búsqueda, vistas, paginado, contacto/mapa, entrega/fallo, recargos, pagos, comprobantes e historial con una presentación renovada.
- No se implementan PDF de pedido/mapa ni mapa previo al guardado: siguen siendo funcionalidades separadas, no botones simulados.

## Verificación realizada
- `npm run check`: contexto/skills, sintaxis y backend pasan; 211 pruebas backend aprobadas, 4 MySQL opt-in omitidas; lint/build frontend pasan. Las integraciones MySQL opt-in no se reejecutaron como parte del rediseño.
- Frontend: 79 pruebas aprobadas en 19 archivos; tres nuevas comprueban accesos conservados por rol y carga sin progreso/éxito inventados. Lint/build pasan; advertencia previa de bundle mayor a 500 kB.
- Navegador integrado con harness temporal y datos sintéticos: tablero poblado, filtros/limpieza, error y vacío, carga con frecuente/dirección, solicitud pendiente y confirmación exitosa; accesos a clientes, usuarios, configuración, asignaciones y revisión. Chofer: entrega/fallo/historial, mapa y Escape, pago y pestañas. No se mutaron pedidos reales.
- Vistas revisadas en 1440×1000, 360×800 y 320×740, claro/oscuro. Se corrigió un desborde móvil causado por una etiqueta accesible absoluta dentro de la tabla; después scrollWidth=clientWidth (345 px a 360, 305 px a 320). Carga conserva 14 controles de datos en el caso revisado. Movimiento reducido respeta prefers-reduced-motion mediante CSS; no se verificó con preferencia del sistema activada.
- Se intentó Brave; su automatización falló al navegar/leer una ventana minimizada. Se continuó con el navegador integrado. El harness se retiró del código servido al terminar; copia/evidencia sintética ignorada en temp.

## Docker y migración autorizada
`docker compose config --quiet` y `up -d --build` ejecutados; frontend/backend activos y MySQL healthy. Health HTTP 200 con db/http ok. Se mantienen datos y volúmenes.

Se detectó que la base tenía 001–003 y faltaba 004_sucursal_envio.sql, necesaria para la actualización remota. Con autorización explícita se generó un dump completo (302549 bytes), con terminación y tabla de tarifas verificadas, en temp/backup-antes-004-20261030.sql; archivo ignorado, no publicar. Se aplicó sólo 004 por runner versionado: siete columnas opcionales, sin borrar registros. No se ensayó restauración del respaldo en esta tarea.

Después: login real de administrador/operador/chofer HTTP 200. Consultas de pedidos/clientes/asignaciones y usuarios/tarifas según rol devuelven 200; operador /usuarios y chofer /pedidos devuelven 403. GET /tarifas permite consulta al operador por contrato existente; la pantalla de configuración sigue restringida a administrador. Verificación HTTP de lectura, sin acreditar entrega/pago ni crear clientes/pedidos de desarrollo.

## Límites
Primera implementación para revisión, no publicación. PDF.js/archivo físico y recorrido completo con escritura HTTP/MySQL no se repitieron; sus componentes/servicios y pruebas existentes se conservaron. El mapa real sigue siendo Leaflet/OpenStreetMap, no el dibujo ilustrativo de Figma. La tabla y el formulario mantienen más datos que la maqueta para no perder funcionalidades. Compose conserva aviso previo de DUPLICADOS_VENTANA_HORAS ausente y dependencias/bundle pendientes previamente informados.

## Evidencia local sintética
[Tablero](../temp/redisenio-tablero.png), [carga](../temp/redisenio-carga.png), [carga animada](../temp/redisenio-carga-animada.png), [chofer móvil](../temp/redisenio-chofer-movil.png). Capturas ignoradas, no necesarias para arrancar la aplicación.

## Ajuste posterior a capturas · 30/10/2026
Se corrigieron superposiciones de estilos en filtros y buscadores, contraste de etiquetas/pasos y separación de la tarjeta de acciones. Chofer compacto con máximo460px y botones de al menos44px. Por pedido posterior del usuario, crear pedido ahora sostiene la carga exitosa al menos1,2s; sustituye el criterio inicial sin duración mínima, sin retrasar la solicitud ni los errores. Pruebas con reloj falso de rapidez/lentitud/error: frontend82 aprobadas, lint/build OK. Revisión sintética en1280/360/320 claro/oscuro, sin desbordes móviles y con guardado/confirmación; sin modificar datos reales. Ver tareas.md para detalle/evidencia. Sin commit/push.

### Preparación y despacho · 30/10
Aviso de duplicados con contraste específico en ambos temas y cabecera clara igual al fondo. Último paso de carga ejecuta preparación real mediante la API existente tras confirmar ubicación; éxito cambia etiqueta a En preparación. Guardado y despacho mantienen presentación exitosa2500ms; despacho muestra animación dentro del diálogo de confirmación, antes del éxito real. Pruebas sintéticas de preparación y despacho revisadas;82 pruebas frontend/lint/build pasan. Sin mutaciones reales de pedidos. Este ajuste reemplaza el mínimo anterior de1200ms.

### Detalle, actividad y confirmación · 30/10
El listado abre el nuevo detalle /pedidos/:id con resumen/mapa/historial y pestañas geográfica y pagos; revisión conserva su ruta y funciones. Chofer agrega resumen de vista y detalle propio para pendientes y finalizados. Actividad reciente muestra hasta6 altas/cambios de los últimos8 pedidos consultados por fecha disponible, con alcance visible y aviso si faltan historiales. No es auditoría global.
Guardado muestra paquete en recorrido, barra indeterminada y luego diálogo con código real; continuar a revisar ubicación o abrir detalle. Carga mantiene2500ms en éxito y error inmediato. Movimiento reducido se respeta; botón Reproducir animación permite elección explícita recordada localmente. Sin falsa confirmación de ubicación, ETA ni ruta optimizada. Figma mantiene límite de cuota: adaptación desde referencias ya aprobadas, sin verificación nueva de tracks/píxel exacto.
Pruebas frontend88 aprobadas. Verificación sintética en navegador: detalle claro/oscuro, actividad vacía/parcial/actualización, error sin éxito, guardado→confirmación→detalle, chofer360/320 y propios finalizados. Grilla de detalle320 corregida para no desbordar. No se mutaron pedidos reales. Registro y evidencia en tareas.md.

### Ajuste tras revisar Figma en Brave · 30/10
Referencia visual actual verificada desde sesión autenticada del navegador (sin editar diseño); MCP mantiene cuota. Actividad lateral compacta con3 eventos reales y confirmación geográfica registrada; chofer con resumen marino3 columnas, mapa de primera tarjeta, contacto, datos/búsqueda desplegables y navegación inferior funcional. Más información de Asignaciones abre el mismo detalle: resumen destino/chofer/importe e historial con horas, alta/ubicación/estados conservando fuentes y paginación. Carga con tarjeta blanca sobre marino y marca M, reproducción automática/pausa local, recorrido2800ms y mínimo exitoso3600ms al guardar/despachar; sustituye preferencia persistida anterior y mínimo2500. Errores inmediatos, éxito real y confirmación humana posterior conservados.90 pruebas frontend aprobadas y verificación sintética escritorio/móvil; detalle de evidencia/límites en tareas.md. Sin datos reales mutados ni PDF/optimización ficticios.

Cierre de revisión: copias de prueba retiradas;90 pruebas frontend y check raíz pasan (211 backend/4 MySQL opt-in omitidas). Docker activo, MySQL healthy, health http/db ok y frontend200. Detalle comprobado también1440x1000 en ambos temas. Sin commit/push ni escritura de pedidos reales.

## Pendientes de revisión del usuario · 30/10/2026
Los siguientes dos cambios están implementados y se incluyen en esta rama, pero todavía NO fueron revisados ni aprobados funcionalmente por el usuario:
- Aviso específico de dirección: conservar el diagnóstico de piso/departamento u otros datos mezclados dentro de Calle, junto al motivo de rechazo del alta.
- Nuevo pedido: destacar Preparar pedido sólo cuando se habilita y mostrar Asignar chofer después de preparar, con acceso a /asignaciones.
Las verificaciones técnicas registradas no sustituyen esa revisión. Se mantienen activos para que puedan probarse.
