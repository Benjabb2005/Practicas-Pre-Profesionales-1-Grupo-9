# Decisiones y dudas

Actualizar fecha, responsable y evidencia al resolver; no convertir una propuesta en aceptada sin decisión del equipo.

| ID | Estado | Decisión o pendiente | Evidencia / siguiente acción |
| --- | --- | --- | --- |
| D01 | Vigente | React/Vite JS, Node/Express CommonJS, MySQL, Compose | Código y manifests; conservar stack |
| D02 | Implementada, 13/10/2026 | JWT HS256, cookie HttpOnly, sesión persistida/revocable de 8 horas; hash scrypt | Corte autorizado de acceso. [Contrato y límites](acceso-y-entorno.md) |
| D03 | Confirmado según entrevista resumida | Confirmación humana siempre antes de despacho; carga manual estructurada | ZIP; implementar bloqueo servidor |
| D04 | Pendiente equipo/cliente | Matriz admin/operador/chofer, transiciones y quién acredita transferencia | No asumir permisos iguales por controles de demo |
| D05 | Pendiente equipo | Reconciliar SQL con roles, estados, DNI, asignación, confirmación versionada y pago | Diseñar migración no destructiva antes de aplicar |
| D06 | Evaluación aprobada, 13/10/2026 | Georef con Leaflet y cartografía OSM para demo | Usuario acepta opción; documentación en T01; cobertura/precisión e integración real pendientes |
| D07 | Definida por usuario, 13/10/2026 | ABM independiente de Clientes para MVP 2 | Retirado de H1; datos del cliente dentro de pedido separados. Aclarar CRUD académico con docentes |
| D08 | Definida, 13/10/2026 | Nombre/apellido, DNI, teléfono, email, calle, altura positiva, localidad, provincia y CP obligatorios en pedidos nuevos; Piso/Depto y notas opcionales | Usuario reiteró Piso/Departamento opcional al confirmar la lista; no imponer DNI retroactivo ni inventarlo para histórico |
| D09 | Parcialmente definida, 13/10/2026 | No permitir pedidos nuevos incompletos | Usuario rechaza borradores. Cancelación/fallos/reintentos pendientes; histórico se conserva con revisión, sin habilitar despacho |
| D10 | Propuesta técnica | Invalidar confirmación si cambia dirección; identificar responsable y versión | Incluir en criterios de T04/T05 y acordar modelo |
| D11 | Parcialmente definida por usuario, 13/10/2026 | No crear dos clientes con DNI/email/teléfono coincidentes; aviso y selección de frecuente, sin registrar aparte | Servidor compara identidad normalizada. Varios pedidos para una misma persona permitidos; duplicidad comercial de envíos sigue pendiente |
| D12 | Pendiente docentes/equipo | Reporte mínimo Hito 2 y calendario | Separar entrega académica de MVP comerciales |
| D13 | Adoptada en preparación | Una fuente AGENTS.md; skills canónicas .agents/skills; adaptadores Claude generados y comprobados | Compatibilidad documentada, sin instalar agentes ni dependencias |
| D14 | Preparación histórica superada parcialmente, 13/10/2026 | Usuario autoriza implementar por etapas en branch-benjamin-1 y aplicar sesiones con respaldo | Sin autorización de commit/push/merge/deploy, borrado de datos/volúmenes ni instalación global |
| D15 | Diferida por usuario, 30/09/2026 | Dejar pendiente revisión autenticada de demo y código remoto | Respuesta explícita al solicitar acceso seguro; retomar T08 con sesión de prueba, código autorizado o capturas/exportación, nunca contraseñas por chat |
| D16 | Adoptada en integración, 30/09/2026 | Integrar ZIP actualizado preservando trabajo local | Git ya modificado, docs y seis skills existentes; solo actualizar instrucciones/documentación, separar resultados históricos de verificaciones nuevas |
| D17 | Adoptada en preparación, 30/09/2026 | Reglas de trabajo siempre activas en el `AGENTS.md` raíz, con un `AGENTS.md` por carpeta técnica | `backend/AGENTS.md` y `backend/CLAUDE.md` nuevos para cerrar la asimetría con frontend; los archivos por carpeta complementan al raíz, no lo reemplazan |

Histórico corregido: AGENTS.md decía frontend scaffold y esquema inexistente; ambos estaban desactualizados. Se incorporó operador, se retiró la secuencia rígida de estados y la atribución definitiva de PAGADO al chofer. Se quitó el comando destructivo de volúmenes de la guía. Se conservaron simplicidad, explicación para defensa, tratamiento de errores externos y decisión humana en arquitectura.

D10: invalidar la confirmación tras editar dirección es un criterio técnico requerido por esta preparación; sigue pendiente definir su representación, responsable y auditoría en el modelo. Esto no demuestra que el código actual lo implemente.

13/10: D05 resuelta para sesiones/schema_migrations y carga inicial de pedidos mediante dos autorizaciones explícitas y respaldos. 002 conserva filas y agrega apellido/DNI nullable para histórico, Piso/Depto y clave/hash de creación idempotente. No hay dirección versionada/confirmación aún. D04 implementada para acceso y carga/consulta admin/operador; chofer, transiciones y pagos pendientes. Clientes independiente para MVP 2. D08 cerrada por respuesta posterior; el modelo completo de [T01](hito-1-contrato.md) sigue siendo propuesta.

13/10, solicitud posterior: D04 se amplía con creación/listado de cuentas exclusivamente por admin desde Usuarios, sin registro público. D02 conserva sesión/hashes actuales; setup-admin local interactivo simplifica la primera cuenta. Roles admin/operador; chofer, edición, baja/reset de cuenta pendientes. No se modifica esquema ni se crean usuarios reales automáticamente durante la implementación; pruebas solo en base aislada.
