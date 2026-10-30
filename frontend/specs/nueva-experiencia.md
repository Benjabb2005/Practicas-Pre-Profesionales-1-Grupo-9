# Nueva experiencia MandáTodo

## Objetivo y referencia
Implementar la propuesta aprobada de Figma, página «03 · Nueva experiencia · Propuesta» (YT7P6DkBYVTl62QIXFG4iB), sobre MVP-1 d9c9108. El usuario autorizó usar las capturas y el diseño ya creado porque Figma bloquea get_design_context por cuota. Primera entrega: navegación superior, tablero, formularios, revisión, administración, chofer y estados de carga con la misma paleta.

## Límite funcional
Conservar rutas, servicios, campos, permisos, reglas y acciones existentes. El código real prevalece frente a los datos ficticios del prototipo: guardar borrador precede a geocodificar/confirmar; no se agrega mapa dinámico antes de guardar, exportación PDF ni actividad inventada. Conservar configuración de sucursal y sugerencia de importe recién integradas, tema oscuro, paginado, duplicados, reintentos y todos los paneles del chofer.

## Inventario que debe mantenerse
- Administrador/operador: filtros por estado/cliente/fechas, listado paginado y revisión; frecuentes/alta de cliente, dirección completa, canal, importe, observaciones, duplicados; candidatos, confirmación humana, rechazo/corrección e historiales; asignar, preparar, despachar, reasignar/quitar chofer y detalle/mapa; clientes CRUD.
- Administrador: usuarios CRUD y configuración de sucursal/tarifa.
- Chofer: pedidos propios, búsqueda, paginado, mapa/contacto, entrega/fallo, recargo, pago efectivo/transferencia, comprobantes privados con visor/descarga, historial y pendientes. Mantener aislamiento y acreditación administrativa.
- Todos: login, sesión, salida, tema claro/oscuro y accesibilidad de teclado.

## Aceptación
- Navegación superior responsive con todas las rutas autorizadas visibles; sin escalado global con transform/zoom. Tablero usa métricas y pedidos reales.
- Tarjetas claras, azul/marino, jerarquía tipográfica, formularios y tablas legibles. Móvil desde 320/360 px, escritorio 1440 px; tablas con scroll interno y controles alcanzables.
- Durante operaciones reales, mostrar carga animada con texto específico; nunca simular porcentaje ni éxito u ocultar errores. Reproducción automática pedida por el usuario, con pausa explícita por pantalla. Ajuste pedido el 30/10: al crear un pedido, sostener la presentación al menos 3600 ms si la respuesta es exitosa; la solicitud empieza inmediatamente, los errores no esperan y una respuesta lenta no agrega otra pausa.
- Fallos conservan datos y reintentos existentes; vacío, sesión expirada y éxito siguen accesibles. No se cambian contratos ni se hacen migraciones sobre desarrollo como parte del diseño.
- Ejecutar pruebas frontend y check raíz; verificar visualmente escritorio/móvil/claro/oscuro con datos sintéticos y registrar límites. No atribuir a una compilación la verificación de persistencia real.

## Ajuste de preparación y despacho · 30/10
- Aviso de duplicados legible en ambos temas y cabecera del mismo fondo que la página en claro.
- El tercer paso es un botón: sólo habilitado con pedido EN STOCK confirmado y sin operación pendiente; persiste EN PREPARACIÓN por la API vigente, conserva errores y evita reenvío tras éxito.
- Guardado y despacho sostienen carga exitosa 3600 ms. El despacho anima el camión dentro del diálogo, conserva confirmación previa y sólo anuncia EN ENVÍO tras respuesta real. No representa seguimiento geográfico real. Errores inmediatos.

## Completar adaptación de la propuesta · 30/10
Usuario solicita mayor fidelidad en chofer, detalle, actividad y guardado. Con cuota Figma aún agotada se conserva autorización previa para referencia aprobada.
- Detalle dedicado /pedidos/:id: cabecera/estado, recorrido por estados reales, cliente/destino/importe/canal/notas, mapa y pestañas de historial operativo, geográfico y pagos/comprobantes. La edición de dirección sigue accesible en revisión.
- Chofer: resumen de la vista consultada, tarjeta de siguiente entrega sin sugerir optimización, numeración y acentos, contacto/mapa y acceso a detalle propio con lectura autorizada por servidor. Conservar todas las acciones de entrega/fallo/pago/comprobantes e historial.
- Actividad reciente: eventos reales de los últimos ocho pedidos por fecha disponible; alcance visible, creación y cambios de estado ordenados por fecha, carga/error/reintento y enlace al detalle. Sin inventar auditoría ni consultar todo el histórico por cada render.
- Guardado: paquete animado por recorrido y barra decorativa indeterminada, seguido de confirmación persistente con código real tras respuesta exitosa; continuar revisión o abrir detalle. Dirección sigue pendiente de confirmación humana. Cerrar con Escape restaura foco; errores no muestran éxito. Respetar movimiento reducido.
- Claro/oscuro, móvil320/360 y escritorio; sin cambiar servidor/esquema/permisos. Pruebas de transformación de eventos y estados renderizados; verificación UI con fixtures aislados.

## Revisión directa del Figma en navegador · 30/10
Tras pedido reiterado se revisan visualmente marcos tablero, chofer y carga en sesión autenticada de Brave (MCP sigue por cuota). Actividad pertenece a columna derecha debajo de Próximas acciones, con lista compacta/puntos/horas; chofer lleva resumen marino de tres columnas, tarjeta con cliente/dirección/mapa/contacto/entrega; carga lleva fondo marino, tarjeta clara, marca M sobre recorrido horizontal, barra y confirmación posterior.
Aceptación ajustada: Más información de Asignaciones abre /pedidos/:id existente. Actividad se coloca en su ranura del Figma. Chofer conserva todas las acciones, agrega los tres contadores reales y mapa de la primera entrega visible. Guardar/despachar sostienen presentación exitosa3600ms con recorrido de2800ms, sin desvanecer ni esperar quieto en la llegada; inicia animación automáticamente por pedido explícito y ofrece pausa por pantalla. Errores siguen inmediatos y sólo se anuncia éxito real. No se simulan porcentajes ni progreso del servidor. Las opciones existentes de movimiento reducido quedan sustituidas por control explícito de pausa en la carga pedida por el usuario.


## Ajuste de navegación de chofer · 30/10
Al entrar, actualizar o cambiar apartado, conservar carga exitosa al menos3600ms usando conCargaMinima existente; solicitudes inmediatas, errores sin espera artificial y respuestas lentas sin pausa adicional. Validar rechazo del apartado antes de aplicar el mínimo. No reiniciar/limpiar datos al tocar apartado ya activo. Arriba sólo En envío/Entregados, dos columnas; Historial se conserva sólo en menú inferior (los botones Ver historial de cada pedido conservan su función).

Aclaración posterior: consultas del chofer usan mínimo1200ms, animación breve de1000ms con una sola pasada y sin retorno de la barra. Guardar/despachar conserva3600ms. Si la red tarda más, sigue esperando respuesta real y no anuncia éxito por terminar la animación.

## Alta sin ubicaciones inexistentes y contraste · 30/10
Antes de guardar el pedido, servidor valida formato/localidad y consulta adaptador geográfico existente. Sin resultado o datos inválidos rechaza alta sin INSERT; proveedor no verificable devuelve error recuperable sin pedido. Mantener revisión humana de candidatos y confirmación para despacho. Errores conservan formulario y no muestran éxito. Avisos de error/advertencia, carga y confirmación con colores consistentes en claro/oscuro; comprobar ambos temas con fixtures válidos, rechazo y fallo. Regla posterior reemplaza admisión inicial de borrador inválido para altas nuevas.

## Preparar y asignar desde Nuevo pedido · 30/10
Con pedido EN STOCK y ubicación CONFIRMADA, destacar el tercer paso como botón azul Preparar pedido; antes de habilitarse conservar presentación discreta y bloqueo. Mientras se procesa mostrar Preparando y evitar doble envío. Sólo tras respuesta exitosa EN PREPARACIÓN mostrar paso completado y enlace Asignar chofer a /asignaciones. Ante error mantener el paso sin completar y mostrar el error existente. Conservar temas y adaptación móvil, sin modificar permisos ni API.
