import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('../', import.meta.url));
const required = ['AGENTS.md', 'CLAUDE.md', 'frontend/AGENTS.md', 'frontend/CLAUDE.md',
  'backend/AGENTS.md', 'backend/CLAUDE.md',
  'README.md', 'package.json', 'docker-compose.yml', 'database/init.sql', 'temp/.gitkeep',
  'backend/index.js', 'backend/app.js', 'backend/test/http.test.js',
  'scripts/check-context.mjs', 'scripts/check-backend.mjs', 'scripts/sync-skills.mjs',
  'docs/contexto.md', 'docs/arquitectura.md', 'docs/pantallas.md', 'docs/fuentes.md',
  'docs/tareas.md', 'docs/decisiones.md', 'docs/agentes.md', 'docs/desarrollo-ia.md', 'docs/verificacion.md'];
const sources = join(root, '.agents/skills');
const failures = [];
const markers = new Set(['temp/.gitkeep']); // archivos vacíos por diseño
for (const file of required) {
  const path = join(root, file);
  if (!existsSync(path)) failures.push(`Falta ${file}`);
  else if (!markers.has(file) && readFileSync(path).length === 0) failures.push(`Vacío: ${file}`);
}
const names = new Set();
if (!existsSync(sources)) failures.push('Falta .agents/skills');
else for (const entry of readdirSync(sources, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const file = join(sources, entry.name, 'SKILL.md');
  if (!existsSync(file)) { failures.push(`Falta ${file}`); continue; }
  const body = readFileSync(file, 'utf8');
  const match = body.match(/^---\r?\nname: ([a-z0-9]+(?:-[a-z0-9]+)*)\r?\ndescription: ([^\r\n]+)\r?\n---\r?\n/);
  if (!match || match[1] !== entry.name || match[1].length > 64 || match[2].length > 1024) {
    failures.push(`Frontmatter inválido: ${entry.name}`); continue;
  }
  if (names.has(match[1])) failures.push(`Skill duplicada: ${match[1]}`);
  names.add(match[1]);
  for (const reference of body.matchAll(/`((?:docs|frontend|backend|database|scripts)\/[^`]+\.(?:md|js|mjs|sql))`/g)) {
    if (!existsSync(join(root, reference[1]))) failures.push(`Referencia rota en ${entry.name}: ${reference[1]}`);
  }
}
if (!names.size) failures.push('No hay skills de proyecto');
// Un enlace relativo roto deja al agente siguiente sin el documento que necesita.
for (const file of required.filter((file) => file.endsWith('.md'))) {
  if (!existsSync(join(root, file))) continue;
  const body = readFileSync(join(root, file), 'utf8');
  for (const link of body.matchAll(/\]\(([^)\s]+)\)/g)) {
    if (/^(?:[a-z]+:|\/\/|#)/i.test(link[1])) continue;
    const target = link[1].split('#')[0];
    if (!target) continue;
    if (!existsSync(join(root, dirname(file), target))) failures.push(`Enlace roto en ${file}: ${link[1]}`);
  }
}
if (existsSync(join(root, '.claude/skills'))) {
  const result = spawnSync(process.execPath, [join(root, 'scripts/sync-skills.mjs'), '--check'], { stdio: 'inherit' });
  if (result.error || result.status !== 0) failures.push('Copias de Claude Code no sincronizadas');
}
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`Contexto y ${names.size} skills OK. Esto no demuestra carga nativa en un agente.`);
