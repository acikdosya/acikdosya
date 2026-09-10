#!/usr/bin/env node
/**
 * Kendi harita paketimizi üretir: Türkiye ve çevresi için PMTiles arşivi,
 * stil dosyası, glif ve sprite varlıkları.
 *
 * Neden gerekli: menzil zarfı yayına girerken demotiles.maplibre.org
 * üzerinden çalışıyordu, yani o bölüme inen her ziyaretçinin IP adresi
 * üçüncü tarafa gidiyordu. CLAUDE.md §6 tile'ların kendi origin'imizden
 * gelmesini şart koşuyor; bu script o borcu kapatıyor.
 *
 * Kullanım:  pnpm build:tiles          (ağ gerektirir, birkaç dakika)
 * Çıktı:     public/tiles/
 *
 * Çıktı git'te DURMAZ (.gitignore). Üretilen varlık, tıpkı GLB modelleri
 * gibi: kaydı content/assets.json içinde, dosyası sunucuya ayrıca gider.
 */

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import {
  chmod,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  rm,
  stat,
  writeFile,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { layers, namedFlavor } from '@protomaps/basemaps';
import { PALETTE } from '../lib/tokens.ts';

/* ---------------------------------------------------------------- ayarlar */

/**
 * Kapsama alanı: Türkiye ve çevresi. Menzil halkaları yüzlerce kilometre
 * uzanıyor, bu yüzden sınır ülkelerin ötesi de pakete giriyor — halkanın
 * bittiği yerde harita bitmesin.
 *
 * Ölçülen boyutlar (20260909 yapısı, z0-9):
 *   24,5–46,5 / 34–43,5  → 33 MB   (yalnızca Türkiye)
 *   22–50    / 30–47     → 69 MB   ← seçilen
 *   20–54    / 28–49     → 107 MB
 */
const BBOX = { minLon: 22, minLat: 30, maxLon: 50, maxLat: 47 };

/**
 * Sokak seviyesine inmiyoruz. Harita bir ölçüm aracı: halkanın kıyıyı
 * nerede kestiği z9'da okunur, bina ayrıntısı bu sayfada bir işe yaramaz.
 * MapLibre daha yakın zoom'larda bu tile'ları büyüterek gösterir.
 */
const MAXZOOM = 9;

/**
 * go-pmtiles sürümü ve arşivin SHA-256'sı. Sürüm yükseltilirken hash de
 * yenilenir: sha256sum ile hesaplanıp buraya yazılır. Depoda checksum
 * dosyası yayımlanmıyor, doğrulama bu yüzden bize ait.
 */
const PMTILES_CLI = {
  version: '1.31.2',
  sha256: '3ed7dbf4ec2e6dfe5e25b6f70d1ffc932729f93c86db353bf514dd71010a312f',
  url: 'https://github.com/protomaps/go-pmtiles/releases/download/v1.31.2/go-pmtiles_1.31.2_Linux_x86_64.tar.gz',
};

/**
 * Glif ve sprite varlıkları. Commit'e sabitli: "main" demek, iki ayrı
 * makinede iki ayrı harita üretmek demektir.
 */
const ASSETS_COMMIT = '028c18f713baecad011301ff7a69acc39bcc2ae7';
const ASSETS_TARBALL = `https://codeload.github.com/protomaps/basemaps-assets/tar.gz/${ASSETS_COMMIT}`;

/** Stilin kullandığı üç yüz. Dördüncüsü (Devanagari) bu haritada geçmiyor. */
const FONT_FACES = ['Noto Sans Regular', 'Noto Sans Medium', 'Noto Sans Italic'];

/** Sprite ailesi — stilin tonuyla aynı. */
const SPRITE = 'grayscale';

/**
 * Sprite'ın lisans zinciri stilin deposunda yazıyor: BSD-3-Clause (kod),
 * CC0 (görsel tasarım), bir kısım ikon için MIT (Mapzen türevi). BSD ve MIT
 * telif bildiriminin dağıtımla birlikte taşınmasını istiyor, bu yüzden metni
 * pakete koyuyoruz — CLAUDE.md §5.6.
 */
const SPRITE_LICENSE_URL = `https://raw.githubusercontent.com/protomaps/basemaps/a50c699adc60a45c899971b1e11275e61f13bfbf/LICENSE.md`;

/** Günlük planet yapısı bu kadar geriye kadar aranır. */
const BUILD_LOOKBACK_DAYS = 14;

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_DIR = path.join(ROOT, 'public/tiles');
const CACHE_DIR = path.join(ROOT, 'node_modules/.cache/tiles');

/* ------------------------------------------------------------- yardımcılar */

function log(message) {
  console.log(`  ${message}`);
}

function step(message) {
  console.log(`\n==> ${message}`);
}

async function download(url, target) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} → HTTP ${response.status}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  await writeFile(target, buffer);
  return buffer;
}

function run(command, args) {
  const result = spawnSync(command, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} → çıkış kodu ${result.status}`);
  }
}

function megabytes(bytes) {
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/* ------------------------------------------------------------------ adımlar */

/**
 * go-pmtiles ikilisini indirir ve doğrular. Önbellekte varsa yeniden
 * indirmez; hash tutmuyorsa dosya atılır, çünkü doğrulanamayan bir ikiliyi
 * çalıştırmak indirmemekten kötüdür.
 */
async function ensureCli() {
  const binary = path.join(CACHE_DIR, `pmtiles-${PMTILES_CLI.version}`);
  if (existsSync(binary)) {
    log(`önbellekte: ${path.relative(ROOT, binary)}`);
    return binary;
  }

  await mkdir(CACHE_DIR, { recursive: true });
  const archive = path.join(CACHE_DIR, 'go-pmtiles.tar.gz');
  log(`indiriliyor: go-pmtiles ${PMTILES_CLI.version}`);
  const buffer = await download(PMTILES_CLI.url, archive);

  const digest = createHash('sha256').update(buffer).digest('hex');
  if (digest !== PMTILES_CLI.sha256) {
    await rm(archive, { force: true });
    throw new Error(
      `go-pmtiles SHA-256 tutmuyor.\n  beklenen: ${PMTILES_CLI.sha256}\n  gelen:    ${digest}`,
    );
  }
  log('SHA-256 doğrulandı');

  const unpack = await mkdtemp(path.join(tmpdir(), 'pmtiles-'));
  run('tar', ['xzf', archive, '-C', unpack]);
  await cp(path.join(unpack, 'pmtiles'), binary);
  await chmod(binary, 0o755);
  await rm(unpack, { recursive: true, force: true });
  await rm(archive, { force: true });

  return binary;
}

/**
 * Protomaps günlük planet yapısını bulur. Sabit bir tarih yazmıyoruz:
 * yapılar birkaç gün sonra siliniyor, sabit adres bir hafta içinde 404 olurdu.
 */
async function resolveBuild() {
  const today = new Date();

  for (let back = 0; back < BUILD_LOOKBACK_DAYS; back += 1) {
    const day = new Date(today);
    day.setUTCDate(day.getUTCDate() - back);
    const stamp = day.toISOString().slice(0, 10).replaceAll('-', '');
    const url = `https://build.protomaps.com/${stamp}.pmtiles`;

    /* İlk baytı istiyoruz: dosya 100 GB'ın üzerinde, varlığını böyle sınıyoruz. */
    const response = await fetch(url, { headers: { Range: 'bytes=0-0' } });
    if (response.ok) {
      log(`kaynak yapı: ${stamp}`);
      return { date: stamp, url };
    }
  }

  throw new Error(
    `Son ${BUILD_LOOKBACK_DAYS} günde Protomaps günlük yapısı bulunamadı.`,
  );
}

/** Bölgeyi planet arşivinden çeker. Yalnızca gereken baytlar iner. */
async function extractRegion(cli, build) {
  const name = `turkiye-${build.date}.pmtiles`;
  const target = path.join(OUT_DIR, name);

  run(cli, [
    'extract',
    build.url,
    target,
    `--bbox=${BBOX.minLon},${BBOX.minLat},${BBOX.maxLon},${BBOX.maxLat}`,
    `--maxzoom=${MAXZOOM}`,
  ]);

  const { size } = await stat(target);
  log(`${name} — ${megabytes(size)}`);

  /*
   * Dosya adı yapı tarihini taşıyor, yani içerik değişince adres de değişiyor.
   * Bu sayede tarayıcı ve kenar vekil paketi sonsuza kadar önbellekleyebilir.
   * Eski sürümü burada siliyoruz ki dizin birikmesin.
   */
  for (const entry of await readdir(OUT_DIR)) {
    if (entry.endsWith('.pmtiles') && entry !== name) {
      await rm(path.join(OUT_DIR, entry));
      log(`eski paket silindi: ${entry}`);
    }
  }

  return { name, size };
}

/**
 * Glifler ve sprite'lar. Bunlar da kendi origin'imizden gitmeli: stil
 * protomaps.github.io'yu gösterseydi yazı tipi isteği üçüncü tarafa
 * çıkardı ve tile'ları kendimize almanın anlamı kalmazdı.
 */
async function vendorAssets() {
  const unpack = await mkdtemp(path.join(tmpdir(), 'basemaps-assets-'));
  const archive = path.join(unpack, 'assets.tar.gz');

  log(`indiriliyor: basemaps-assets ${ASSETS_COMMIT.slice(0, 7)}`);
  await download(ASSETS_TARBALL, archive);
  run('tar', ['xzf', archive, '-C', unpack, '--strip-components=1']);

  const fontsOut = path.join(OUT_DIR, 'fonts');
  await rm(fontsOut, { recursive: true, force: true });
  await mkdir(fontsOut, { recursive: true });

  let glyphBytes = 0;
  for (const face of FONT_FACES) {
    const from = path.join(unpack, 'fonts', face);
    const to = path.join(fontsOut, face);
    await cp(from, to, { recursive: true });

    for (const entry of await readdir(to)) {
      glyphBytes += (await stat(path.join(to, entry))).size;
    }
  }
  /* Lisans dosyası varlıkla birlikte taşınır — OFL bunu şart koşuyor. */
  await cp(path.join(unpack, 'fonts/OFL.txt'), path.join(fontsOut, 'OFL.txt'));
  log(`glifler: ${FONT_FACES.length} yüz, ${megabytes(glyphBytes)}`);

  const spritesOut = path.join(OUT_DIR, 'sprites');
  await rm(spritesOut, { recursive: true, force: true });
  await mkdir(spritesOut, { recursive: true });

  for (const suffix of ['.json', '.png', '@2x.json', '@2x.png']) {
    await cp(
      path.join(unpack, 'sprites/v4', `${SPRITE}${suffix}`),
      path.join(spritesOut, `${SPRITE}${suffix}`),
    );
  }
  await download(SPRITE_LICENSE_URL, path.join(spritesOut, 'LICENSE.md'));
  log(`sprite: ${SPRITE} (+ LICENSE.md)`);

  await rm(unpack, { recursive: true, force: true });
  return { glyphBytes };
}

/**
 * Stil dosyası. Renkler lib/tokens.ts'ten geliyor: harita sayfanın
 * paletiyle aynı zemine oturur, ayrı bir renk dünyası kurmaz.
 *
 * Etiket dili Türkçe. Yabancı okuyucu ikincil hedef kitle ama harita
 * etiketi bir veri alanı değil, bir yer adı — iki dilde iki ayrı paket
 * üretmek 69 MB'ı ikiye katlardı.
 */
async function writeStyle(archiveName, build) {
  const flavor = namedFlavor('grayscale');

  /*
   * Zemin ve su sayfanın paletine çekiliyor, kalan tonlar Protomaps'in
   * gri düzeninde bırakılıyor. Kırmızı yalnızca menzil halkalarının ve
   * işaretçinin rengidir; haritanın kendisi onunla yarışmamalı.
   */
  const palette = {
    ...flavor,
    background: PALETTE.ground,
    earth: PALETTE.ground,
    water: '#d3d8d6',
    park_a: '#dcdedb',
    park_b: '#dcdedb',
    wood_a: '#dcdedb',
    wood_b: '#dcdedb',
    city_label: PALETTE.ink,
    state_label: PALETTE.ink2,
    country_label: PALETTE.ink,
    regional_label: PALETTE.ink2,
  };

  const attribution =
    '<a href="https://protomaps.com" rel="nofollow noopener">Protomaps</a> · ' +
    '<a href="https://www.openstreetmap.org/copyright" rel="nofollow noopener">© OpenStreetMap katkıcıları</a>';

  /*
   * Etiketler Türkçe adı öne alır.
   *
   * Protomaps'in dilli etiketi yerel yazıyı da ikinci satıra koyuyor:
   * "Sofya / София", "Tiflis / თბილისი". Güzel duruyor ama bedeli ağır —
   * ilk harita görünümü sekiz ayrı glif aralığı (Yunan, Kiril, Arap, Gürcü)
   * indiriyordu, 800 KB. Bu sayfada harita bir ölçüm zemini; kendi
   * ağırlığının üç katı yazı tipi taşımasının karşılığı yok.
   *
   * Bedeli açık: Türkçe veya İngilizce adı OSM'de bulunmayan küçük
   * yerleşim etiketsiz kalır. Ülke, deniz ve büyük şehir adları iki dilden
   * birinde neredeyse her zaman var.
   */
  const labels = layers('protomaps', palette, { lang: 'tr' }).map((layer) => {
    const field = layer.layout?.['text-field'];
    if (!field || !JSON.stringify(field).includes('"name:tr"')) return layer;

    return {
      ...layer,
      layout: {
        ...layer.layout,
        'text-field': ['coalesce', ['get', 'name:tr'], ['get', 'name:en']],
      },
    };
  });

  const style = {
    version: 8,
    /* Boşluklu dizin adları adreste yüzde kodlanır; statik sunucu çözer. */
    glyphs: '/tiles/fonts/{fontstack}/{range}.pbf',
    sprite: `/tiles/sprites/${SPRITE}`,
    sources: {
      protomaps: {
        type: 'vector',
        url: `pmtiles:///tiles/${archiveName}`,
        /*
         * Atıf stilin içinde duruyor, haritanın kurulumunda değil: paket
         * nereye giderse ODbL yükümlülüğü onunla gider. MapLibre bunu
         * attributionControl'de kendisi gösterir.
         */
        attribution,
      },
    },
    layers: labels,
    metadata: {
      'acikdosya:build': build.date,
      'acikdosya:bbox': [BBOX.minLon, BBOX.minLat, BBOX.maxLon, BBOX.maxLat],
      'acikdosya:maxzoom': MAXZOOM,
    },
  };

  const target = path.join(OUT_DIR, 'style.json');
  await writeFile(target, `${JSON.stringify(style, null, 2)}\n`);
  log(`style.json — ${style.layers.length} katman`);
}

/**
 * Kaynak kaydı. "Bu harita hangi günün OSM verisi" sorusunun cevabı altı ay
 * sonra da burada durur — sayısal alanlarda verified_at ne işi görüyorsa
 * bu dosya da onu görür.
 */
async function writeProvenance(build, archive, assets) {
  const record = {
    generated_at: new Date().toISOString().slice(0, 10),
    source: {
      name: 'Protomaps günlük planet yapısı',
      url: build.url,
      build_date: build.date,
      license: 'ODbL 1.0',
      attribution: '© OpenStreetMap katkıcıları',
    },
    extract: {
      bbox: [BBOX.minLon, BBOX.minLat, BBOX.maxLon, BBOX.maxLat],
      minzoom: 0,
      maxzoom: MAXZOOM,
      file: archive.name,
      bytes: archive.size,
    },
    assets: {
      repository: 'protomaps/basemaps-assets',
      commit: ASSETS_COMMIT,
      fonts: FONT_FACES,
      font_license: 'SIL Open Font License 1.1',
      sprite: SPRITE,
      sprite_license: 'BSD-3-Clause · CC0 1.0 · MIT (Mapzen türevi ikonlar)',
      bytes: assets.glyphBytes,
    },
    tools: {
      'go-pmtiles': PMTILES_CLI.version,
    },
  };

  await writeFile(
    path.join(OUT_DIR, 'build.json'),
    `${JSON.stringify(record, null, 2)}\n`,
  );
}

/* --------------------------------------------------------------------- ana */

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  step('Araç hazırlanıyor');
  const cli = await ensureCli();

  step('Kaynak yapı aranıyor');
  const build = await resolveBuild();

  step('Bölge çıkarılıyor');
  const archive = await extractRegion(cli, build);

  step('Glif ve sprite indiriliyor');
  const assets = await vendorAssets();

  step('Stil yazılıyor');
  await writeStyle(archive.name, build);
  await writeProvenance(build, archive, assets);

  console.log(`\nBitti: ${path.relative(ROOT, OUT_DIR)}`);
  console.log('Dağıtım paketi sunucuya ayrıca gönderir: ./scripts/deploy.sh');
}

await main();
