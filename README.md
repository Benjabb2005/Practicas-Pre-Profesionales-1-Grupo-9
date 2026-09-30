# MandáTodo Logística · PPP1 Grupo 9

Caso 7: normalización y geolocalización de direcciones de envío. La IA implementa y el equipo define, comprende y valida.

**Estado:** frontend de demostración, backend con respuesta HTTP básica y conexión MySQL, SQL inicial sin migraciones. Todavía no hay flujo de pedidos persistido ni autenticación real. Ver [arquitectura](docs/arquitectura.md).

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

Crear .env desde .env.example **solo si no existe**, completar credenciales locales sin subirlas. No sobrescribir un .env existente.

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
docker compose config --quiet
docker compose up -d --build
docker compose ps
docker compose logs --tail 100 backend
```

Frontend: http://localhost:5173 · backend: http://localhost:3000 · MySQL: localhost:3306. Para detener sin eliminar datos: `docker compose stop`. No borrar volúmenes.

**Importante:** Compose no monta database/init.sql; iniciar MySQL no crea esas tablas. El script inicial no es una migración y no debe reaplicarse sobre datos existentes. Resolver T02 antes de habilitar persistencia.

## Ejecución nativa opcional

MySQL debe estar disponible. Copiar backend/.env.example a backend/.env solo si falta; completar con los valores de la misma base. Para Node en host, DB_HOST=127.0.0.1; Compose usa mysql.

En terminales separadas:
```powershell
npm --prefix backend run dev
npm --prefix frontend run dev
```

El backend actual puede responder / aunque MySQL falle. El frontend todavía no llama al backend, y no hay proxy Vite ni configuración CORS de aplicación.

## Documentación

- [Contexto](docs/contexto.md): fuentes, requisitos, propuestas y Clientes.
- [Arquitectura](docs/arquitectura.md): implementación verificada y brechas.
- [Pantallas](docs/pantallas.md): demo, maqueta local y flujos no observados.
- [Decisiones](docs/decisiones.md) y [tareas](docs/tareas.md): continuidad del equipo.
- [Verificación](docs/verificacion.md): comandos, alcance y resultados.
- [Desarrollo con IA](docs/desarrollo-ia.md): skills, revisión humana y colaboración.

Todo el contexto del proyecto vive en este repositorio. `temp/` recibe el material temporal (enunciados, Excel, capturas, ZIP) y está ignorada, salvo el `.gitkeep` que la conserva. Inventario de fuentes y sus límites en [fuentes](docs/fuentes.md). No se agregaron dependencias nuevas ni se ejecutaron commits, push o despliegues.
