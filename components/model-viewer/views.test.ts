import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';

/**
 * Gorunum on ayarlari ve erisilebilirlik sozlesmesi.
 *
 * Model DEKORATIFTIR: hicbir bilgi yalnizca uc boyutlu sahnede
 * bulunmamali (CLAUDE.md §9, specs/system-geometry). Etiket adlari DOM'a
 * on ayar dugmeleri olarak ciktigi icin ekran okuyucu onlari okur ve
 * WebGL kapaliyken de dururlar — sahne siluete duser, dugme serisi
 * kalir.
 */

const SECTION = readFileSync(
  join(process.cwd(), 'components', 'model-viewer', 'ModelSection.tsx'),
  'utf8'
);
const VIEWER = readFileSync(
  join(process.cwd(), 'components', 'model-viewer', 'ModelViewer.tsx'),
  'utf8'
);

test('her etiket bir gorunum on ayari uretir', () => {
  // views dizisi annotations uzerinden kuruluyor.
  assert.match(SECTION, /active\.annotations\.map\(\(annotation\) => \(\{/);
  assert.match(SECTION, /kind: 'focus' as const/);
});

test('iki sabit on ayar var: genel gorunum ve on gorunus', () => {
  assert.match(SECTION, /id: 'overview'[\s\S]*spec: \{kind: 'overview'\}/);
  assert.match(SECTION, /id: 'front'[\s\S]*spec: \{kind: 'front'\}/);
});

test('on ayar dugmeleri sahneden BAGIMSIZ ciziliyor', () => {
  /*
   * Dugme serisi (styles.bar) ModelViewer'in disinda; WebGL yoksa sahne
   * yerine siluet cizilir ama etiket adlari DOM'da kalir.
   */
  const viewerIndex = SECTION.indexOf('<ModelViewer');
  const barIndex = SECTION.indexOf('styles.bar');
  assert.ok(viewerIndex > 0 && barIndex > viewerIndex, 'dugme serisi bulunamadi');
  // Sahne kosullu, seri degil.
  assert.match(SECTION, /\{inView \? \(\s*<ModelViewer/);
});

test('WebGL yoksa siluete dusulur, sahne bos cizilmez', () => {
  assert.match(VIEWER, /if \(!webgl \|\| !frame\) return <>\{fallback\}<\/>;/);
});

test('hareket azaltilmissa otomatik donus kapali', () => {
  assert.match(
    VIEWER,
    /const autoRotate = !reduce && !grabbed && view\.kind === 'overview';/
  );
  // Kare uretimi de talebe baglanir.
  assert.match(VIEWER, /frameloop=\{reduce \? 'demand' : 'always'\}/);
});

test('hareket azaltilmissa kamera gecisi ani', () => {
  // Framing: reduce ise pozisyon dogrudan kopyalanir, lerp yok.
  assert.match(VIEWER, /if \(!reduce\) return;[\s\S]*camera\.position\.copy\(goal\.position\)/);
  assert.match(VIEWER, /useFrame\(\(\) => \{\s*if \(reduce \|\| !moving\.current\) return;/);
});

test('etiket parcasi cozulemezse etiket HIC cizilmez', () => {
  assert.match(VIEWER, /if \(!position\) return null;/);
});
