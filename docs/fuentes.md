# Fuentes revisadas y límites

Fecha: 30/09/2026. Este repositorio es la única fuente de contexto. El material original que no se versiona (enunciados, Excel, capturas, ZIP) se deja en `temp/`, que está ignorada. El inventario siguiente proviene de la preparación anterior, salvo la fila del ZIP actualizado y la reinspección del código. No exigir una ruta personal para usar estas síntesis.

## Dónde vive el material original

La carpeta `temp/` del repositorio, vacía y conservada por un `.gitkeep`, recibe los archivos que el equipo quiere compartir sin versionarlos: enunciados en PDF, el Excel del Caso 7, capturas y los ZIP de contexto. Su contenido está ignorado, así que nunca entra en un commit, pero cada clon del proyecto tiene la carpeta disponible.

Los ZIP `PPP1-contexto-para-Codex.zip` y `PPP1-contexto-para-Codex (1).zip` están en `temp/`. Se leyeron directamente del archivo, sin extraerlos sobre el repo. Para consultar uno, abrirlo con el visor del sistema o expandirlo en `temp/`; nunca sobre `docs/`, `frontend/` o `backend/`.

Si falta un original, el trabajo documental puede seguir igual: las síntesis de este repositorio son suficientes. Pedir el archivo solo cuando una tarea necesite el dato crudo, y dejar anotado en la tarea que no se pudo verificar.

| Fuente | Revisión y uso |
| --- | --- |
| PPP1-contexto-para-Codex (1).zip | Fuente actual, en `temp/`: leídos AGENTS.md, docs/contexto.md y docs/pantallas.md directamente del ZIP. Integrados por comparación con los archivos existentes, sin extracción sobre el repo. No reemplaza decisiones documentadas ni autoriza acciones externas |
| PPP1-contexto-para-Codex.zip | En `temp/`. Leídos AGENTS.md, LEEME y docs/contexto.md, docs/pantallas.md. Integración, no copia ciega |
| Enunciado TP integrador Sistema de Normalización y Geolocalización de Direcciones de Envío.pdf | Depositar en `temp/`. Dos páginas extraídas: caso, carta del cliente, errores de domicilios/estados/clientes y mapa |
| Enunciado Trabajo Cuatrimestral Prácticas Pre Profesionales 1 (PPP 1).pdf | Depositar en `temp/`. Tres páginas extraídas: roles académicos, ramas/PR, importación histórica, hitos y aprobación integral |
| Caso 7 Normalizacion_geolocalizacion.xlsx | Depositar en `temp/`. Inspección de hojas, encabezados y dimensiones, sin editar. No se auditó cada dato ni se ejecutó limpieza |
| Hito 0 (relevamiento del equipo) | Propuesta histórica; sus supuestos fueron superados por las entrevistas. Conflictos registrados en [contexto](contexto.md) |

Docs del grupo: https://docs.google.com/document/d/1T1IWxKWTjw7s0UfWKia6gO66ly1Mhf-9FmQuP5Hb200 . El ZIP informa una lectura previa vía Drive con modificación 23/09/2026; no se volvió a verificar su contenido remoto. Las entrevistas se citan como resumidas allí.

Demo: https://demo-tp.vercel.app/ . Se comprobó login público en navegador. Las observaciones de sesiones anteriores provienen del ZIP; ver pantallas.

## Inventario estructural del Excel recibido de la revisión anterior (sin datos personales)

Cada hoja tiene 13 filas incluyendo encabezado: 12 registros, sin afirmar que todos sean válidos.

- Pedidos, 11 columnas: pedido_id, fecha_ingreso, calle, numero, piso_depto, localidad, provincia, codigo_postal, cliente_id, estado, notas_operador.
- Clientes, 7 columnas: cliente_id, nombre_completo, telefono, email, tipo_cliente, direccion_fiscal, fecha_alta. No incluye DNI: no inventarlo para migrar.
- Historial_Geo, 10 columnas: intento_id, pedido_id, direccion_enviada_a_api, resultado_api, latitud, longitud, confianza_score, direccion_normalizada_api, operador_que_reviso, fecha_intento.

La migración necesita preservar códigos originales, hoja/fila, texto recibido e intentos. Direcciones normalizadas de la API y fechas originales no tienen equivalencia completa en el SQL actual. Mapear después de aprobar esquema; no inferir confirmación humana por score.

Los originales no se versionan, así que un clon nuevo no los trae. Para importar o contrastar de nuevo, el equipo los deposita en `temp/`; no asumir acceso al historial de ChatGPT ni a carpetas de otra máquina. Las síntesis versionadas de este repositorio permiten el trabajo cotidiano sin esos adjuntos.

## Reconciliación del ZIP actualizado

- Se conservaron contexto de entrevistas, separación de alcances de Clientes, carga manual y confirmación humana. El relevamiento de pantallas coincide sustancialmente con el existente: no se sustituyó por una copia menos contextualizada.
- Se reforzó AGENTS.md con jerarquía explícita, referencia final, obligaciones académicas, entrega y enlaces mantenibles. Se mantuvieron JWT como decisión previa y las dudas del modelo, sin reimponer los estados rígidos del AGENTS histórico.
- Se corrigió la atribución temporal: Git estaba modificado al iniciar esta integración; los tests HTTP, skills y adaptadores ya existían. Los resultados previos se conservan como históricos, separados de la verificación actual.
- El usuario dejó pendiente revisar la demo autenticada. El login público se observó nuevamente; el resto sigue siendo evidencia recibida, no pruebas repetidas.
