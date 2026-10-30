# B06 · verificación técnica del chofer · 27/10/2026

## Lectura vigente · 28/10/2026

Esta entrega forma parte del módulo de Benjamín publicado en `feature/benjamin-asignacion-entregas`. B01–B07 están finalizados en Jira; esto no acredita merge a `MVP-1`, ensayo físico de celular ni la prueba cruzada X04. Los apartados fechados de abajo conservan la evolución y las verificaciones de cada corte: sus estados de tablero, “sin commit/push” y restricciones luego reemplazadas son históricos. Para el comportamiento actual usamos [decisiones](decisiones.md) y [verificación B06](entrega-b06.md).

El cierre técnico fue aceptado y publicado el 28/10/2026 en `70b09ea`; KAN-36/#40 quedaron finalizados. Se conservan los límites de celular físico, selección desde galería y dependencias indicados abajo. X04/KAN-44 sigue pendiente. El párrafo histórico que propone no marcar Hecho queda superado por este cierre, sin atribuir pruebas humanas no realizadas.

## Registro histórico de la entrega

Alcance de la entrega de Benjamín: ejecutar las pruebas del módulo. Referencias KAN-36/#40. Skill ppp1-verificar y reglas de frontend/backend. Sin commit/push ni cambios en tableros.

## Entorno

Compose separado ppp1-b06: MySQL8.4 con almacenamiento temporal, sin puerto de base publicado, backend3001/frontend5174 sólo loopback. Dos bases nuevas: mandatodo_test_asignaciones y mandatodo_test_entregas, migraciones001–003 y datos sintéticos. No se copió ni modificó la base de desarrollo; no se ejecutó seed/migrate sobre ella. Backend de pruebas detenido/reactivado para ensayo de error. Entorno de pruebas detenido al finalizar; desarrollo5173/3000/3307 permanece activo.

Primera preparación dio ECONNREFUSED durante inicialización de MySQL; reintento con motor disponible pasó. Frontend de pruebas cambiado a build/preview para evitar recargas observadas con servidor dev, sin cambiar Compose de desarrollo.

## Resultados ejecutados

| Verificación | Resultado |
| --- | --- |
| npm run check, host final | Pasa: contexto/skills, sintaxis, backend, lint/build |
| Backend, Docker y host | 195 pasan, cero fallan; 4 integraciones opt-in omitidas por defecto en suite final |
| Frontend, Docker | 66 pasan, cero fallan; lint/build pasan |
| asignaciones-mysql.test.js, ASIGNACIONES_MYSQL=1 | Pasa: persistencia, concurrencia, aislamiento, historial y rollback real |
| entregas-mysql.test.js, ENTREGAS_MYSQL=1 | Pasa: entrega/fallo, recargos, despacho manual futuro, cobro/acreditación concurrentes y rollback |
| comprobantes-mysql.test.js, COMPROBANTES_MYSQL=1 | Pasa: HTTP/MySQL, bytes exactos, privacidad, duplicados concurrentes, conteos y adjunto posterior a acreditación |
| flujo-chofer-mysql.test.js, FLUJO_CHOFER_MYSQL=1 | 8 resultados exitosos: prueba padre y 7 subpruebas; cero fallos/omitidos |
| git diff --check y sintaxis backend | Pasan |

Las cuatro integraciones omitidas por defecto sí se ejecutaron expresamente en MySQL aislado.

Check raíz inicialmente falló por copia Claude ppp1-mvp1 desactualizada: npm run skills:sync regeneró siete copias ignoradas, sin cambiar fuentes. Siguiente intento encontró bcryptjs ausente en host; npm ci --prefix backend y npm ci --prefix frontend reconstruyeron desde lockfiles sin modificarlos. Después npm run check terminó con código0. Supera el bloqueo de entorno registrado en entregas anteriores.

## Regresión persistente añadida

backend/test/flujo-chofer-mysql.test.js usa Express/MySQL y login bcrypt/JWT reales; genera claves e identidades sintéticas en cada ejecución. Exige DB_NAME=mandatodo_test_entregas y FLUJO_CHOFER_MYSQL=1.

1. Login inválido, falta de sesión y cuatro identidades con auth/me.
2. Pedidos propios; ID ajeno rechazado; manipular chofer_id no amplía acceso; permisos de operador/chofer; pago prematuro rechazado.
3. Dirección sin confirmar bloquea asignación y despacho mediante API directa.
4. Entrega y efectivo concurrentes generan un solo pago y dos eventos; relectura confirma PAGADO; cambiar método se rechaza.
5. Fallo sin motivo rechazado; fallo válido repetido agrega50% una sola vez y próxima visita; despacho manual permitido; reenvío antiguo no retrocede despacho.
6. Transferencia conserva ENTREGADO hasta admin; chofer/operador403, monto impuesto400, doble acreditación idempotente.
7. Entregado antiguo sin importe no paga; operador completa una sola vez en MySQL real, conserva estado y habilita efectivo; chofer no fija precio. Cubre la brecha de integración del último ajuste de B05.

Reproducción: preparar exclusivamente una base descartable con migraciones001–003 y DB_HOST/DB_USER/DB_PASSWORD/DB_NAME de esa base. Desde backend activar FLUJO_CHOFER_MYSQL=1 y ejecutar node --test test/flujo-chofer-mysql.test.js. Inserta fixtures: no usar una base compartida o de desarrollo. Otras integraciones conservan sus flags/guardas existentes.

## Navegador → API → MySQL

Brave real, sin mocks de API; móvil360×800, mínimo320×740 y escritorio1440×900, temas claro/oscuro. Capturas sintéticas ignoradas en temp.

- Login incorrecto muestra mensaje; login real de chofer/admin y cierre de sesión funcionan.
- 14 pedidos propios iniciales; páginas10/4 y límites correctos; búsqueda reduce a un pedido; pedido ajeno no aparece.
- Entrega exige segundo botón, sale de En envío y persiste después de recargar.
- Efectivo1000 pasa a PAGADO, sale de pendientes y aparece en Historial; eventos Entregado/Pagado con usuario/fecha.
- Fallo sin motivo activa validación nativa. Con motivo vuelve a preparación y desaparece de En envío; SQL confirma total1500 sobre base1000.
- Transferencia1500 se informa sin archivo, conserva ENTREGADO y muestra pendiente de administración; selector opcional y Guardar habilitado sin archivo.
- PNG sintético subido por HTTP dos veces produce un adjunto; UI chofer/admin lista, carga preview privado y ofrece descarga. Fixture de imagen mínimo: no acredita legibilidad de foto comercial.
- Admin acredita desde tarjeta correcta mediante confirmación, ve PAGADO; al volver al chofer, transferencia con comprobante aparece en Historial.
- Sin importe: explicación y botón Falta cargar el importe deshabilitado.
- Mapa de pedido propio confirmado abre Leaflet con dirección/atribución y cierra con Escape; no se volvió a probar geocodificador real.
- Backend aislado detenido: Actualizar muestra error y habilita Reintentar; reactivado: recupera pedidos con misma sesión/filtro. Proxy devuelve mensaje genérico y puede demorar; no se midió SLA.
- SQL independiente contrasta acciones UI: efectivo PAGADO/1000, transferencia ENTREGADO/1500 antes de acreditar, fallo EN PREPARACIÓN/1500.

## Hallazgo corregido

320px con scrollbar Windows: body min-width320 imponía desborde15px (scrollWidth320/clientWidth305). frontend/src/index.css usa ahora min-width:min(320px,100%). Verificado después: body/scrollWidth/clientWidth305, sin desborde. Escritorio1440: scrollWidth/clientWidth1425. Capturas inspeccionadas temp/b06-320-corregido.png y temp/b06-escritorio.png. No cambia API/permisos/estados/esquema.

## Límites y deuda

- No hubo Android/iOS físico, cámara/galería ni red móvil real. Responsive no sustituye ese ensayo.
- Extensión bloquea seleccionar archivo por falta de permiso de URLs de archivo. No se cambió permiso. Subida/validación/persistencia/duplicados probados por HTTP/MySQL, preview por UI; selección y subida completa por UI quedan sin acreditar en esta sesión.
- No se repitió visualmente PDF.js con PDF real nuevo: esta sesión acredita preview PNG, regresiones automáticas existentes imagen/PDF e integración binaria PDF. Evidencia histórica B05 no se atribuye a B06.
- npm audit: backend5 (4 altas,1 crítica), frontend4 altas. Backend: body-parser, brace-expansion, proxy-addr crítica, xlsx y zod. Frontend: brace-expansion, source-map-js, vite y zod. Algunas correcciones son mayores o no tienen fix según auditor. No se ejecutó audit fix ni se cambiaron dependencias fuera del alcance. Detalles ignorados temp/b06-audit-backend.json y temp/b06-audit-frontend.json. Éxito funcional no acredita seguridad de dependencias.
- Continúan advertencias previas de bundle>500kB y DUPLICADOS_VENTANA_HORAS ausente (default24).

B06 tiene evidencia técnica ampliada; no se marca Hecho automáticamente ni se afirma prueba física. Próximo cierre humano: selección/galería en celular y revisión por Benjamín. X04 sigue otra tarea, no se cierra con estas pruebas.

## Corrección posterior: paneles por HTTP en IP local

Reporte de Benjamín desde celular: Ver historial/Ver comprobante y demás acciones rompían. La prueba previa usó localhost, considerado contexto seguro, y no detectó que crypto.randomUUID no existe por HTTP sobre IP de LAN. AccionChofer lo ejecutaba al montar cualquier panel, incluso de consulta. Se reprodujo en cinco regresiones que fallaron antes con TypeError.

Corrección: operacionEntrega.js genera UUIDv4 con crypto.getRandomValues, disponible en ese contexto. AccionChofer sólo genera el identificador para entrega/fallo y lo mantiene en useState para conservar idempotencia al reintentar. Historial/comprobantes/pago no generan UUID innecesario. Sin dependencias nuevas ni cambios del servidor.

72 pruebas frontend, lint/build pasan. Navegador real sobre IP HTTP a360px: isSecureContext=false y randomUUID=undefined, apertura/cierre de los cinco paneles, Escape y reapertura de historial pasan bajo StrictMode. Harness temporal con API sintética sin red real, retirado al finalizar. Evidencia temp/b06-panel-ip-corregido.png. Es una prueba de compatibilidad del panel; no una nueva integración MySQL ni un ensayo físico de celular. Se conserva el resto de los límites del informe.
