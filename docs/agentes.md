# Compatibilidad de agentes · consulta 30/09/2026

## Configuración compartida

AGENTS.md contiene reglas; docs contiene contexto; .agents/skills es fuente única de procedimientos. No se instaló ni configuró globalmente ninguna herramienta. Abrir siempre la raíz de este repositorio.

| Herramienta | Instrucciones | Skills del proyecto | Comprobación |
| --- | --- | --- | --- |
| Codex CLI / app | AGENTS.md; overrides y reglas más próximas pueden prevalecer | .agents/skills | Reiniciar chat en el repo, listar skills y pedir resumen con archivos leídos |
| Codex en VS Code | Misma cadena de instrucciones según carpeta de trabajo | .agents/skills | Abrir carpeta del repo, nueva sesión, selector $ o /skills y elegir ppp1-verificar |
| OpenCode | AGENTS.md; CLAUDE.md es fallback | .agents/skills | opencode debug skill --pure para descubrimiento; luego solicitar carga mediante su herramienta skill |
| Claude Code | CLAUDE.md importa @AGENTS.md; frontend/CLAUDE.md y backend/CLAUDE.md importan la regla local | .claude/skills, generadas | npm run skills:sync; /memory para instrucciones; /ppp1-verificar o preguntar qué skills están disponibles |

La lectura de enlaces no equivale a importación automática: AGENTS ordena leer los docs. OpenCode no expande por sí solo referencias Markdown. Claude usa @path para importaciones. Codex combina instrucciones desde raíz hasta cwd; leer explícitamente frontend/AGENTS.md o backend/AGENTS.md antes de editar desde raíz.

## Copias locales de Claude y cambios

`npm run skills:sync` genera las seis skills de Claude desde la fuente .agents. Estas copias se ignoran en Git; cada checkout las genera. `npm run skills:check` exige coincidencia exacta. `npm run check` comprueba sincronía si existe .claude/skills; falla por cambios o copias huérfanas. No sobrescribe skills manuales ni elimina archivos.

OpenCode también descubre .claude/skills. Para evitar la doble búsqueda cuando las copias Claude existen, iniciarlo en PowerShell así:
```powershell
$env:OPENCODE_DISABLE_CLAUDE_CODE_SKILLS = '1'
opencode
```
La variable afecta esa terminal; .agents/skills sigue siendo la fuente. No se cambió configuración global. Confirmar descubrimiento en la versión instalada antes de trabajar.

## Prueba de un chat nuevo

Pedir, sin permitir ediciones:

> Indicá raíz de trabajo, archivos de instrucciones leídos y skills PPP1 disponibles. Leé contexto, arquitectura, decisiones y tareas. Explicá qué está implementado, qué es maqueta, el bloqueo de despacho y los tres alcances de Clientes. Indicá el comando de verificación y la siguiente tarea. No modifiques archivos.

Respuesta esperada: seis skills, GET / y maqueta sin persistencia, SQL existente no aplicado automáticamente, confirmación humana siempre, ABM independiente pendiente, npm run check y T01. Elegir después una skill explícitamente y comprobar que cita pasos de su SKILL.md. Un resumen correcto tras lectura manual no demuestra descubrimiento automático.

Si falla: comprobar cwd/Git root, reiniciar, revisar override/globales y skills deshabilitadas; no duplicar reglas ni ejecutar /init sobre instrucciones existentes sin revisar.

## Verificación histórica recibida y pendiente

Los resultados de versiones y descubrimiento siguientes ya estaban documentados antes de integrar el ZIP actualizado; no se repitieron lanzamientos de agentes en esa integración. No atribuirlos a una prueba nueva.

- Archivos y referencias locales comprobables con npm run context:check; sincronización Claude comprobable con npm run skills:check.
- Codex CLI detectado: 0.154.0-alpha.6.2. No se lanzó una segunda conversación con modelo para probar carga nativa.
- OpenCode 1.18.30: el primer --version falló por acceso desde sandbox; funcionó fuera de él. Con OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1, opencode debug skill --pure reconoció las seis skills desde .agents/skills. Se comprobó descubrimiento nativo, no una conversación completa con modelo. No se cambió configuración global.
- Claude Code no se encontró en PATH. VS Code no se probó en sesión nueva. La compatibilidad está documentada, no acreditada en ejecución de esos clientes.
- No se alteraron permisos, modelos ni preferencias globales.

## Comprobación repetida en el handoff (30/09/2026, OpenCode)

- opencode --version devolvió 1.18.33 (no 1.18.30). Con `OPENCODE_DISABLE_CLAUDE_CODE_SKILLS=1`, `opencode debug skill --pure` en la raíz devolvió las seis skills de `.agents/skills` con su contenido, más la skill integrada de opencode. Descubrimiento nativo confirmado en la versión instalada.
- `codex` y `claude` siguen sin aparecer en PATH en esa máquina. No se instaló nada. La sección histórica de arriba sigue siendo la única evidencia para esos clientes.
- npm run context:check, npm run skills:check y npm run check pasaron completos. Detalle en [verificación](verificacion.md).
- Esta comprobación no reemplaza la prueba de chat nuevo de la sección anterior: demuestra que el cliente encuentra las skills, no que una conversación las use bien.

## Comprobación de la copia generada de Claude sin instalar Claude

Para verificar el puente sin tener Claude Code instalado, alcanza con los comandos de la raíz:

```powershell
npm run skills:sync
npm run skills:check
```

`skills:check` falla si falta una copia, si quedó desactualizada o si sobró una copia generada de una skill que ya no existe en la fuente. No borra ni sobrescribe skills escritas a mano. Un `.claude/skills` ausente hace que `npm run check` omita el paso sin fallar, porque las copias son artefacto local.

## Fuentes oficiales

- [Codex: AGENTS.md](https://developers.openai.com/codex/guides/agents-md/) y [skills](https://developers.openai.com/codex/skills/) (redirigen a ChatGPT Learn).
- [OpenCode: reglas](https://opencode.ai/docs/rules/) y [skills](https://opencode.ai/docs/skills/).
- [Claude Code: memoria/importaciones](https://code.claude.com/docs/en/memory) y [skills](https://code.claude.com/docs/en/skills).

Las rutas se basan en estas fuentes actuales. El bridge CLAUDE.md evita depender del fallback AGENTS de versiones recientes; las importaciones no copian reglas.

## Contraste oficial en esta integración

Se abrieron nuevamente las fuentes oficiales el 30/09/2026. Codex descubre AGENTS.md por jerarquía hasta cwd y skills en `.agents/skills/`; las skills están disponibles también en la [extensión IDE](https://developers.openai.com/codex/ide). OpenCode reconoce AGENTS.md y `.agents/skills/`: no necesita otra copia ni configuración de proyecto para esta estructura. Claude Code admite importaciones `@AGENTS.md` y skills en `.claude/skills/`. Se conserva el adaptador pequeño CLAUDE.md; las copias de skills existentes se generan desde una sola fuente y no se editan manualmente.

Formato conservado: una carpeta por skill, `SKILL.md` con frontmatter YAML `name` y `description`; nombre igual a carpeta. El chequeo local valida este subconjunto, no toda la especificación oficial. Para confirmar instrucciones en Claude puede usarse `/context` y revisar Memory files, además de `/memory` para administrarlas. En Codex/VS Code abrir la raíz Git y comenzar sesión nueva tras cambiar instrucciones. Ningún formato acredita por sí solo carga efectiva: completar la prueba de chat nuevo antes de declararla validada.
