# Entrega de funcionalidades MVP-1 · 03/11/2026

Rama: `feature/mvp1-pedidos-clientes-exportacion`, basada en `MVP-1`.
Integra todos los cambios pendientes de este checkout, incluida la configuración
de desarrollo aislada preexistente. No modifica main ni integra otras ramas.

## KAN-51 · horarios de 24 horas

- `fechas.js` centraliza presentación con ciclo h23: medianoche 00:00,
  mediodía 12:00 y tarde 18:41, con alternativa para fechas inválidas.
- Historial de pedido conserva zona Buenos Aires; consulta/entrega del chofer
  conserva zona del dispositivo. El PDF usa el mismo formato del historial.
- No modifica timestamps persistidos, estados ni pagos.

## KAN-52 · dos descargas PDF independientes

- Información: sólo campos de Más información, importes/pago/próxima visita
  cuando corresponden e historial completo de estados, sin recorte por paginación.
- Mapa: sólo dirección e imagen con pin y atribución OpenStreetMap incorporada.
  Sin datos extra del cliente, coordenadas ni historial.
- Componentes compartidos de datos evitan diferencias entre panel y documento.
  jsPDF se carga dinámicamente; mapa en canvas y manejo de error/reintento.
- Acceso desde revisión, detalles de Asignaciones y vista del chofer.
- Endpoint GET `/api/exportaciones/pedidos/:id`: lectura consistente, consultas
  parametrizadas, no-store y control de rol/usuario activo. Chofer sólo pedido propio.
- Exportar no guarda ni confirma dirección y no descarga adjuntos privados.

## KAN-54 · múltiples direcciones por cliente

- Selector en carga con direcciones existentes, nueva dirección y reintento.
  Cambiar cliente descarta respuestas anteriores y limpia dirección/importe manual.
- GET `/api/clientes/:id/direcciones` para administrador/operador combina libreta
  persistida e histórico sin reescribir pedidos ni inventar domicilios.
- Migración 005 aditiva: tabla `direcciones_cliente`, clave única por cliente y
  SHA256 de siete campos normalizados, incluidos piso/depto y referencias.
- Pedido y dirección recordada se crean en una transacción; duplicados no pisan
  datos anteriores. Reutilizar no copia coordenadas ni confirmación humana.
- Runbook y recuperación: `docs/migracion-direcciones-cliente.md`. Antes de
  actualizar otra base respaldar y ensayar restauración; ejecutar migraciones
  pendientes con el runner. No reaplicar init.sql ni eliminar volúmenes.

## KAN-56 · importe sugerido durante carga

- POST `/api/pedidos/importe-sugerido` calcula desde coordenadas tentativas con
  sucursal/tarifa del servidor y fórmula/redondeo compartidos con sugerencia existente.
- Punto único o candidato elegido habilita estimación; múltiples candidatos
  requieren elección. Se cancelan consultas y descartan respuestas viejas.
- Importe automático se actualiza con dirección vigente. Editar o vaciar activa
  modo manual; Usar importe sugerido permite volver al automático.
- Ayuda breve, carga/error y configuración faltante; falla de estimación no impide
  cargar manualmente. Importe sigue opcional. Estimar no persiste ni confirma.
- Georef: aliases Capital/Capital Federal/CABA no se mandan como filtro de
  localidad incompatible cuando la provincia es CABA; se conserva provincia.

## KAN-57 · selector frecuente y presentación

- Tipografía mínima heredada del formulario (8px, contacto/ayuda 7px, peso500),
  filas compactas con scroll; hasta cinco clientes al abrir, hasta veinte al filtrar.
- Sin búsqueda al montar cerrado. Debounce250ms, cancelación y descarte de respuestas.
- Clic/foco abre; foco fuera, clic exterior o Escape cierra. Pasar al botón
  Seleccionar permite completar la selección; Cambiar libera cliente seleccionado.
- Estado final: fondo plano mezclado 75% fondo/25% superficie, borde exterior1px,
  separadores y esquinas5px; sin blur/sombra. Respeta temas claro/oscuro.
- Alerta de posible pedido duplicado con colores legibles en tema oscuro.

## Campos obligatorios y email opcional

- Nombre, DNI y teléfono requeridos en alta/edición manual de clientes; código
  postal requerido al guardar/editar dirección. Backend también los exige.
- Cliente histórico incompleto debe completar contacto desde Clientes antes de
  crear un nuevo pedido. No se reescriben registros históricos ni importaciones.
- Email opcional por última indicación; sin asterisco ni bloqueo al dejarlo vacío.
  Conserva control de formato si se informa, normalización y avisos de coincidencia.
- Asteriscos consistentes en dirección, usuarios, login, tarifa, importe pendiente,
  motivo de fallo y método de pago según el requisito ya vigente en cada formulario.

## Configuración de desarrollo incluida

- Proyecto Compose `mandatodo-mvp1-aislado`, sin nombres de contenedor globales.
  Puertos host por defecto: web5174, API3001 y MySQL3308; configurables por entorno.
- Base/volumen aislados, ejemplos de entorno sin secretos y README actualizado.
  Vite carga `.env`, puerto estricto y proxy configurable; Docker usa puerto interno5173.
- No se versionan `.env` reales, respaldos, capturas ni logs de `temp/`.

## Verificación y límites

- `npm run check`: contexto, sintaxis, pruebas backend, lint y build frontend.
- `npm --prefix frontend test -- --run`: 116 pruebas aprobadas.
- Integración MySQL de KAN-54 ejecutada previamente en base aislada: persistencia,
  concurrencia/deduplicación, separación de clientes y rollback. Opt-in omitidas
  en ejecución general; no confundirlas con pruebas repetidas en cada ajuste CSS.
- Pruebas de permisos HTTP, PDF, horarios, cálculo, campos requeridos y email vacío.
  Aviso preexistente de bundle mayor a500kB.
- La revisión visual final móvil y el recorrido conjunto completo no se acreditan
  con estas suites. KAN-44 sigue pendiente por acuerdo previo.
- Cierre de KAN-51/52/54/56/57 solicitado explícitamente por Benjamín el03/11/2026;
  no representa ejecución adicional de pruebas manuales.
