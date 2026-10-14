# MandáTodo Logística · PPP1 Grupo 9

Caso 7: normalización y geolocalización de direcciones de envío. La IA implementa y el equipo define, comprende y valida.

**Estado al 14/10/2026:** acceso real admin/operador/chofer, carga de pedidos, mapa Georef/Leaflet/OSM, confirmación humana, asignación y despacho. Instalación Docker nueva con estructura completa y solo administrador. Registro de entregas, intentos fallidos y reintentos implementado; pagos e importación histórica siguen pendientes. Ver [arquitectura](docs/arquitectura.md) para límites.

**Cuentas de empleados:** administrador → Usuarios → Crear usuario. En instalación Docker nueva, el primer administrador se configura en `.env`, según los pasos siguientes. El comando `npm --prefix backend run setup-admin` queda como alternativa manual. Sin registro público ni credenciales comunes.

## Empezar con IA

Abrir **esta carpeta** como proyecto. Leer [AGENTS.md](AGENTS.md) y [guía de desarrollo](docs/desarrollo-ia.md). Las reglas de trabajo están en `AGENTS.md` de la raíz y se complementan con [frontend/AGENTS.md](frontend/AGENTS.md) y [backend/AGENTS.md](backend/AGENTS.md) según la carpeta que toques. Configuración por herramienta y comprobación de contexto: [docs/agentes.md](docs/agentes.md). Primera tarea propuesta: T01 en [tareas](docs/tareas.md).

## Preparación local (PowerShell)

Requisitos: Node 24/npm y, para MySQL, Docker Desktop con motor Linux activo. Las dependencias están fijadas por los lockfiles de cada paquete. La raíz solo coordina scripts; no requiere npm install.

```powershell
npm ci --prefix backend
npm ci --prefix frontend
npm run check
```

Para Claude Code: `npm run skills:sync`. Después de editar una skill, volver a sincronizar; `npm run check` detecta copias locales desactualizadas.

## Arranque Docker

### 1. Preparar la computadora

Instalar y abrir **Docker Desktop**, con contenedores Linux y Docker Compose disponibles. Para este arranque no hace falta instalar Node ni ejecutar `npm install` en la computadora.

Obtener la versión del proyecto que incluye `backend/initialize.js`. Abrir PowerShell en la carpeta donde está `docker-compose.yml`. Todos los comandos siguientes se ejecutan desde esa carpeta.

### 2. Configurar la primera instalación

Crear `.env` desde el ejemplo **solo si no existe**:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
notepad .env
```

Completar y guardar estos campos con valores propios:

| Campo | Qué completar |
| --- | --- |
| `MYSQL_ROOT_PASSWORD` | Contraseña administrativa de MySQL |
| `MYSQL_DATABASE` | Conservar `mandatodo` |
| `MYSQL_USER` | Nombre del usuario de la aplicación, distinto de `root` |
| `MYSQL_PASSWORD` | Contraseña de ese usuario MySQL |
| `INITIAL_ADMIN_NAME` | Nombre del administrador de MandáTodo |
| `INITIAL_ADMIN_EMAIL` | Email con el que va a ingresar |
| `INITIAL_ADMIN_PASSWORD` | Contraseña del administrador, entre 12 y 128 caracteres |

Conservar `APP_ORIGIN=http://localhost:5173` y `COOKIE_SECURE=false` para desarrollo local. `SESSION_SECRET` puede quedar vacío: Docker genera uno y lo conserva. Las contraseñas de MySQL y del administrador son accesos distintos. No compartir ni subir `.env` a Git; si un valor contiene `$`, escribirlo entre comillas simples en `.env` para evitar interpolación.

### 3. Iniciar todo

```powershell
docker compose config --quiet
docker compose up -d --build
docker compose ps -a
docker compose logs --tail 50 initialize
```

La primera construcción puede tardar. En una base nueva, `initialize` crea todas las tablas, aplica las migraciones y crea **un único administrador**, sin clientes ni pedidos. Es normal que ese servicio termine con `Exited (0)`; MySQL, backend y frontend deben quedar ejecutándose. Si el instalador falla, el backend no inicia.

### 4. Entrar y comprobar

Abrir **http://localhost:5173** e ingresar con `INITIAL_ADMIN_EMAIL` y `INITIAL_ADMIN_PASSWORD`. Desde **Usuarios**, el administrador puede crear operadores y choferes.

Para comprobar que el backend conecta a MySQL:

```powershell
Invoke-RestMethod http://localhost:3000/health/ready
```

Debe mostrar `status: ok` y `database: available`. MySQL está disponible en `localhost:3306` para herramientas de desarrollo.

### Detener y volver a iniciar

Detener sin eliminar la base:

```powershell
docker compose stop
```

Volver a iniciar:

```powershell
docker compose up -d
```

Después de recibir cambios de código, reconstruir:

```powershell
docker compose up -d --build
```

Los datos se conservan en `mysql_data`. Reiniciar no duplica el administrador; cambiar `INITIAL_ADMIN_*` tampoco cambia la contraseña de una cuenta existente. Una base existente con migraciones pendientes requiere actualización manual con respaldo según [acceso y entorno](docs/acceso-y-entorno.md). No borrar volúmenes para actualizar.

### Si no arranca

Consultar estado y errores:

```powershell
docker compose ps -a
docker compose logs --tail 100 initialize backend frontend mysql
```

- **Docker no responde:** abrir Docker Desktop y esperar que el motor esté listo.
- **El instalador se detiene:** revisar los campos de `.env`, especialmente email y longitud de contraseña. Si informa esquema parcial o migraciones pendientes, seguir la guía de actualización con respaldo.
- **Puerto ocupado:** comprobar que no haya otro programa usando 5173, 3000 o 3306.
- **Falta una dependencia después de actualizar:** sincronizar las dependencias dentro de los contenedores y reiniciar:

```powershell
docker compose exec -T backend npm ci
docker compose exec -T frontend npm ci
docker compose restart backend frontend
```

Los logs pueden contener información local: revisarlos antes de compartirlos.

## Ejecución nativa opcional

MySQL debe estar disponible. Copiar backend/.env.example a backend/.env solo si falta; completar con los valores de la misma base. Para Node en host, DB_HOST=127.0.0.1; Compose usa mysql.

En terminales separadas:
```powershell
npm --prefix backend run dev
npm --prefix frontend run dev
```

El backend puede responder / aunque MySQL falle; /health/ready comprueba conectividad. Vite tiene proxy para /api y /health; login y pedidos consultan backend con cookie. Guardar un pedido no habilita despacho: queda pendiente de revisión geográfica.

## Documentación

- [Contexto](docs/contexto.md): fuentes, requisitos, propuestas y Clientes.
- [Arquitectura](docs/arquitectura.md): implementación verificada y brechas.
- [Pantallas](docs/pantallas.md): demo, maqueta local y flujos no observados.
- [Decisiones](docs/decisiones.md) y [tareas](docs/tareas.md): continuidad del equipo.
- [Verificación](docs/verificacion.md): comandos, alcance y resultados.
- [Desarrollo con IA](docs/desarrollo-ia.md): skills, revisión humana y colaboración.

Todo el contexto del proyecto vive en este repositorio. `temp/` recibe el material temporal (enunciados, Excel, capturas, ZIP) y está ignorada, salvo el `.gitkeep` que la conserva. Inventario de fuentes y sus límites en [fuentes](docs/fuentes.md). No se agregaron dependencias nuevas ni se ejecutaron commits, push o despliegues.
