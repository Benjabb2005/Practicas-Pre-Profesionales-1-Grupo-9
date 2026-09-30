import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = fileURLToPath(new URL('../.agents/skills/', import.meta.url));
const target = fileURLToPath(new URL('../.claude/skills/', import.meta.url));
const check = process.argv.includes('--check');
const marker = '<!-- Generado por npm run skills:sync; editar la fuente .agents/skills. -->\n';
const names = readdirSync(source).filter((name) => existsSync(join(source, name, 'SKILL.md')));
let failures = 0;
for (const name of names) {
  const input = readFileSync(join(source, name, 'SKILL.md'), 'utf8');
  const end = input.indexOf('\n---', 4);
  if (end < 0) throw new Error(`Frontmatter inválido: ${name}`);
  const expected = input.slice(0, end + 4) + '\n' + marker + input.slice(end + 4);
  const output = join(target, name, 'SKILL.md');
  const current = existsSync(output) ? readFileSync(output, 'utf8') : null;
  if (check) {
    if (current !== expected) {
      console.error(`Copia ausente/desactualizada: ${name}. Ejecutar npm run skills:sync.`);
      failures++;
    }
  } else {
    if (current !== null && !current.includes(marker.trim())) {
      throw new Error(`No se sobrescribe una skill manual: ${output}`);
    }
    mkdirSync(join(target, name), { recursive: true });
    writeFileSync(output, expected);
  }
}
if (existsSync(target)) {
  for (const name of readdirSync(target)) {
    const path = join(target, name, 'SKILL.md');
    if (!names.includes(name) && existsSync(path) && readFileSync(path, 'utf8').includes(marker.trim())) {
      console.error(`Copia generada huérfana: ${name}. Revisarla manualmente; no se borra automáticamente.`);
      failures++;
    }
  }
}
if (failures) process.exitCode = 1;
else console.log(`${names.length} skills ${check ? 'verificadas' : 'sincronizadas'} para Claude Code.`);
