# Entrega B02 — Preparación y despacho

## Lectura vigente · 28/10/2026

Esta entrega forma parte del módulo de Benjamín publicado en `feature/benjamin-asignacion-entregas`. B01–B07 están finalizados en Jira; esto no acredita merge a `MVP-1`, ensayo físico de celular ni la prueba cruzada X04. Los apartados fechados de abajo conservan la evolución y las verificaciones de cada corte: sus estados de tablero, “sin commit/push” y restricciones luego reemplazadas son históricos. Para el comportamiento actual usamos [decisiones](decisiones.md) y [verificación B06](entrega-b06.md).

Permitimos preparar un pedido EN STOCK aunque su dirección no esté confirmada. “Bloqueado” informa que no se puede asignar un chofer ni despachar; no impide la preparación interna. Preparar sólo cambia a EN PREPARACIÓN y registra historial. Despachar exige dirección CONFIRMADA, EN PREPARACIÓN y chofer activo. Benjamín ratificó este criterio el 28/10/2026. Reasignar o quitar chofer sigue limitado al tramo previo al despacho.

## Registro histórico de la entrega

Branch: `feature/benjamin-asignacion-entregas`. Fecha: 25/10/2026. Base: B01 ya publicada; no se hace merge a MVP-1.

## Cambios para quien usa la aplicación

En Asignar choferes, un pedido EN STOCK puede pasar a EN PREPARACIÓN con Preparar. Despachar pide confirmación y solo permite pasar a EN ENVÍO si la dirección está CONFIRMADA y el chofer asignado está activo. El pedido pasa a aparecer en la consulta propia del chofer.

Reasignar cambia el chofer; Quitar chofer libera el pedido. Ambas acciones están restringidas a EN STOCK/EN PREPARACIÓN. Después del despacho el servidor rechaza cambios de asignación. Asignar sigue sin cambiar el estado del pedido.

Los cinco estados se muestran como referencia. Esta entrega no habilita ENTREGADO ni PAGADO: corresponden a B04 y B05. Las decisiones pendientes del equipo, incluida Q01, no se dan por aprobadas por esta implementación.

## Contrato y persistencia

- `PUT /api/asignaciones/:id/estado`, cuerpo `{ "estado": "EN PREPARACIÓN" }` o `{ "estado": "EN ENVÍO" }`.
- Solo administrador/operador; IDs y cuerpo validados, sin campos extra.
- Se reutiliza `validarTransicion` de EstadoPedidoService.
- Relectura y bloqueo de pedido/dirección/chofer, UPDATE e historial en una transacción. Fallo revierte; reintento/concurrencia no duplica historial.
- Listado/guardado informa `puede_preparar`, `puede_despachar`, `motivo_despacho`.
- No se modifican tablas ni se agregan dependencias.

## Ajustes pedidos durante el cierre

MySQL de Docker se publica en localhost:3307, configurable con MYSQL_HOST_PORT; el backend sigue usando mysql:3306 internamente. Para arrancar basta `docker compose up -d`; se conserva el volumen y no se detiene el MySQL local de 3306.

Bloqueado se muestra rojo, En envío azul y habilitados/estados finales verde, en ambos temas. Perfil y cierre de sesión vuelven al pie del menú, con alineación y visibilidad en pantallas angostas. Se corrige contraste de clientes guardados y se unifica la paleta oscura del login con el resto de la aplicación.

## Verificación y límites

- Backend: 178 aprobadas, 0 fallos, 1 integración opt-in omitida por defecto.
- Integración MySQL ejecutada aparte: 1/1; preparación/despacho concurrentes, rollback, chofer inactivo, dirección modificada, reasignación/quitar y aislamiento.
- Flujo HTTP con MySQL aislado: preparar, asignar, despachar como operador, recargar, consulta propia del chofer y rechazo de saltos/roles/cambios posteriores.
- Frontend: 47/47, lint y build pasan; warning preexistente de chunk mayor a 500 kB.
- Sintaxis backend, diff y configuración Compose pasan. Puerto 3307 accesible y servicios levantados con MySQL healthy.
- Navegador: pantalla/controles y correcciones visuales comprobados; no se alteraron pedidos existentes. Despacho completo por clic con un pedido sintético en UI todavía no verificado.
- Fixtures propios limpiados en base aislada; sin modificaciones de datos de desarrollo, secretos, archivos temporales ni volúmenes.
- `npm run check` raíz mantiene el bloqueo previo por copia Claude de ppp1-mvp1 desactualizada; las verificaciones técnicas anteriores se ejecutaron por separado.

## Siguiente tarea: B03, pendiente de plan

Ya existe una base de consulta propia y pantalla de chofer. Falta revisarla como entrega móvil: diseño compacto, datos completos, teléfono y ubicación confirmada, carga/vacío/error/reintento y comprobación con dos choferes. B03 no incluye registrar entrega ni cobro. No se implementa B03 en este cierre.

## Enlaces directos

[Ticket B02 #36](https://github.com/Benjabb2005/Practicas-Pre-Profesionales-1-Grupo-9/issues/36) ↔ [Commit principal 164807b](https://github.com/Benjabb2005/Practicas-Pre-Profesionales-1-Grupo-9/commit/164807b2e8a5226d1421919aa252397b3f44d17f).

[Ticket B01 #35](https://github.com/Benjabb2005/Practicas-Pre-Profesionales-1-Grupo-9/issues/35) ↔ [Commit principal e0b7eff](https://github.com/Benjabb2005/Practicas-Pre-Profesionales-1-Grupo-9/commit/e0b7effbd60fba66334fdf5eafb3dee1c4dac240). Los mensajes y descripciones contienen enlaces en ambos sentidos. Tabla de SHA anteriores/actuales en docs/tareas.md.
