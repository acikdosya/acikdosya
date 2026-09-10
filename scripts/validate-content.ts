/**
 * content/ altindaki her JSON'u semaya sokar. Bozuk veri build'e gitmez.
 * pnpm validate:content — prebuild adimina bagli.
 */
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {join, relative, basename} from 'node:path';
import {z} from 'zod';
import {assetsFileSchema, systemSchema} from '../lib/schema';

const ROOT = process.cwd();
const CONTENT_DIR = join(ROOT, 'content');
const PUBLIC_DIR = join(ROOT, 'public');

const errors: string[] = [];
const todos: string[] = [];

function fail(file: string, message: string) {
  errors.push(`${file}\n  ${message.replace(/\n/g, '\n  ')}`);
}

function readJson(path: string): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(relative(ROOT, path), `JSON okunamadi: ${(error as Error).message}`);
    return undefined;
  }
}

function collectTodos(file: string, value: unknown, path: string[] = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      collectTodos(file, item, [...path, String(index)])
    );
    return;
  }
  if (value === null || typeof value !== 'object') return;

  for (const [key, child] of Object.entries(value)) {
    if (key === '_todo' && Array.isArray(child)) {
      for (const item of child) {
        todos.push(`${file} ${path.join('.') || '(kok)'} → ${String(item)}`);
      }
      continue;
    }
    collectTodos(file, child, [...path, key]);
  }
}

function validate(path: string, schema: z.ZodType, extra?: (data: never) => void) {
  const file = relative(ROOT, path);
  const raw = readJson(path);
  if (raw === undefined) return;

  const result = schema.safeParse(raw);
  if (!result.success) {
    fail(file, z.prettifyError(result.error));
    return;
  }

  collectTodos(file, raw);
  extra?.(result.data as never);
  console.log(`  ok  ${file}`);
}

if (!existsSync(CONTENT_DIR)) {
  console.error('content/ dizini yok.');
  process.exit(1);
}

console.log('Icerik dogrulaniyor...');

// --- sistemler -------------------------------------------------------------
const systemsDir = join(CONTENT_DIR, 'systems');
const systemFiles = existsSync(systemsDir)
  ? readdirSync(systemsDir).filter((name) => name.endsWith('.json'))
  : [];

if (systemFiles.length === 0) {
  errors.push('content/systems/\n  en az bir sistem dosyasi bekleniyor');
}

for (const name of systemFiles) {
  const path = join(systemsDir, name);
  validate(path, systemSchema, (system: z.infer<typeof systemSchema>) => {
    const expected = basename(name, '.json');
    if (system.slug !== expected) {
      fail(
        relative(ROOT, path),
        `slug "${system.slug}" dosya adi "${expected}" ile uyusmuyor`
      );
    }
  });
}

// --- gorsel lisans kaydi ---------------------------------------------------
const assetsPath = join(CONTENT_DIR, 'assets.json');
if (!existsSync(assetsPath)) {
  errors.push('content/assets.json\n  dosya yok — bos kayit bile olsa bulunmali');
} else {
  validate(assetsPath, assetsFileSchema, (data: z.infer<typeof assetsFileSchema>) => {
    for (const asset of data.assets) {
      if (!existsSync(join(PUBLIC_DIR, asset.file))) {
        fail('content/assets.json', `kayitli gorsel diskte yok: public/${asset.file}`);
      }
    }
  });
}

// --- beklenmeyen dosya -----------------------------------------------------
const known = new Set(['assets.json']);
for (const entry of readdirSync(CONTENT_DIR, {withFileTypes: true})) {
  if (entry.isDirectory() && entry.name !== 'systems') {
    errors.push(`content/${entry.name}/\n  taninmayan dizin — semasi yok`);
  }
  if (entry.isFile() && !known.has(entry.name)) {
    errors.push(`content/${entry.name}\n  taninmayan dosya — semasi yok`);
  }
}

// --- rapor -----------------------------------------------------------------
if (todos.length > 0) {
  console.log(`\n${todos.length} eksik alan (_todo):`);
  for (const todo of todos) console.log(`  · ${todo}`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} hata:\n`);
  for (const error of errors) console.error(`✗ ${error}\n`);
  process.exit(1);
}

console.log('\nIcerik dogrulandi.');
