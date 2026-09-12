import assert from 'node:assert/strict';
import {readdirSync, readFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';

/**
 * Uretilmis gorselde harita kesiti yok — CLAUDE.md §5.9.
 *
 * Etkilesimli harita yer adlarini tasiyabilir; sinir URETILMIS gorselde
 * cizilir. Paylasim kartlari ve OG gorselleri ekran goruntusu olarak
 * dolasir ve baglamindan kopar. Menzil halkasinin bir yerlesim uzerinden
 * gectigi tek bir kare, korunmak istenen sinirin ta kendisini deler.
 *
 * Test statik: kart ve OG kaynaklarinda harita katmanina dair bir ice
 * aktarma ya da halka cizimi araniyor. Cizilen pikseli sinamiyor —
 * amaci bir gerilemeyi degil, bir KARARI sabitlemek: bu dosyalar harita
 * katmanini hic tanimamali.
 */

const FORBIDDEN: Array<[pattern: RegExp, why: string]> = [
  [/from '.*maplibre/i, 'harita kitapligi ice aktarilmis'],
  [/range-envelope/, 'menzil zarfi katmani ice aktarilmis'],
  [/\bgeodesicRing\b/, 'jeodezik halka cizimi kullanilmis'],
  [/\bbuildRings\b/, 'halka listesi kurulmus'],
  [/\/tiles\//, 'harita paketine baglanilmis']
];

function sourcesIn(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      sourcesIn(path, out);
      continue;
    }
    if (!/\.tsx?$/.test(entry.name)) continue;
    if (entry.name.includes('.test.')) continue;
    out.push(path);
  }
  return out;
}

/** Uretilmis gorsel ureten her yol: paylasim kartlari, OG ve ikonlar. */
function generatedImageSources(): string[] {
  const root = process.cwd();
  const files = [
    ...sourcesIn(join(root, 'lib', 'cards')),
    ...sourcesIn(join(root, 'app', '[locale]', 'kart')),
    join(root, 'lib', 'og.tsx'),
    join(root, 'app', '[locale]', 'opengraph-image.tsx'),
    join(root, 'app', '[locale]', 'sistemler', '[slug]', 'opengraph-image.tsx')
  ];

  return files;
}

test('paylasim gorselleri harita katmanini hic tanimaz', () => {
  const offenders: string[] = [];

  for (const path of generatedImageSources()) {
    const source = readFileSync(path, 'utf8');
    for (const [pattern, why] of FORBIDDEN) {
      if (pattern.test(source)) {
        offenders.push(`${path.replace(process.cwd() + '/', '')}: ${why}`);
      }
    }
  }

  assert.deepEqual(offenders, [], 'uretilmis gorselde harita izi var');
});

test('kontrol bos calismiyor — taranan dosya var', () => {
  const files = generatedImageSources();
  assert.ok(files.length >= 8, `yalnizca ${files.length} dosya tarandi`);

  // Desenlerin gercekten calistigini goster: harita bileseni yakalanmali.
  const map = readFileSync(
    join(process.cwd(), 'components', 'range-envelope', 'RangeEnvelopeMap.tsx'),
    'utf8'
  );
  assert.ok(
    FORBIDDEN.some(([pattern]) => pattern.test(map)),
    'desenler harita bileseninde bile eslesmiyor'
  );
});
