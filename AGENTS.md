# AGENTS.md — Contexto del Proyecto Grupo 9

## Proyecto
- **Materia:** Prácticas Pre Profesionales 1 (PPP1) — Trabajo Integrador.
- **Caso asignado:** Caso 7 — Sistema de Normalización y Geolocalización de Direcciones de Envío.
- **Cliente real:** MandáTodo Logística.
- **Repo:** https://github.com/Benjabb2005/Practicas-Pre-Profesionales-1-Grupo-9

## Problema del cliente
MandáTodo es una empresa chica de logística de última milla (3 choferes).
Recibe pedidos por WhatsApp, Instagram y mail con direcciones escritas de
forma desordenada → viajes fallidos. Registran todo en un Excel compartido →
clientes duplicados y estados de entrega caóticos.

## Funcionalidades core de la solución
1. **Carga de pedidos manual:** campos separados y obligatorios (Calle, Altura,
   Localidad, etc.). No debe avanzar si falta la altura o hay datos inconsistentes.
2. **Normalización y Mapa:** validar la dirección con una API de mapas y mostrar
   un pin. Un empleado SIEMPRE debe confirmar visualmente la ubicación antes de
   habilitar el despacho (campo `confirmado_visualmente`).
3. **Gestión de clientes duplicados:** detección automática cruzando DNI, email
   o teléfono.
4. **Estados unificados** (solo estos, en este orden):
   `EN STOCK` → `EN PREPARACION` → `EN ENVIO` → `ENTREGADO` / `PAGADO`.
   `ENTREGADO` y `PAGADO` los marca el chofer.
5. **Vista de choferes:** interfaz mobile para que los 3 repartidores vean su
   ruta y marquen entregados/pagados.

## Roles de usuario
- **Admin:** alta de pedidos, normalización, confirmación visual, gestión de duplicados, despacho.
- **Chofer:** ver ruta del día, marcar pedidos como ENTREGADO / PAGADO.

## Stack (decidido por el equipo)
- **Frontend:** React 19 + Vite 8 (JS).
- **Backend:** Node 24 + Express 5 (CommonJS) + mysql2.
- **Base de datos:** MySQL 8.4.
- **Infraestructura:** Docker Compose (3 servicios: `mysql`, `backend`, `frontend`).
- **Autenticación:** JWT (decisión tomada) — roles admin/chofer.

## Decisiones pendientes (NO asumir, preguntar al grupo)
- **API de mapas:** a definir (candidatas: Leaflet + OpenStreetMap/Nominatim,
  Google Maps, Mapbox). El código que la use debe quedar aislado en una capa
  de servicio para poder cambiarla sin tocar el resto.
- **Esquema de base de datos:** a definir. Candidato propuesto:
  `usuarios`, `clientes`, `direcciones`, `pedidos`. No crear tablas ni modelo
  aún sin consultar.

## Estado actual del repo (al momento de clonar)
- Docker Compose y Dockerfiles funcionando (hechos por un compañero).
- Backend: solo conecta a MySQL y responde en `/` ("Backend de MandáTodo...").
- Frontend: scaffold por defecto de Vite. Sin rutas ni vistas.
- **Pendiente:** esquema BD, endpoints API, login/roles, mapa, y todas las vistas.

## Reglas de trabajo del grupo (CRÍTICO — aplicar siempre)
Es un TP universitario que se defiende en vivo frente a los profesores. Por eso:
1. No dar solo código: explicar paso a paso cómo funciona, qué hace cada
   función y por qué se tomó cada decisión de diseño.
2. Código simple y modular. NO sobre-ingeniería.
3. Antes de decisiones críticas de arquitectura (BD, librería de mapas, etc.):
   dar opciones con pros y contras y dejar que el grupo decida.
4. Mucho énfasis en manejo de excepciones: textos de direcciones sucias y
   llamadas a APIs externas.

## Cómo correr el proyecto (cheatsheet Docker)
Requiere **Docker Desktop** (con WSL2) instalado y el engine encendido.

```powershell
# Desde la raíz del proyecto:

# 1. Levantar todo (mysql + backend + frontend)
docker compose up -d

# 2. Ver el estado de los contenedores (que estén "healthy"/"Up")
docker compose ps

# 3. Ver los logs en vivo (Ctrl+C para salir)
docker compose logs -f

# 4. Logs de un servicio puntual
docker compose logs -f backend

# 5. Frenar todo
docker compose down

# 6. Frenar todo y borrar los datos de la BD (empezar de cero)
docker compose down -v
```

URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- MySQL: localhost:3306

Nota: los archivos `.env` (raíz y `backend/.env`) NO se suben a GitHub
(están en `.gitignore`). Cada integrante crea los suyos copiando los
`.env.example`.

## Herramientas de desarrollo por máquina
- Se instalan en cada PC: `git`, Docker Desktop (con WSL2).
- Opcional (para correr backend/frontend nativos): Node 24 + npm.