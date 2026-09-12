/**
 * content/ altindaki her JSON'u semaya sokar. Bozuk veri build'e gitmez.
 * pnpm validate:content — prebuild adimina bagli.
 */
import {readFileSync, readdirSync, existsSync} from 'node:fs';
import {join, relative, basename} from 'node:path';
import {z} from 'zod';
import {selectMeasurements} from '../lib/geometry/measurements';
import {partsForSystem} from '../lib/geometry/parts-for';
import {describeIssue, revisionIssues} from '../lib/revisions';
import {SPEC_UNITS} from '../lib/format';
import {assetsFileSchema, specKeys, systemSchema} from '../lib/schema';
import {markedDivergence} from '../lib/stats';

const ROOT = process.cwd();
const CONTENT_DIR = join(ROOT, 'content');
const PUBLIC_DIR = join(ROOT, 'public');

const errors: string[] = [];
const todos: string[] = [];
/**
 * Derlemeyi DUSURMEYEN bulgular.
 *
 * Bazi eksiklikler mesru bir karar olabilir: menzil beyani tasiyan bir
 * dosyanin halka kaydi tasimamasi "unutuldu" da demek olabilir, "bu
 * deger yaricap iddiasi tasimiyor" da. Ikisini ayirt edemeyiz, o yuzden
 * hata degil uyari veriyoruz — gorunur olsun ama derlemeyi kesmesin.
 */
const warnings: string[] = [];

function fail(file: string, message: string) {
  errors.push(`${file}\n  ${message.replace(/\n/g, '\n  ')}`);
}

function warn(file: string, message: string) {
  warnings.push(`${file}\n  ${message.replace(/\n/g, '\n  ')}`);
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

/** Ana sayfa isaretcisini tasiyan dosyalar — en fazla biri olabilir. */
const heroMarked: string[] = [];

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

    /*
     * Ana sayfa isaretcisi gercekten iraksayan bir alani gosteriyor mu.
     *
     * Panelin birinci katmani iraksama anlatir; isaret edilen alan
     * iraksamiyorsa panel o konuyu cizemez ve sessizce baska bir seye
     * duserdi. Editoryal karar yazili, o yuzden karsiligi da olmali.
     */
    if (system.hero) {
      heroMarked.push(relative(ROOT, path));

      if (!markedDivergence(system)) {
        const where = system.hero.variant
          ? `${system.hero.variant} grubunda `
          : '';
        fail(
          relative(ROOT, path),
          `hero isaretcisi "${system.hero.field}" alanini gosteriyor ama ${where}o alan iraksamiyor\n` +
            '  panelin birinci katmani iraksama anlatir; gosterecek bir sey yoksa isaretci yaniltir'
        );
      }
    }

    /*
     * Menzil beyani var ama halka kaydi yok.
     *
     * Iki mesru okuma var ve ayirt edemiyoruz: deger yaricap iddiasi
     * tasimiyor olabilir (AKINCI'nin operasyonel menzili boyle), ya da
     * kayit yazilmasi unutulmus olabilir. Bu yuzden HATA DEGIL uyari —
     * halka cizmemek bir karar, sessiz kalmak degil.
     */
    const rangeFields = specKeys.filter((key) => SPEC_UNITS[key] === 'km');
    const carriesRange = [
      system.specs,
      ...system.variants.map((variant) => variant.specs)
    ].some((specs) =>
      rangeFields.some((key) => specs?.[key] !== undefined)
    );
    if (carriesRange && !system.range_ring) {
      warn(
        relative(ROOT, path),
        'menzil beyani var ama halka kaydi (range_ring) yok — halka cizilmeyecek\n' +
          '  yaricap iddiasi tasimayan bir deger icin bu dogru karardir, yazilmasi unutulduysa degil'
      );
    }

    /*
     * Hava savunma sisteminde halka fuzenin menzilinden cizilemez.
     *
     * Fuze menzili tek yon ucus erisimi; sistemin onleme menzili ise her
     * yone gecerli angajman yaricapi. Buyuk olani cizmek sistemin
     * yapabildiginden fazlasini iddia eder (specs/range-envelope).
     */
    if (
      system.category === 'hava-savunma-sistemi' &&
      system.range_ring?.field === 'range_km'
    ) {
      fail(
        relative(ROOT, path),
        'hava savunma sisteminde halka range_km alanindan cizilemez\n' +
          '  fuze menzili tek yon ucus erisimi; halka sistem onleme menzilinden cizilir'
      );
    }

    /*
     * Defter ile tablo tutuyor mu — lib/revisions.ts.
     *
     * Bir alanin en son duzeltmesi "yeni deger su" diyorsa o deger
     * dosyada duruyor olmali. Ayrismis bir defter, tutulmayan bir
     * defterden daha kotudur: okuyucuya iki ayri sey soyler.
     */
    for (const issue of revisionIssues(system)) {
      fail(relative(ROOT, path), describeIssue(issue));
    }

    /*
     * Etiketin gosterdigi parca gercekten uretiliyor mu.
     *
     * Sema yalnizca kimligin BICIMINI dogrular; var olup olmadigini
     * dogrulayamaz, cunku parca listesi olculerden turer. Yanlis yerde
     * duran bir etiket, hic olmayan bir etiketten daha kotudur — o
     * yuzden derlemeyi burada durduruyoruz.
     */
    for (const selection of selectMeasurements(system)) {
      const variant = system.variants.find(
        (item) => item.id === selection.group.id
      );
      const annotations = variant?.annotations ?? [];
      if (annotations.length === 0) continue;

      const parts = partsForSystem(
        system.slug,
        selection.group.id,
        selection.dimensions
      );
      if (!parts) {
        fail(
          relative(ROOT, path),
          `"${selection.group.id}" etiket tasiyor ama parca listesi uretilemiyor`
        );
        continue;
      }

      const ids = new Set(parts.map((part) => part.id));
      for (const annotation of annotations) {
        if (!ids.has(annotation.part)) {
          fail(
            relative(ROOT, path),
            `etiket "${annotation.id}" olmayan bir parcayi gosteriyor: "${annotation.part}"\n` +
              `  uretilen parcalar: ${[...ids].join(', ')}`
          );
        }
      }
    }
  });
}

/*
 * Ana sayfa tek bir konu anlatir. Iki dosya birden isaretlenmisse hangisinin
 * cizilecegi dosya sirasina kalirdi — yani karar yine koda geri kacardi.
 */
if (heroMarked.length > 1) {
  errors.push(
    `content/systems/\n  birden fazla dosya hero isaretcisi tasiyor: ${heroMarked.join(', ')}\n` +
      '  ana sayfa tek konu anlatir, isaretci de tek olmali'
  );
}

// --- varlik lisans kaydi ---------------------------------------------------
/**
 * Kontrol iki yonlu — CLAUDE.md §5.6.
 *  kayit -> disk : kayitli dosya gercekten duruyor mu (bayat kayit yakalanir)
 *  disk -> kayit : public/ altindaki her dosyanin kaydi var mi (lisanssiz
 *                  dosya sizmasin). assets.json'daki _rule bunu vaat ediyor.
 */
function walkFiles(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir, {withFileTypes: true})) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, out);
    else out.push(relative(ROOT, full));
  }
  return out;
}

const assetsPath = join(CONTENT_DIR, 'assets.json');
if (!existsSync(assetsPath)) {
  errors.push('content/assets.json\n  dosya yok — bos kayit bile olsa bulunmali');
} else {
  validate(assetsPath, assetsFileSchema, (data: z.infer<typeof assetsFileSchema>) => {
    // Yollar repo kokune gore yazilir; public/ disindaki varliklar da kayitli
    // (fontlar app/_fonts altinda duruyor).
    for (const asset of data.assets) {
      if (asset.presence !== 'committed' || asset.file === null) continue;
      if (!existsSync(join(ROOT, asset.file))) {
        fail('content/assets.json', `kayitli varlik diskte yok: ${asset.file}`);
      }
    }

    if (existsSync(PUBLIC_DIR)) {
      // 'generated' kayitlar dizin yolu tasiyabilir; altindaki her sey dahil.
      const covered = data.assets
        .map((asset) => asset.file)
        .filter((file): file is string => file !== null);

      for (const file of walkFiles(PUBLIC_DIR)) {
        const registered = covered.some(
          (entry) => entry === file || (entry.endsWith('/') && file.startsWith(entry))
        );
        if (!registered) {
          fail(
            'content/assets.json',
            `kaydi olmayan dosya: ${file}\n  lisansi bilinmeyen dosya yayina gitmez`
          );
        }
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

if (warnings.length > 0) {
  console.log(`\n${warnings.length} uyari:`);
  for (const warning of warnings) console.log(`  ! ${warning}`);
}

if (errors.length > 0) {
  console.error(`\n${errors.length} hata:\n`);
  for (const error of errors) console.error(`✗ ${error}\n`);
  process.exit(1);
}

console.log('\nIcerik dogrulandi.');
