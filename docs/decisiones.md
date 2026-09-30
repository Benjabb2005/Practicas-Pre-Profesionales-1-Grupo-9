# Decisiones y dudas

Actualizar fecha, responsable y evidencia al resolver; no convertir una propuesta en aceptada sin decisión del equipo.

| ID | Estado | Decisión o pendiente | Evidencia / siguiente acción |
| --- | --- | --- | --- |
| D01 | Vigente | React/Vite JS, Node/Express CommonJS, MySQL, Compose | Código y manifests; conservar stack |
| D02 | Registrada previamente | JWT como dirección de autenticación | AGENTS.md anterior; todavía sin dependencia ni contrato de sesión |
| D03 | Confirmado según entrevista resumida | Confirmación humana siempre antes de despacho; carga manual estructurada | ZIP; implementar bloqueo servidor |
| D04 | Pendiente equipo/cliente | Matriz admin/operador/chofer, transiciones y quién acredita transferencia | No asumir permisos iguales por controles de demo |
| D05 | Pendiente equipo | Reconciliar SQL con roles, estados, DNI, asignación, confirmación versionada y pago | Diseñar migración no destructiva antes de aplicar |
| D06 | Pendiente equipo | Proveedor geográfico y librería de mapa | Comparar cobertura, precisión, licencias, límites, costos y retención con docs oficiales; default georef no decide |
| D07 | Pendiente cliente/docentes | Pantalla independiente ABM Clientes en MVP 1 | Separarla de datos del pedido y frecuentes; aclarar CRUD académico |
| D08 | Pendiente cliente | Campos obligatorios: DNI, CP, provincia y alternativa cuando falta DNI | Provincia ausente en demo; distinguir CABA de provincia de Buenos Aires |
| D09 | Pendiente cliente | Borradores incompletos, cancelación, entrega fallida y reintentos | No despachar mientras falta información |
| D10 | Propuesta técnica | Invalidar confirmación si cambia dirección; identificar responsable y versión | Incluir en criterios de T04/T05 y acordar modelo |
| D11 | Pendiente cliente | Duplicado de pedido y resolución de discrepancias de frecuentes | DNI o dirección compartida no autorizan fusionar envíos |
| D12 | Pendiente docentes/equipo | Reporte mínimo Hito 2 y calendario | Separar entrega académica de MVP comerciales |
| D13 | Adoptada en preparación | Una fuente AGENTS.md; skills canónicas .agents/skills; adaptadores Claude generados y comprobados | Compatibilidad documentada, sin instalar agentes ni dependencias |
| D14 | Límite vigente | No implementar negocio, commit/push/merge/deploy, borrar datos/volúmenes ni instalar globales en esta preparación | Pedido del usuario |
| D15 | Diferida por usuario, 30/09/2026 | Dejar pendiente revisión autenticada de demo y código remoto | Respuesta explícita al solicitar acceso seguro; retomar T08 con sesión de prueba, código autorizado o capturas/exportación, nunca contraseñas por chat |
| D16 | Adoptada en integración, 30/09/2026 | Integrar ZIP actualizado preservando trabajo local | Git ya modificado, docs y seis skills existentes; solo actualizar instrucciones/documentación, separar resultados históricos de verificaciones nuevas |
| D17 | Adoptada en preparación, 30/09/2026 | Reglas de trabajo siempre activas en el `AGENTS.md` raíz, con un `AGENTS.md` por carpeta técnica | `backend/AGENTS.md` y `backend/CLAUDE.md` nuevos para cerrar la asimetría con frontend; los archivos por carpeta complementan al raíz, no lo reemplazan |

Histórico corregido: AGENTS.md decía frontend scaffold y esquema inexistente; ambos estaban desactualizados. Se incorporó operador, se retiró la secuencia rígida de estados y la atribución definitiva de PAGADO al chofer. Se quitó el comando destructivo de volúmenes de la guía. Se conservaron simplicidad, explicación para defensa, tratamiento de errores externos y decisión humana en arquitectura.

D10: invalidar la confirmación tras editar dirección es un criterio técnico requerido por esta preparación; sigue pendiente definir su representación, responsable y auditoría en el modelo. Esto no demuestra que el código actual lo implemente.
