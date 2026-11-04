---
name: ppp1-mvp1
description: Guía de desarrollo del MVP 1 "Validación y despacho seguro" del Sistema de Normalización y Geolocalización de Direcciones de Envío de MandáTodo Logística (React + Vite + Axios, Node.js + Express, MySQL, Georef/Google, Docker). Usar cuando se pida diseñar, implementar, revisar o testear cualquier parte del MVP1 (pedidos, clientes, duplicados, direcciones, geolocalización, mapa, bloqueo de despacho, estados, usuarios/roles, asignación a choferes, vista del chofer, entrega o pago), o cuando un integrante del equipo (Santiago, Julián, Tomás, Sabrina, Benjamín) pida ayuda con su módulo o con el plan de sprints.
---

# MVP 1 — Validación y despacho seguro (MandáTodo Logística)

## 0. Antes de escribir una línea de código

1. **Leer el `docker-compose.yml` de la raíz del proyecto** (y los `Dockerfile` y `.env.example` que referencie). Es la fuente de verdad del entorno: servicios, puertos, nombres de host entre contenedores, versiones, volúmenes y variables de entorno. No asumir puertos, credenciales ni nombres de servicio: tomarlos de ahí. Si el archivo no existe o está incompleto, avisarlo y proponer cambios antes de seguir.
2. Identificar quién es el integrante (Santiago, Julián, Tomás, Sabrina o Benjamín) y en qué sprint está el equipo (sección 6). Enfocarse en su módulo.
3. Revisar el estado actual del repositorio (estructura de carpetas, migraciones existentes, servicios ya publicados) para no duplicar ni pisar el trabajo de otros.

## 1. Contexto del proyecto

MandáTodo Logística es una operación chica y multicanal (los pedidos llegan por WhatsApp, Instagram, correo y otros sistemas) que hoy maneja todo en Excel. Los errores de entrega vienen de domicilios incompletos, ambiguos o escritos en formatos distintos, y de pedidos cargados dos veces.

El sistema es una **capa de control entre la recepción del pedido y su asignación al repartidor**. Regla de oro del producto:

> Ningún pedido con dirección no validada puede pasar a despacho. Si la dirección es dudosa, el sistema avisa y bloquea el despacho.

Todo lo que se desarrolle en el MVP1 debe servir a esa regla. Si una decisión de diseño la debilita, se descarta.

### Flujo del MVP1 (cinco pasos)

1. **Cargar:** el empleado registra el pedido y los datos del cliente.
2. **Ordenar:** el sistema separa calle, altura y localidad, y avisa si falta algo.
3. **Ubicar:** busca la dirección en un servicio de mapas y la muestra.
4. **Confirmar:** una persona valida la ubicación. Si está mal, corrige y reintenta (vuelve al paso 2).
5. **Despachar:** solo los pedidos confirmados pasan al chofer.

En detalle: registrar pedido verificando que no sea duplicado → cargar dirección estructurada → normalizar y validar → si hay inconsistencias, advertir y corregir → geolocalizar (coordenadas + nivel de confianza) → mostrar en mapa → el operador confirma o corrige → confirmada la dirección se habilita el despacho → se registra el intento en el historial → asignación a chofer, entrega y pago.

## 2. Alcance: qué entra y qué queda afuera

### Entra en el MVP1

| Funcionalidad | Descripción |
|---|---|
| Registro de pedidos | Carga manual desde la plataforma |
| Gestión de clientes | Nombre, DNI, teléfono, email y domicilio |
| Detección de duplicados | Aviso de posibles duplicados por DNI y otros datos disponibles |
| Carga estructurada de dirección | Calle, altura, localidad, provincia, CP, piso/departamento, entre calles |
| Validación de dirección | Detección de datos faltantes o inconsistentes |
| Geolocalización | Consulta de la dirección a un servicio de mapas |
| Mapa | Mostrar visualmente la ubicación encontrada |
| Confirmación obligatoria | El empleado confirma la ubicación antes del despacho |
| Corrección | Modificar datos y volver a geolocalizar |
| Bloqueo de pedidos inválidos | Dirección no validada no puede pasar a despacho |
| Estados únicos | EN STOCK, EN PREPARACIÓN, EN ENVÍO, ENTREGADO y PAGADO |
| Base de datos | Reemplaza el manejo principal mediante Excel |
| Usuarios y roles | Login individual; administrador / operador / chofer |
| Asignación manual | Asignación manual de pedidos a choferes |
| Vista del chofer | Sus entregas desde el celular |
| Confirmación de entrega | Marcar pedido como entregado |
| Registro de pago | Efectivo o transferencia |

Requisitos que el cliente planteó explícitamente en la entrevista: bloquear pedidos con direcciones incompletas, recuperar datos de clientes recurrentes, usar los estados que la empresa ya usa y distinguir clientes por DNI.

### Queda afuera (NO implementar, avisar si alguien lo pide)

- **MVP 2 — Entregas:** rutas, orden de paradas, distancias y agrupamiento por zonas.
- **MVP 3 — Análisis:** dashboard, rentabilidad por pedido y ruta, reportes, historial de clientes y duplicados avanzados.
- Importación automática desde WhatsApp, Instagram, correo o sistemas externos (en el MVP1 los pedidos se cargan a mano).
- Notificaciones a clientes.

Si surge una idea fuera de esta lista, anotarla como propuesta para un MVP posterior y seguir con el alcance actual.

## 3. Stack y arquitectura

| Capa | Tecnología |
|---|---|
| Frontend | React + Vite + Axios |
| Backend | Node.js + Express |
| Base de datos | MySQL |
| Geolocalización | API Georef (oficial y gratuita) o Google Geocoding (de pago) |
| Entorno | Docker / docker compose (ver el `docker-compose.yml` de la raíz) |

Decisiones y convenciones:

- **Backend en capas:** `routes` → `controllers` → `services` (lógica de negocio) → `repositories` (acceso a MySQL). Los controladores no contienen lógica de negocio ni SQL.
- **Acceso a MySQL:** consultas parametrizadas siempre (nunca concatenar SQL). Migraciones versionadas y seeders, ejecutables desde el contenedor. Acordar en el Sprint 1 una sola herramienta (por ejemplo Knex o Sequelize, o `mysql2` con scripts SQL) y usarla en todo el proyecto.
- **Autenticación:** login individual con contraseñas hasheadas (bcrypt) y token (JWT) enviado por Axios. En el frontend, una instancia única de Axios con interceptores (adjunta el token, maneja 401/403 redirigiendo al login).
- **Autorización:** middleware por rol en el backend. Ocultar botones en React es solo cosmética; la regla real se aplica siempre en el servidor.
- **Validación de entrada** en el servidor con una librería de esquemas (Zod, Joi o similar). Respuestas de error con un formato común (`{ error: { codigo, mensaje, campos? } }`).
- **Geolocalización detrás de una interfaz:** `GeocodingProvider` con dos implementaciones (`GeorefProvider` y `GoogleProvider`), elegidas por variable de entorno (`GEOCODER_PROVIDER`). La API key de Google, si se usa, vive solo en el backend; el navegador nunca llama directo al proveedor. Respetar límites de uso y cachear consultas idénticas.
  - Georef no devuelve un puntaje de confianza único: derivar un `nivel_confianza` (ALTO / MEDIO / BAJO) según cantidad de resultados, si la altura es exacta o interpolada y si localidad y provincia coinciden.
  - Google informa el tipo de ubicación (por ejemplo, exacta vs. aproximada) y si hubo coincidencia parcial: mapear a la misma escala ALTO / MEDIO / BAJO.
- **Mapa:** `react-leaflet` con tiles de OpenStreetMap (sirve con cualquiera de los dos proveedores).
- **Frontend:** React Router con rutas protegidas por rol, vista del chofer **mobile-first** y responsive.
- **Configuración:** todo por variables de entorno (`.env` fuera del repositorio, `.env.example` versionado). Variables del frontend con prefijo `VITE_`; nunca poner secretos ahí.
- **Git:** una rama por funcionalidad (`feature/<modulo>-<descripcion>`), pull requests revisados por al menos otra persona, nada de commits directos a `main`.
- **Nombres:** elegir un solo idioma para tablas, columnas y código, y mantenerlo en todo el proyecto.
- **Estados:** siempre valores fijos desde un único módulo de constantes compartido por el backend (y expuesto al frontend por la API). Nunca texto libre ni comparaciones con strings escritos a mano: `PENDIENTE`, `Pendiente` y `pendiente` no pueden coexistir.
- **Datos personales:** DNI, teléfono, email y domicilio no se escriben en logs ni en tests con datos reales; cada rol ve solo lo que necesita.

## 4. Modelo de datos de referencia

El dueño del esquema es Santiago. Nadie modifica tablas por su cuenta: se propone el cambio por PR y se avisa al equipo.

- `usuarios`: id, nombre, email (único), password_hash, rol (ADMINISTRADOR / OPERADOR / CHOFER), activo, timestamps.
- `clientes`: id, nombre, dni (único, normalizado: solo dígitos), telefono, email, domicilio, timestamps.
- `pedidos`: id, cliente_id, canal_origen (texto informativo), estado, direccion_validada (booleano), chofer_id (nulo hasta asignar), observaciones, creado_por, timestamps.
- `direcciones`: id, pedido_id, calle, altura, piso_depto, entre_calles, localidad, provincia, codigo_postal, latitud, longitud, nivel_confianza, estado_validacion (PENDIENTE / CON_ADVERTENCIAS / VALIDA / CONFIRMADA), timestamps.
- `historial_geolocalizacion`: id, direccion_id, usuario_id, direccion_enviada, resultado, latitud, longitud, nivel_confianza, accion_operador (CONFIRMO / CORRIGIO / RECHAZO), fecha.
- `pagos`: id, pedido_id, metodo (EFECTIVO / TRANSFERENCIA), monto, registrado_por, fecha.
- `historial_estados`: id, pedido_id, estado_anterior, estado_nuevo, usuario_id, fecha.

Decisión a confirmar con el cliente: PAGADO figura entre los estados que la empresa usa, pero el pago es independiente de la entrega (un pedido puede estar ENTREGADO y no PAGADO, o al revés). Opciones: (a) un único campo `estado` con los cinco valores tal como los usa la empresa, o (b) separar estado logístico y estado de pago. Hasta que se decida, implementar (a) y registrar siempre el pago en la tabla `pagos`.

## 5. División del trabajo (5 integrantes)

Cinco módulos de tamaño comparable. Cada integrante hace su parte de **backend (Express/MySQL) y de frontend (React)**, de modo que todos toquen toda la pila y nadie quede como cuello de botella. Todos participan también en las pruebas de integración del Sprint 4.

### Santiago — Núcleo: arquitectura, base de datos, autenticación, roles y estados

1. Estructura del monorepo o repos (carpetas `frontend` y `backend`), configuración de Docker junto con el compose de la raíz, variables de entorno, manejo central de errores y formato común de respuestas.
2. Esquema completo de la sección 4 con migraciones y seeders (usuarios de prueba por rol, catálogo de estados).
3. Login individual: endpoint de login, JWT, hash de contraseñas, pantalla de login en React, instancia de Axios con interceptores y rutas protegidas.
4. Roles ADMINISTRADOR / OPERADOR / CHOFER con middleware de autorización. Reglas: el administrador gestiona usuarios y ve todo; el operador carga pedidos, valida direcciones y asigna; el chofer solo ve y actualiza sus entregas.
5. ABM de usuarios (solo administrador), con pantalla.
6. Módulo de estados: constantes únicas y `EstadoPedidoService` que valida transiciones permitidas (por ejemplo, un pedido con dirección no confirmada no puede pasar a EN ENVÍO) y escribe en `historial_estados`.
7. Migración inicial desde el Excel actual (importación única de clientes y pedidos existentes, normalizando estados y DNI).

Entrega a los demás: entorno Docker funcionando, esquema migrado, login y middleware de roles, `EstadoPedidoService`.

### Julián — Clientes, registro de pedidos y detección de duplicados

1. ABM de clientes (backend + pantallas): nombre, DNI, teléfono, email y domicilio, con validación de formato (DNI solo dígitos tras normalizar, email válido, teléfono normalizado).
2. Búsqueda de clientes por DNI, nombre o teléfono en el formulario de pedido, para recuperar rápido a un cliente recurrente (requisito de la entrevista).
3. Detección de clientes duplicados: DNI idéntico tras normalizar (quitando puntos, espacios y guiones) y aviso por coincidencia de teléfono o email con otro DNI.
4. Registro manual de pedidos: formulario que elige o crea cliente, registra canal de origen y observaciones, y crea el pedido en el estado inicial.
5. Aviso de pedidos duplicados: mismo cliente + misma dirección (comparando contra la dirección normalizada, no el texto crudo) dentro de una ventana de tiempo configurable. Si hay coincidencia, mostrar el pedido existente y exigir confirmación explícita del operador para continuar.
6. Listado de pedidos con filtros por estado, cliente y fecha.

Entrega a los demás: `ClienteService`, `PedidoService.crear()`, listado de pedidos. El aviso de duplicados de pedidos consume la dirección normalizada de Tomás.

### Tomás — Carga estructurada, normalización y validación de direcciones

1. Formulario React de dirección estructurada: calle, altura, piso/departamento, entre calles, localidad, provincia y código postal, con selección de provincia y localidad.
2. Servicio `NormalizadorDireccion` (backend): limpia espacios y mayúsculas, expande abreviaturas comunes (Av., Avda., Pje., Gral., etc.) y devuelve los componentes en formato uniforme. Separar un texto de un solo campo en componentes queda como mejora; la prioridad es el formulario estructurado.
3. Servicio `ValidadorDireccion` que devuelve una lista de problemas con código, campo afectado y mensaje legible. Casos mínimos:
   - campos obligatorios vacíos (calle, altura, localidad, provincia);
   - altura `0`, `S/N`, vacía o escrita en palabras ("mil doscientos");
   - intersección de calles en el campo de calle ("Rivadavia y Belgrano");
   - localidad ambigua (mismo nombre en varias provincias) o que no corresponde a la provincia;
   - código postal con formato inválido o incompatible con la localidad;
   - datos mezclados (piso o teléfono dentro del campo de calle).
4. Pantalla de advertencias: muestra los problemas, resalta los campos afectados y permite corregir y revalidar (vuelve a la normalización).
5. Actualiza `estado_validacion` a CON_ADVERTENCIAS o VALIDA. Solo una dirección VALIDA puede enviarse a geolocalizar.
6. Tests unitarios con una batería amplia de direcciones argentinas mal escritas (mínimo 30 casos), incluyendo los de la lista anterior.

Entrega a los demás: `NormalizadorDireccion`, `ValidadorDireccion` y la dirección normalizada que usan Julián (duplicados) y Sabrina (geolocalización).

### Sabrina — Geolocalización, mapa, confirmación, corrección y bloqueo

1. Interfaz `GeocodingProvider` con `GeorefProvider` (primera implementación, gratuita) y `GoogleProvider` (opcional), seleccionable por variable de entorno. Devuelve latitud, longitud y nivel de confianza ALTO / MEDIO / BAJO; maneja timeout, sin resultados, resultados ambiguos y límites de uso; cachea consultas idénticas.
2. Endpoint del backend que geolocaliza una dirección VALIDA y registra el intento.
3. Pantalla de mapa con react-leaflet: marcador, dirección enviada, nivel de confianza visible y, si hay varios candidatos, selección del correcto.
4. Confirmación obligatoria: botones "Confirmar ubicación" y "No es correcta". Al confirmar, la dirección pasa a CONFIRMADA y `direccion_validada = true`.
5. Corrección y reintento: "No es correcta" lleva a la edición de la dirección (módulo de Tomás), pasa de nuevo por normalización y validación, y relanza la geolocalización, sin límite de repeticiones.
6. Editar una dirección ya confirmada invalida la confirmación y el pedido vuelve a quedar bloqueado hasta reconfirmar.
7. Registro en `historial_geolocalizacion` de cada intento (dirección enviada, resultado, coordenadas, confianza, acción del operador). Una vista simple de consulta por pedido es opcional.
8. Bloqueo de pedidos inválidos: un único punto de verificación `puedeDespacharse(pedido)` en el backend que devuelve falso si la dirección no está CONFIRMADA, usado por cualquier asignación o cambio a EN ENVÍO.

Entrega a los demás: `GeocodingProvider`, pantalla de confirmación, `puedeDespacharse()`.

### Benjamín — Asignación, vista del chofer, entrega y pago

1. Pantalla de asignación manual (operador/administrador): lista de pedidos habilitados (dirección CONFIRMADA) y de choferes activos. Los pedidos bloqueados se muestran deshabilitados con el motivo, y el servidor los rechaza igual si alguien fuerza la petición.
2. Al asignar, guardar `chofer_id` y pasar a EN ENVÍO mediante `EstadoPedidoService`. Permitir reasignar y desasignar mientras no esté ENTREGADO.
3. Vista del chofer, mobile-first: solo sus entregas pendientes, con nombre del cliente, teléfono (enlace para llamar), dirección completa, entre calles, observaciones y botón para abrir la ubicación en una app de mapas con las coordenadas ya confirmadas.
4. Confirmación de entrega: el chofer marca ENTREGADO desde el celular, con confirmación para evitar toques accidentales. Se registra fecha, hora y usuario.
5. Registro de pago: efectivo o transferencia, con monto y quién lo registró; impedir doble registro sobre el mismo pedido. El paso a PAGADO sigue la decisión pendiente de la sección 4.
6. Pruebas en celular real o emulador con distintos tamaños de pantalla.

Entrega a los demás: flujo de asignación, vista del chofer y registro de pago. (No se hace dashboard ni reportes: son del MVP 3.)

### Dependencias entre módulos

- Santiago desbloquea a todos (entorno, esquema, login/roles, estados); por eso concentra el Sprint 1.
- Julián y Tomás pueden avanzar en paralelo; Julián consume la dirección normalizada de Tomás.
- Sabrina consume el validador de Tomás (solo direcciones VALIDA se geolocalizan).
- Benjamín consume `puedeDespacharse()` de Sabrina y `EstadoPedidoService` de Santiago.
- Si un módulo del que se depende no está listo, usar un **stub** con el mismo contrato (misma firma y forma de respuesta) para no quedar bloqueado.

## 6. Plan de trabajo: cuatro sprints de dos semanas

Un sprint es un bloque de dos semanas con objetivos concretos. Las estimaciones incluyen un 20 % de contingencia para pruebas, errores imprevistos y ajustes. Cada sprint cierra con una demo interna y una revisión cruzada de PRs.

**Sprint 1 (semanas 1 y 2) — Arquitectura, base de datos, usuarios, roles y login**
- Santiago: entorno Docker, estructura del proyecto, esquema y migraciones, login, roles, ABM de usuarios, constantes y `EstadoPedidoService`.
- Julián: diseño de las pantallas y contratos de clientes y pedidos; ABM de clientes sobre el esquema apenas esté disponible.
- Tomás: diseño de las reglas de normalización y validación; primeras versiones del normalizador y del validador con sus tests (son lógica pura, no dependen de la base).
- Sabrina: investigación y pruebas de la API de Georef (y Google como alternativa); definición del contrato de `GeocodingProvider` y el criterio de nivel de confianza; prototipo del componente de mapa.
- Benjamín: diseño de la vista del chofer y de la asignación; maquetas responsive en React; contratos de entrega y pago.

**Sprint 2 (semanas 3 y 4) — Carga de pedidos y clientes, duplicados, estados y validaciones**
- Julián: ABM y búsqueda de clientes, registro de pedidos, aviso de duplicados de clientes y de pedidos, listado de pedidos.
- Tomás: formulario de dirección estructurada, validador completo, pantalla de advertencias, estados de validación.
- Santiago: migración desde Excel, refinamiento de transiciones de estado, historial de estados, soporte de integración y revisión de seguridad.
- Sabrina: `GeorefProvider` funcionando contra el servicio real, con manejo de errores y caché.
- Benjamín: backend de asignación y de pago (modelo, servicios y endpoints), con datos de prueba.

**Sprint 3 (semanas 5 y 6) — Normalización, geolocalización, mapa, confirmación y corrección**
- Tomás: normalización integrada con el flujo del pedido; ajustes del validador con casos reales del cliente.
- Sabrina: endpoint de geolocalización, pantalla de mapa, confirmación obligatoria, corrección y reintento, historial y `puedeDespacharse()`.
- Julián: duplicados de pedidos usando la dirección normalizada; mejoras del listado.
- Benjamín: pantalla de asignación conectada al bloqueo; esqueleto de la vista del chofer.
- Santiago: integración de punta a punta del flujo Cargar → Ordenar → Ubicar → Confirmar; autorización por rol revisada en todos los endpoints.

**Sprint 4 (semanas 7 y 8) — Asignación a choferes, vista móvil, entregas, pagos, pruebas y correcciones**
- Benjamín: asignación completa, vista móvil del chofer, confirmación de entrega y registro de pago.
- Todos: pruebas cruzadas (Julián prueba a Tomás, Tomás a Sabrina, Sabrina a Benjamín, Benjamín a Santiago, Santiago a Julián), corrección de errores, pulido de la interfaz y pruebas en celular.
- Santiago: preparación del despliegue (compose final, variables, documentación de arranque) y verificación de los criterios de aceptación.
- Demo al cliente con casos reales de direcciones que hoy les dan problemas.

Si un sprint se atrasa, recortar primero lo opcional (vista de historial, mejoras del listado, Google como proveedor) y proteger siempre la regla de oro y el flujo completo de punta a punta.

## 7. Criterios de aceptación del MVP1 (definición de terminado)

- Un operador carga un pedido manual de cliente nuevo y de cliente recurrente (recuperado por DNI).
- Cargar el mismo cliente con la misma dirección escrita distinto ("Av. Hipólito Yrigoyen 1234" y "Avenida H. Yrigoyen 1234") dispara el aviso de duplicado.
- Una dirección con altura `0`, `S/N` o vacía no avanza: se muestra la advertencia y se exige corregir.
- Una dirección válida se geolocaliza y se muestra en el mapa con su nivel de confianza.
- Sin confirmación del operador, el pedido no se puede asignar a un chofer, ni desde la interfaz ni forzando la petición al servidor.
- Corregir una dirección confirmada invalida la confirmación y vuelve a bloquear el pedido.
- Todos los intentos de geolocalización quedan registrados con la intervención del operador.
- Los estados son siempre uno de los cinco definidos, sin variantes de mayúsculas ni texto libre.
- Cada usuario entra con su cuenta y ve solo lo que su rol permite.
- El chofer ve únicamente sus entregas desde el celular, marca la entrega y registra el pago (efectivo o transferencia).
- Los datos viven en MySQL; Excel deja de ser la fuente principal.
- Todo el sistema levanta con docker compose desde cero siguiendo el README.
- Los servicios críticos (normalizador, validador, duplicados, `puedeDespacharse` y transiciones de estado) tienen tests automatizados.

## 8. Cómo debe comportarse el agente que use este skill

1. **Leer el compose primero** (sección 0) y respetar el entorno que define.
2. **Identificar al integrante y el sprint.** Si no lo dicen, preguntar. Si piden algo de otro módulo, ayudar pero señalar a quién le corresponde y respetar los contratos.
3. **Respetar el alcance.** Implementar solo el MVP1; lo de MVP 2 y 3 se anota y se deja afuera.
4. **Proteger la regla de oro.** Cualquier código que permita despachar un pedido sin dirección CONFIRMADA es un defecto grave; al revisar código ajeno, verificar esto primero, tanto en frontend como (sobre todo) en backend.
5. **Trabajar con contratos.** Antes de escribir código que dependa de otro módulo, definir o pedir la firma del servicio o endpoint (entradas, salidas, errores). No asumir columnas que no existan en el esquema.
6. **Entregar en pasos pequeños.** Plan breve primero; luego implementar por partes (migración, repositorio, servicio, controlador, ruta, componente React, tests) indicando en qué archivo va cada cosa.
7. **Probar lo que se escribe**, en especial los casos borde de direcciones argentinas: alturas con letras o rangos, "S/N", calles numeradas ("Calle 14"), intersecciones, localidades homónimas en distintas provincias, pisos y departamentos escritos de distintas formas.
8. **No inventar datos ni credenciales.** Si falta una API key, una regla de negocio o la decisión sobre PAGADO, preguntar o dejarlo como configuración explícita y documentada como pendiente.
9. **Seguridad por defecto:** secretos solo en el backend y en variables de entorno, consultas parametrizadas, hash de contraseñas, autorización en el servidor, datos personales fuera de logs.
10. **Comunicar claro.** Explicar decisiones en lenguaje simple y señalar riesgos apenas aparezcan (límites de la API de geolocalización, falsos positivos en duplicados, direcciones sin resultado, desvíos del plan de sprints).
11. **Idioma:** responder en español rioplatense neutro y técnico, con nombres de código según la convención acordada.