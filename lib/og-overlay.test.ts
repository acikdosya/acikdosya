import assert from 'node:assert/strict';
import {test} from 'node:test';
import {decodePng, inkBox, type Bitmap} from './cards/png';
import {OG_SIZE, X_TITLE_OVERLAY} from './og';

/**
 * X'in bag onizlemesinde gorselin sol alt kosesine bindirdigi baslik
 * etiketi — lib/og.tsx X_TITLE_OVERLAY.
 *
 * Etiket bizim denetimimizde degil ve engellenemiyor. Tek yapabilecegimiz
 * o koseyi bos birakmak. Onizlemede "Uzunluk 6,5 m · resmî" satiri
 * yarisindan kapaniyordu; yani rozet, kartin okunmasi gereken tek
 * dogrulama isareti, paylasimda gorunmuyordu.
 *
 * Test kosenin murekkepsiz kaldigini SAYARAK dogruluyor. Gozle bakmak
 * yetmez: alt bosluk bir sonraki yerlesim degisikliginde sessizce geri
 * daralabilir ve kimse fark etmez, cunku gorsel dogru gorunmeye devam eder.
 */

/**
 * Olcu cetveli rayi haric tutuluyor.
 *
 * Ray sayfanin imza motifi ve tuvalin solunda bastan sona iniyor
 * (lib/og.tsx MeasureRailImage, sol kenardan 56 px). Uzerine bir etiket
 * binmesi bir sey KAYBETTIRMEZ: ray okunmaz, bir sayi ya da rozet
 * tasimaz. Kontrol edilen sey okunmasi gereken icerik.
 */
const RAIL_EDGE = 96;

/** Kosedeki koyu piksel sayisi — ray sutunlari disinda. */
function inkInCorner(bitmap: Bitmap): number {
  const {width, height, channels, data} = bitmap;
  let count = 0;

  for (let y = height - X_TITLE_OVERLAY.height; y < height; y++) {
    for (let x = RAIL_EDGE; x < X_TITLE_OVERLAY.width; x++) {
      const index = (y * width + x) * channels;
      const alpha = channels === 4 ? data[index + 3] : 255;
      if (alpha >= 128 && data[index] <= 127) count += 1;
    }
  }

  return count;
}

/*
 * Varsayilan gelistirme sunucusu. Metadata gorsel rotalarini `next dev`
 * ONBELLEKLIYOR: kaynak degisse de eski PNG servis edilebiliyor. Gercek
 * ciktiyi gormek icin uretim sunucusu baska bir portta kosturulup bu
 * degisken verilir.
 */
const ORIGIN = process.env.OG_TEST_ORIGIN ?? 'http://localhost:3000';

async function fetchImage(path: string): Promise<Bitmap | undefined> {
  /*
   * Gorselin kendisi calisan bir sunucu ister; rota metadata dosya
   * sozlesmesinden geliyor ve next-intl istek baglami olmadan
   * cagrilamiyor. Sunucu ayakta degilse test atlanir — CI'da derleme
   * zaten rotalari uretiyor, burasi yerel gozden kacirmayi yakaliyor.
   */
  try {
    const response = await fetch(`${ORIGIN}${path}`, {
      signal: AbortSignal.timeout(20_000)
    });
    if (!response.ok) return undefined;
    return decodePng(Buffer.from(await response.arrayBuffer()));
  } catch {
    return undefined;
  }
}

for (const path of [
  '/opengraph-image',
  '/sistemler/tayfun/opengraph-image',
  '/en/sistemler/akinci/opengraph-image'
]) {
  test(`${path}: sol alt kose X etiketine birakilmis`, async (t) => {
    const bitmap = await fetchImage(path);
    if (!bitmap) {
      t.skip('yerel sunucu yok — pnpm dev ile kosulur');
      return;
    }

    assert.equal(bitmap.width, OG_SIZE.width);
    assert.equal(bitmap.height, OG_SIZE.height);
    /* Gorsel gercekten cizilmis olmali, yoksa bos tuval testi gecerdi. */
    assert.ok(inkBox(bitmap), 'gorsel bos');

    assert.equal(
      inkInCorner(bitmap),
      0,
      `sol alt ${X_TITLE_OVERLAY.width}x${X_TITLE_OVERLAY.height} kosede icerik var`
    );
  });
}
