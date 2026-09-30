# Arquitectura verificada · 30/09/2026

Reinspección para integrar `PPP1-contexto-para-Codex (1).zip`: base c574c75, rama main con seguimiento origin/main. Git **ya tenía cambios locales** al comenzar; se preservaron. Existían AGENTS.md raíz, frontend/AGENTS.md, adaptadores CLAUDE.md, seis skills, docs y scripts de verificación. No se encontró agent.md singular. La afirmación anterior de Git limpio correspondía a la preparación previa, no a esta integración.

Se releyeron manifests/lockfiles, Compose, ambos Dockerfiles, SQL, backend y frontend. Esta integración modifica instrucciones y documentación; app.js, tests HTTP y scripts ya existían al inicio y no se atribuyen a esta tarea.

## Estructura

| Ruta | Qué hace hoy |
| --- | --- |
| backend/index.js | Carga dotenv, conecta mysql2 y levanta servidor; un fallo DB se registra y no impide escuchar |
| backend/app.js | Aplicación Express separada del arranque para probar HTTP sin DB; conserva GET / |
| backend/test/http.test.js | Smoke por HTTP real en puerto efímero; no abre MySQL |
| frontend/src/App.jsx | Componentes de login, barra lateral, tablero vacío y formulario; navegación con useState |
| frontend/src/App.css e index.css | Estilos de la maqueta |
| frontend/src/main.jsx | Montaje React |
| database/init.sql | DDL inicial, no migración aplicada/verificada |
| docker-compose.yml | mysql, backend y frontend, con volumen mysql_data |
| scripts/ y package.json raíz | Verificación y sincronización de skills sin dependencias nuevas |
| AGENTS.md raíz, frontend/AGENTS.md, backend/AGENTS.md | Reglas siempre activas: comunes en la raíz, específicas por carpeta |

## Versiones

| Componente | Declaración | Lockfile / instalación observada |
| --- | --- | --- |
| Node | Dockerfiles node:24 | Host v24.15.0, npm 11.12.1 |
| Express | ^5.2.1 | 5.2.1 |
| mysql2 / dotenv | ^3.24.3 / ^17.4.2 | 3.24.3 / 17.4.2 |
| nodemon | ^3.1.14 | 3.1.14 |
| React / React DOM | ^19.2.8 | 19.2.8 |
| Vite / plugin React | ^8.2.2 / ^6.1.0 | 8.2.2 / 6.1.1 |
| ESLint | ^10.9.0 | 10.10.0 |
| MySQL | mysql:8.4 | Imagen declarada; motor no verificado en ejecución |
| Docker Compose | Sin versión fija en repo | CLI v5.5.0 disponible; motor apagado |

Backend CommonJS y frontend ESM/JSX. Los rangos del manifest no son versiones exactas. npm ls detectó cors y object-assign extraneous en backend/node_modules: no están declarados y no deben usarse implícitamente. npm ci reconstruye desde lockfile. No se ejecutó reinstalación ni actualización de dependencias.

## Flujo y límites

El frontend no hace fetch ni guarda pedidos. Login compara datos hardcodeados y permite administrador/operador, pero no conserva el rol: ambos ven identidad de operador. Chofer se rechaza. Los campos de pedido son principalmente no controlados; required en Field dibuja asteriscos, no validación persistente. Búsqueda, filtros, agrupamiento, corrección y mapa no tienen integración. No hay enrutador ni API de negocio.

Backend solo ofrece GET /. No hay middleware JSON de negocio, endpoints CRUD, autenticación JWT, hash de contraseñas, validadores ni autorización. JWT era una decisión registrada en AGENTS.md anterior; se conserva como dirección del equipo, pendiente de especificar sesión/expiración, no como funcionalidad instalada.

Patrones a conservar: componentes pequeños cuando se extraigan del archivo actual, CSS grid/flex, voseo, estado local para presentación, Express CommonJS y SQL parametrizado para futuras consultas. Separar servicios geográficos/datos al necesitarlos; no crear capas vacías.

## Base de datos existente

Seis tablas: clientes, direcciones, pedidos, historial_geolocalizacion, historial_estados, usuarios. Claves foráneas de pedidos a cliente/dirección y de historiales a pedido; historial se borra en cascada al borrar pedido, cliente restringe borrado, dirección usa SET NULL.

Brechas con negocio: clientes no tiene DNI; usuarios solo admin/operador; pedidos no tiene asignación de chofer ni pago; ENUM de pedidos usa pendiente_validacion, requiere_revision, direccion_validada, listo_despacho, en_camino, entregado, fallido, cancelado. Confirmación existe en historial_geolocalizacion como booleano, sin vínculo robusto con versión de dirección; proveedor default georef no acredita una elección aprobada. Estado normalizada no equivale a confirmación humana.

Compose no monta init.sql en /docker-entrypoint-initdb.d. Aunque se agregara ese montaje, los scripts de inicialización no migran un volumen ya creado. CREATE TABLE IF NOT EXISTS no actualiza tablas y los CREATE INDEX finales fallarían al reaplicarse con índices existentes. No ejecutar el archivo sobre datos actuales para “arreglar” el esquema.

## Docker y entorno

Puertos host 3306, 3000, 5173. Backend recibe DB_HOST=mysql y demás variables desde .env raíz mediante Compose; nativo usa backend/.env.example (DB_HOST=127.0.0.1). Dockerfiles usan npm install y comando dev; son configuración de desarrollo, no despliegue productivo. Hay bind mounts y volúmenes anónimos de node_modules. MySQL tiene healthcheck; frontend depende del inicio del backend, sin readiness de negocio.

No se cambió Docker ni SQL. Evaluar npm ci en Docker y readiness al preparar T02, sin reinicializar volúmenes. No imprimir docker compose config sin --quiet: puede mostrar secretos interpolados.

## Material descartado

La revisión previa encontró material de aprendizaje ajeno a este proyecto: un ABM de ejemplo con CRUD `/Clientes` sobre una tabla `Cliente`, CORS abierto, consultas parametrizadas pero sin validación de permisos ni de entradas, y logging del cuerpo de la petición; además una guía de Angular con SQL Server, incompatibles con el stack vigente. Nada de eso forma parte del repositorio y no se copió. Este proyecto se construye con el código que hay en `backend/`, `frontend/` y `database/`: no hace falta ningún módulo heredado para arrancarlo.
