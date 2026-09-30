---
name: ppp1-verificar
description: Verificar cambios PPP1, diagnosticar fallos y cerrar una tarea con evidencias, revisión de permisos y documentación para el siguiente agente.
---

# Verificación, diagnóstico y continuidad

## Contexto
Leer `docs/verificacion.md`, `docs/arquitectura.md`, `docs/tareas.md`, `docs/decisiones.md` y el diff actual. No atribuir a esta tarea cambios de otros integrantes.

## Procedimiento
1. Relacionar cada criterio de aceptación con una prueba observable. Revisar alcance y decisiones; diferenciar regresión nueva, fallo preexistente y servicio indisponible.
2. Ejecutar npm run check desde raíz. Si se editaron skills, npm run skills:sync cuando se use Claude y npm run skills:check. No ocultar comandos fallidos detrás de un último comando exitoso.
3. Para negocio, verificar validaciones y autorización servidor, ID de otro chofer, dirección sin confirmar o cambiada, duplicados y consistencia de transacciones según el cambio. No agregar pruebas que solo comparen texto del código.
4. Si falla: reproducir con entrada mínima sintética, capturar error sin secretos, seguir petición UI → API → DB/adaptador y comprobar entorno. Modificar causa mínima, repetir caso fallido y regresiones relevantes.
5. Para infraestructura, docker compose config --quiet y docker compose ps; inspeccionar logs acotados sin difundir credenciales. Motor apagado no se arregla borrando volumen. GET / no demuestra conexión DB.
6. Revisar diff por secretos, dependencias innecesarias, errores tragados, permisos solo cliente, mocks presentados como reales y pérdida de datos. Usar git diff --check.
7. Actualizar tareas y documentos afectados con comando/fecha/resultado/límite. Cambios de reglas o arquitectura van a sus documentos; no dejar conocimiento solo en el chat.

## Verificar la propia revisión
Indicar qué criterios no se pudieron probar y por qué. Un lint/build verde no acredita flujo integral. Si no hay entorno DB/proveedor/credenciales de prueba, dejar esa comprobación pendiente sin fabricar resultado.

## Entregar
Hallazgos priorizados con archivo y efecto, correcciones, comandos reales, pruebas manuales/automatizadas, limitaciones y siguiente paso. Para un chat nuevo usar la prueba de contexto de `docs/agentes.md`; no confundir lectura manual de una skill con descubrimiento nativo.
