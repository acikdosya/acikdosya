import {readFileSync, readdirSync} from 'node:fs';
import {join} from 'node:path';
import {systemSchema, type System} from './schema';

const SYSTEMS_DIR = join(process.cwd(), 'content', 'systems');

/**
 * Icerik build zamaninda okunur ve semadan gecirilir.
 * pnpm validate:content ayni semayi kullanir; burasi ikinci savunma hatti.
 */
export function getSystemSlugs(): string[] {
  return readdirSync(SYSTEMS_DIR)
    .filter((name) => name.endsWith('.json'))
    .map((name) => name.replace(/\.json$/, ''))
    .sort();
}

export function getSystem(slug: string): System | undefined {
  if (!getSystemSlugs().includes(slug)) return undefined;

  const raw: unknown = JSON.parse(
    readFileSync(join(SYSTEMS_DIR, `${slug}.json`), 'utf8')
  );
  return systemSchema.parse(raw);
}
