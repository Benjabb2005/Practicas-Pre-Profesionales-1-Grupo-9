# Reglas del backend — MandáTodo Logística

## Alcance
- Seguir primero el `AGENTS.md` de la raíz; este archivo agrega lo específico del servidor y no reemplaza las reglas comunes.
- Para una tarea solo de backend, trabajá en `backend/`. Una tarea vertical autorizada puede tocar también frontend, `database/`, pruebas y documentación.
- El backend usa Node 24, Express 5 y CommonJS (`require`/`module.exports`). No migrar a ESM ni a TypeScript sin acordarlo; no agregar dependencias sin justificar el motivo.
- Mantener la separación actual: `app.js` es Express puro, sin base de datos, y `index.js` arranca el servidor y conecta MySQL. Todo lo que se pueda probar sin base va en `app.js`.
- `database/init.sql` es el DDL inicial, no una migración. No lo reejecutes ni lo modifiques sin una tarea explícita de datos.

## Prácticas de implementación
- Validar en el servidor todo lo que llega del cliente: permisos, rol, pertenencia del recurso y formato. Un chequeo en la interfaz no es seguridad.
- Aplicar mínimo privilegio por rol y por recurso: un chofer no debe poder leer ni escribir pedidos ajenos. Autorización en la capa de servidor, no en el cliente.
- Usar SQL parametrizado siempre. No concatenar entrada del usuario en consultas ni en nombres de tabla o columna.
- Hashear contraseñas. No guardar, registrar ni devolver contraseñas, tokens o datos personales en código, logs, respuestas o pruebas.
- Leer configuración desde `process.env`, con valores de ejemplo ficticios en `.env.example`. No agregar secretos al repositorio.
- Devolver errores uniformes y sin detalles sensibles. No filtrar mensajes de MySQL ni stack traces al cliente.
- Conservar datos de origen y trazabilidad: no sobrescribir ni fusionar registros en silencio. La confirmación de dirección se invalida si la dirección cambia, y la dirección incompleta nunca habilita el despacho.
- Código simple y modular. No crear capas, repositorios ni abstracciones vacías para una única consulta.

## Verificación
- Desde `backend/`: `npm run check` valida sintaxis y `npm test` corre las pruebas con `node --test`. Desde la raíz, `npm run check` encadena todo.
- La prueba HTTP actual comprueba que la app levanta sin MySQL y que una ruta inexistente no responde con éxito. No acredita permisos, validaciones ni integridad.
- Agregar pruebas significativas para cada regla de negocio nueva, sobre todo autorización por rol y recurso, validación de entradas, duplicados potenciales e integridad referencial. Cubrir casos de éxito, rechazo y fallo.
- No ejecutar SQL ni migraciones contra una base que pueda tener datos. Nunca usar `DROP`, `TRUNCATE` ni `docker compose down -v` para resolver un conflicto.
- Reportar qué no pudo probarse por entorno o por falta de acceso. Criterios y evidencia en `docs/verificacion.md`.
