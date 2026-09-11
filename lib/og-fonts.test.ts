import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {test} from 'node:test';
import {ImageResponse} from 'next/og';
import {createElement} from 'react';
import {decodePng, inkBox, inkPixels} from './cards/png';
import {loadOgFonts, OG_FONT_FAMILY, OG_SERIF_FAMILY} from './og';

/**
 * Paylasim gorsellerinde Turkce glifler — CLAUDE.md §4.
 *
 * satori tarayici gibi font yedeklemesi yapmaz: hangi tamponu verirsek
 * onunla cizer. Bizim yazi tipimiz iki alt kumeye bolunmus ve Turkce
 * ikiye dagilmis durumda:
 *
 *   latin      ı ç ö ü Ç Ö Ü
 *   latin-ext  ğ ş Ğ Ş İ
 *
 * Yalnizca birini yuklemek BOS KUTU URETMEZ — arıza bundan daha sinsi.
 * @vercel/og paketinin icinde gomulu bir yedek yazi tipi (Geist) var ve
 * eksik glifler sessizce ona duser. Yazi okunur kalir, yalniz harfler
 * baska bir yazi tipinde cikar; genislik farki %2 civarinda, yani tek
 * basina olcu bunu yakalayamaz.
 *
 * Bu yuzden test iki seye birden bakiyor:
 *   1. Metnin toplam genisligi beklenen bantta mi  — glif dusmesini yakalar.
 *   2. Ğ harfi latin-ext dosyasindan mi ciziliyor  — yedege dusmeyi yakalar.
 */

const PROBE = 'ĞŞİğşıçöü TAYFUN';

/** Sinama tuvali. Kucuk tutuldu: her kare ayri bir resvg cizimi. */
const CANVAS = {width: 1200, height: 200} as const;
const FONT_SIZE = 48;

/**
 * Beklenen genislik. Deger olculerek yazildi, elle secilmedi; bant
 * yuvarlama ve resvg surum farkina yer birakiyor. Bandin disina cikan
 * bir sonuc "glif dusmus" demektir.
 */
const EXPECTED_WIDTH = 423;
const WIDTH_TOLERANCE = 0.04;

type Font = Awaited<ReturnType<typeof loadOgFonts>>[number];

async function readOgFont(
  file: string,
  name: string,
  weight: 400 | 600 = 600
): Promise<Font> {
  const buffer = await readFile(join(process.cwd(), 'app', '_fonts', 'og', file));

  return {
    name,
    data: buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength
    ) as ArrayBuffer,
    weight,
    style: 'normal'
  };
}

/*
 * JSX yerine createElement: bu dosya .ts uzantili kalsin diye. Test
 * kosucusunun deseni (package.json) lib altinda .test.ts ariyor.
 */
async function render(
  text: string,
  fonts: Font[],
  options: {family?: string; weight?: 400 | 600} = {}
) {
  const response = new ImageResponse(
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          justifyContent: 'flex-start',
          background: '#ffffff',
          color: '#000000',
          fontFamily: options.family ?? fonts.map((font) => font.name).join(', '),
          fontSize: FONT_SIZE,
          fontWeight: options.weight ?? 600
        }
      },
      text
    ),
    {...CANVAS, fonts}
  );

  return decodePng(Buffer.from(await response.arrayBuffer()));
}

test('Turkce gliflerin tamami cizilir', async () => {
  const bitmap = await render(PROBE, await loadOgFonts(), {
    family: OG_FONT_FAMILY
  });
  const box = inkBox(bitmap);

  assert.ok(box, 'hicbir sey cizilmemis');

  const drift = Math.abs(box.width - EXPECTED_WIDTH) / EXPECTED_WIDTH;
  assert.ok(
    drift <= WIDTH_TOLERANCE,
    `beklenen ~${EXPECTED_WIDTH} px, olculen ${box.width} px — bir glif dusmus olabilir`
  );
});

test('latin-ext glifleri Archivo dosyasindan gelir, yedekten degil', async () => {
  const latin = await readOgFont('archivo-600-latin.ttf', 'Archivo');
  const latinExt = await readOgFont('archivo-600-latin-ext.ttf', 'ArchivoExt');

  const [production, extOnly, latinOnly] = await Promise.all([
    render('Ğ', await loadOgFonts(), {family: OG_FONT_FAMILY}),
    render('Ğ', [latinExt]),
    render('Ğ', [latin])
  ]);

  assert.deepEqual(
    inkPixels(production),
    inkPixels(extOnly),
    'Ğ latin-ext dosyasindaki bicimde cizilmiyor'
  );

  /*
   * Ters yon de sinaniyor: yalniz latin yuklendiginde harf KAYBOLMUYOR,
   * gomulu yedek yazi tipiyle ciziliyor. Iki cizim ayni cikarsa testin
   * ilk yarisi bir sey ispat etmiyor demektir.
   */
  assert.notDeepEqual(
    inkPixels(production),
    inkPixels(latinOnly),
    'yalniz latin ile cizim ayni cikti — yedek yazi tipi sinanamiyor'
  );
});

/*
 * Govde metni serif — duzeltme gerekcesi gibi okunacak metinler icin.
 * Ayni alt kume tuzagi orada da var: ş latin-ext dosyasinda.
 */
test('serif govde metninde de latin-ext dosyasi kullanilir', async () => {
  const serifExt = await readOgFont(
    'source-serif-400-latin-ext.ttf',
    'SourceSerifExt',
    400
  );
  const serifLatin = await readOgFont(
    'source-serif-400-latin.ttf',
    'SourceSerif',
    400
  );

  const [production, extOnly, latinOnly] = await Promise.all([
    render('ş', await loadOgFonts(), {family: OG_SERIF_FAMILY, weight: 400}),
    render('ş', [serifExt], {weight: 400}),
    render('ş', [serifLatin], {weight: 400})
  ]);

  assert.deepEqual(
    inkPixels(production),
    inkPixels(extOnly),
    'ş serif latin-ext dosyasindaki bicimde cizilmiyor'
  );
  assert.notDeepEqual(
    inkPixels(production),
    inkPixels(latinOnly),
    'yalniz latin ile cizim ayni cikti — yedek yazi tipi sinanamiyor'
  );
});

test('font ailesi listeleri alt kumeleri sayar', () => {
  assert.deepEqual(
    OG_FONT_FAMILY.split(',').map((name) => name.trim()),
    ['Archivo', 'ArchivoExt']
  );
  assert.deepEqual(
    OG_SERIF_FAMILY.split(',').map((name) => name.trim()),
    ['SourceSerif', 'SourceSerifExt']
  );
});
