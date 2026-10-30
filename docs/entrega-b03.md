# B03 y paginado — 26/10/2026

## Lectura vigente · 28/10/2026

Esta entrega forma parte del módulo de Benjamín publicado en `feature/benjamin-asignacion-entregas`. B01–B07 están finalizados en Jira; esto no acredita merge a `MVP-1`, ensayo físico de celular ni la prueba cruzada X04. Los apartados fechados de abajo conservan la evolución y las verificaciones de cada corte: sus estados de tablero, “sin commit/push” y restricciones luego reemplazadas son históricos. Para el comportamiento actual usamos [decisiones](decisiones.md) y [verificación B06](entrega-b06.md).

La vista actual del chofer incluye En envío, Entregados e Historial, con entrega y pago de B04/B05. La descripción inicial de B03 sólo cubría consulta de pendientes. El tamaño de página vigente es 10. El formato horario ambiguo se registra como corrección pendiente en KAN-51.

## Registro histórico de la entrega

Implementamos el alcance del módulo de Benjamín en feature/benjamin-asignacion-entregas. Cierre y publicación autorizados el 26/10/2026. Referencias: GitHub #37 y Jira KAN-33.

La vista /chofer reutiliza GET /api/chofer/pedidos, con identidad del JWT y filtro SQL de chofer propio, estado EN ENVÍO y dirección CONFIRMADA. Se conservan el cliente, teléfono, dirección completa, entre calles, CP e indicaciones. Se agregan búsqueda sin distinguir tildes por pedido/cliente/dirección, cantidad pendiente, hora de consulta, actualización/reintento y paginado. No muestra avances ni conexión ficticia. El enlace externo sólo admite coordenadas confirmadas, finitas y dentro de rango. B04/B05 quedan fuera.

Paginacion/usePagination se reutilizan en tablero, asignaciones, clientes, usuarios, revisión, chofer, búsqueda de frecuentes, historial geográfico, posibles duplicados y candidatos geográficos. Anterior/Siguiente, tamaño fijo de 10, rango y total; búsqueda/filtros vuelven a página 1, y el rango se ajusta al reducir resultados. Las métricas conservan el conjunto completo. El repositorio de clientes elimina los topes silenciosos 50/200 y ordena por nombre/id. Es paginado de presentación, no SQL: las respuestas completas se cargan en memoria, límite de escala conocido.

Verificación ejecutada:

- Docker Compose up -d: tres contenedores levantados, MySQL healthy y puerto host 3307; GET /api/health confirma HTTP y DB OK. Advertencia de DUPLICADOS_VENTANA_HORAS ausente (valor por defecto del servicio).
- Frontend: 51 pruebas, lint y build pasan. Cuatro pruebas nuevas de recorrido completo de 23 registros, límites/vacío, controles que no envían formularios, búsqueda sin tildes y coordenadas no confirmadas/inválidas. Warning de bundle >500 kB preexistente.
- Backend: 178 pasan, 1 MySQL opt-in omitida; sintaxis OK. Se volvió a ejecutar el caso HTTP de aislamiento de dos choferes, ID ajeno, roles y parámetro chofer_id manipulado. Esto no es una nueva prueba MySQL real.
- Navegador: ingreso real de chofer, estado vacío consultado a API; a 360×800 en claro/oscuro contenido de ancho 360 sin desborde. Cuenta de prueba sin envíos: no se acreditan tarjetas pobladas con MySQL ni celular físico en esta sesión. Sesión de administrador restituida al finalizar.
- Paginado interactivo con 23 registros sintéticos: páginas 1/2/3, última 21–23, búsqueda desde página 3 devuelve 1–1 y tamaño 5 reinicia a 1–5. Pantalla temporal retirada; no se insertaron registros en la base.
- npm run check raíz sigue bloqueado por copia Claude ppp1-mvp1 desactualizada preexistente; no se modificaron skills ajenas a esta tarea. git diff --check sin errores de espacios.

Para revisar: entrar como chofer con entregas ya asignadas y despachadas; comprobar contacto, dirección e indicaciones, buscar y abrir el mapa confirmado. Recorrer páginas de cualquier listado con más de diez registros. Entrega y registro de pago se implementan después, en tareas separadas.

Cierre 26/10: 52 pruebas frontend, lint y build pasan nuevamente. Incluye sidebar fijo, cabecera compacta y mapa interno protegido con cierre/reapertura bajo StrictMode. Se conserva el límite de UI poblada MySQL pendiente y el fallo previo de check raíz por copias Claude. B04/B05 permanecen pendientes.
