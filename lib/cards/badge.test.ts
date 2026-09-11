import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ImageResponse} from 'next/og';
import {createElement} from 'react';
import en from '../../messages/en.json';
import tr from '../../messages/tr.json';
import {badgeWidth, loadOgFonts, OG_FONT_FAMILY} from '../og';
import {decodePng, inkBox} from './png';

/**
 * Rozet kutusunun genisligi.
 *
 * Rozet cercevesi SVG zemin gorseli olarak ciziliyor (lib/og.tsx), yani
 * kutunun olcusu metin cizilmeden ONCE bilinmeli; satori metin
 * genisligini soylemiyor. Genislik bu yuzden ortalama bir karakter
 * genisliginden tahmin ediliyor.
 *
 * Tahmin dar kalirsa metin cerceveyi tasar ve bunu hicbir tip kontrolu
 * yakalayamaz. Test en uzun rozet metnini gercekten cizip olcuyor: ucu
 * birden tasiyan birlesik rozet ("resmî + basın + tahmin") en zorlu hali.
 */

/** Rozet kutusunun metin ile cerceve arasindaki payi — lib/og.tsx. */
const PADDING = 16;
const SIZE = 22;

async function inkWidth(text: string): Promise<number> {
  const fonts = await loadOgFonts();
  const response = new ImageResponse(
    createElement(
      'div',
      {
        style: {
          display: 'flex',
          width: '100%',
          height: '100%',
          alignItems: 'center',
          background: '#ffffff',
          color: '#000000',
          fontFamily: OG_FONT_FAMILY,
          fontSize: SIZE,
          fontWeight: 600,
          letterSpacing: '0.05em'
        }
      },
      text
    ),
    {width: 900, height: 80, fonts}
  );

  const box = inkBox(decodePng(Buffer.from(await response.arrayBuffer())));
  assert.ok(box, `cizilmedi: ${text}`);
  return box.width;
}

function combined(bundle: {Confidence: Record<string, string>}): string {
  return [
    bundle.Confidence.official,
    bundle.Confidence.press,
    bundle.Confidence.estimate
  ].join(' + ');
}

for (const [name, bundle] of [
  ['tr', tr],
  ['en', en]
] as const) {
  test(`${name}: birlesik rozet metni cerceveye sigar`, async () => {
    const label = combined(bundle);
    const measured = await inkWidth(label);
    const estimated = badgeWidth(label, SIZE, PADDING);

    assert.ok(
      measured + PADDING * 2 <= estimated,
      `"${label}" metni ${measured} px, kutu ${estimated} px — cerceveyi tasiyor`
    );
    /*
     * Ust sinir da var: kutu metinden cok genis olursa rozet bir etikete
     * degil bir dugmeye benzer. Pay bol tutuldu cunku ortalama karakter
     * genisligi diller arasinda degisiyor — ayni uzunluktaki Ingilizce
     * metin kucuk harf agirlikli oldugu icin tahminin altinda kaliyor.
     * Buradaki sinir ince ayar icin degil, carpanin tumden kaymasini
     * yakalamak icin.
     */
    assert.ok(
      estimated <= measured + PADDING * 6,
      `"${label}" kutusu gereginden genis: ${estimated} px`
    );
  });
}
