import assert from 'node:assert/strict';
import {test} from 'node:test';
import {AKINCI} from '@/lib/geometry/akinci';
import {buildParts} from '@/lib/geometry/product';
import {TAYFUN} from '@/lib/geometry/tayfun';
import {layoutScaleCard, type ScaleCardBox, type ScaleCardItem} from './card-geometry';
import {HUMAN_HEIGHT_M} from './geometry';

/**
 * Kartin olcek yerlesimi.
 *
 * Kartin tek iddiasi su: cizilen her sey AYNI metre carpaninda. Fuze ile
 * IHA ayni kartta oldugunda bu iddianin bozulmasi kolay, cunku ikisinin
 * baskin olcusu farkli eksende. Testler carpanin tek kaldigini ve
 * cizimin kutuya sigdigini siniyor.
 */

const BOX: ScaleCardBox = {
  width: 660,
  height: 400,
  rowGap: 14,
  minRow: 96,
  rulerGap: 12,
  rulerHeight: 10
};

const COLORS = {row: () => '#000000', rule: '#666666'};

const tayfun: ScaleCardItem = {
  id: 'tayfun',
  view: 'side',
  parts: buildParts(TAYFUN, {length_m: 6.5, diameter_mm: 610}),
  spanM: 6.5,
  depthM: 0.61
};

const akinci: ScaleCardItem = {
  id: 'akinci',
  view: 'top',
  swap: true,
  parts: buildParts(AKINCI, {length_m: 12.3, wingspan_m: 20, height_m: 4.1}),
  spanM: 20,
  depthM: 12.3
};

function decode(src: string): string {
  return Buffer.from(src.replace('data:image/svg+xml;base64,', ''), 'base64').toString(
    'utf8'
  );
}

test('iki sinif tek carpani paylasir', () => {
  const layout = layoutScaleCard([tayfun, akinci], BOX, COLORS);
  assert.ok(layout);

  const [missile, aircraft] = layout.rows;

  /*
   * Genislikler metre olcusuyle ayni oranda olmali. Satir basina ayri
   * carpan kullanilsaydi bu oran bozulurdu — kartin karsilastirma
   * iddiasi tam olarak burada yasiyor.
   */
  const drawn = missile.width / aircraft.width;
  const real = 6.5 / 20;
  assert.ok(
    Math.abs(drawn - real) < 0.03,
    `cizim orani ${drawn.toFixed(3)}, olcu orani ${real.toFixed(3)}`
  );

  /* Insan figuru de ayni carpanda. */
  assert.ok(
    Math.abs(layout.human.height - HUMAN_HEIGHT_M * layout.scale) <= 1
  );
});

test('IHA kanat acikligi ekseninde serilir', () => {
  const layout = layoutScaleCard([akinci], BOX, COLORS);
  assert.ok(layout);

  const [row] = layout.rows;
  /*
   * Takas yapilmasaydi genis kenar uzunluk olurdu ve 20 m aciklik
   * 12,3 m'lik bir kutuya sigdirilirdi.
   */
  assert.ok(
    row.width > row.height,
    'ust gorunus cevrilmemis: aciklik genis eksende degil'
  );
});

test('cizim kendisine ayrilan kutuyu asmaz', () => {
  const layout = layoutScaleCard([tayfun, akinci], BOX, COLORS);
  assert.ok(layout);

  const used =
    layout.rows.reduce(
      (total, row) => total + Math.max(row.height, BOX.minRow),
      0
    ) +
    BOX.rowGap * (layout.rows.length - 1) +
    BOX.rulerGap +
    BOX.rulerHeight;

  assert.ok(used <= BOX.height, `${used} px kullanildi, kutu ${BOX.height} px`);
  for (const row of layout.rows) {
    assert.ok(row.width <= BOX.width, `${row.width} px genislik, kutu ${BOX.width} px`);
  }
});

test('parca listesi yoksa dis hat degil kesikli zarf cizilir', () => {
  const layout = layoutScaleCard(
    [{id: 'x', view: 'side', spanM: 6.5, depthM: 0.61}],
    BOX,
    COLORS
  );
  assert.ok(layout);

  const [row] = layout.rows;
  assert.equal(row.outlined, false);
  assert.ok(decode(row.src).includes('stroke-dasharray'));
});

test('parca listesi varsa kontur kesikli degildir', () => {
  const layout = layoutScaleCard([tayfun], BOX, COLORS);
  assert.ok(layout);

  assert.equal(layout.rows[0].outlined, true);
  assert.ok(!decode(layout.rows[0].src).includes('stroke-dasharray'));
});

test('cetvel en genis sistemi olcer, bos alani degil', () => {
  const layout = layoutScaleCard([tayfun], BOX, COLORS);
  assert.ok(layout);

  const rulerM = layout.ruler.stepM * layout.ruler.steps;
  assert.ok(rulerM <= 6.5 * 1.1 + 0.001, `cetvel ${rulerM} m'ye uzamis`);
  assert.ok(layout.ruler.steps >= 1);
  assert.equal(layout.ruler.labels.length, layout.ruler.steps + 1);
});

test('olcu degisince cizim degisir', () => {
  const small = layoutScaleCard([tayfun], BOX, COLORS);
  const large = layoutScaleCard(
    [
      {
        ...tayfun,
        parts: buildParts(TAYFUN, {length_m: 10, diameter_mm: 938}),
        spanM: 10,
        depthM: 0.938
      }
    ],
    BOX,
    COLORS
  );

  assert.ok(small && large);
  assert.notEqual(decode(small.rows[0].src), decode(large.rows[0].src));
});

test('bos liste yerlesim uretmez', () => {
  assert.equal(layoutScaleCard([], BOX, COLORS), undefined);
});
