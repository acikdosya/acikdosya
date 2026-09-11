import assert from 'node:assert/strict';
import {test} from 'node:test';
import {ImageResponse} from 'next/og';
import {getSystem} from '../content';
import {specGroups} from '../measurement/groups';
import {loadOgFonts} from '../og';
import type {Confidence, System} from '../schema';
import {CARD_FORMATS, CARD_SIZE, type CardFormat} from './params';
import {decodePng, inkBox} from './png';
import type {Translator} from './render';
import {revisionCard} from './revision';
import {RevisionCardImage} from './revision-card';
import {scaleCard} from './scale';
import {ScaleCardImage} from './scale-card';
import {sourceChains} from './source-chain';
import {SourceChainCardImage} from './source-chain-card';
import {valueScope} from './value-scope';
import {ValueScopeCardImage} from './value-scope-card';

/**
 * Dort kart da gercekten ciziliyor mu.
 *
 * Bu testin somut bir sebebi var: satori bir stil degerini cozemedigine
 * cizimi ORTASINDA duser. Next bunu "failed to pipe response" diye
 * loglar — ne stil adi, ne satir numarasi, ne yigin izi. Gelistirmede
 * adres elle acilmazsa arıza gorunmez ve yayinda bozuk bir paylasim
 * gorseli olarak kalir.
 *
 * Nitekim oldu: yatay kaynak zinciri kartinda kutuya `height: undefined`
 * geciliyordu. Tip kontrolu gecti, lint gecti, dikey bicim ciziliyordu;
 * yatay bicim sessizce dusuyordu.
 *
 * Bu yuzden test gorunum bileseninin KENDISINI cizdiriyor. Metinler
 * Turkce gliflerle veriliyor (§4): kart govdesinde ğ ş İ Ğ Ş de sinaniyor.
 */

/**
 * Sahte ceviri: her anahtar Turkce gliflerle bir dize dondurur.
 *
 * Gercek mesaj paketi kullanilmiyor cunku sinanan sey metin degil cizim.
 * Ayrica boylece her kart, paketteki en uzun dizeden bagimsiz olarak
 * ayni zorlukta bir metinle sinaniyor.
 */
function translator(prefix: string): Translator {
  return (key, values) => {
    const rendered = Object.values(values ?? {}).join(' ');
    return `${prefix}.${key} ĞŞİğşıçöü${rendered ? ` ${rendered}` : ''}`;
  };
}

const LABELS: Record<Confidence, string> = {
  official: 'resmî',
  press: 'basın',
  estimate: 'tahmin'
};

const COMMON = {
  locale: 'tr' as const,
  domain: 'acikdosya.org',
  labels: LABELS,
  t: translator('Card'),
  tSpec: translator('Specs'),
  tScale: translator('Scale'),
  tDivergence: translator('Divergence'),
  tAttribute: translator('Attributes'),
  tLog: translator('Log')
};

function system(slug: string): System {
  const found = getSystem(slug);
  assert.ok(found, `${slug} dosyasi yok`);
  return found;
}

/**
 * Cizer ve gercekten murekkep dustugunu dogrular.
 *
 * Bos bir PNG de gecerli bir PNG'dir; "cizildi" demek icin tuvalin
 * dolmus olmasi gerekiyor.
 */
async function draw(format: CardFormat, element: React.ReactElement) {
  const response = new ImageResponse(element, {
    ...CARD_SIZE[format],
    fonts: await loadOgFonts()
  });

  assert.equal(response.status, 200);
  const bitmap = decodePng(Buffer.from(await response.arrayBuffer()));
  assert.equal(bitmap.width, CARD_SIZE[format].width);
  assert.equal(bitmap.height, CARD_SIZE[format].height);

  const ink = inkBox(bitmap);
  assert.ok(ink, 'tuval bos');
  /* Ust serit, alt serit ve govde: murekkep tuvale yayilmis olmali. */
  assert.ok(
    ink.height > CARD_SIZE[format].height * 0.5,
    `cizim tuvalin yarisini doldurmuyor (${ink.height} px)`
  );

  return bitmap;
}

for (const format of CARD_FORMATS) {
  test(`${format}: kaynak zinciri karti cizilir`, async () => {
    const [chain] = sourceChains(system('atmaca'));
    assert.ok(chain);

    await draw(
      format,
      <SourceChainCardImage card={chain} format={format} {...COMMON} />
    );
  });

  test(`${format}: deger ve kapsami karti cizilir`, async () => {
    const atmaca = system('atmaca');
    const group = specGroups(atmaca).find((entry) => entry.id === 'atmaca');
    assert.ok(group);
    const card = valueScope(atmaca, group, 'mass_kg');
    assert.ok(card);

    await draw(
      format,
      <ValueScopeCardImage card={card} format={format} {...COMMON} />
    );
  });

  test(`${format}: olcek karti cizilir`, async () => {
    /* Karisik sinif: fuze yan gorunusten, IHA ust gorunusten. */
    const card = scaleCard([system('tayfun'), system('akinci')]);
    assert.ok(card);

    await draw(
      format,
      <ScaleCardImage card={card} format={format} {...COMMON} />
    );
  });

  test(`${format}: duzeltme karti cizilir`, async () => {
    const card = revisionCard(system('tayfun'), 0);
    assert.ok(card);

    await draw(
      format,
      <RevisionCardImage card={card} format={format} {...COMMON} />
    );
  });
}

test('sekizden fazla kayitli zincir de cizilir', async () => {
  /* Ornek satir ve sayaca dusen yol — ayri bir yerlesim dali. */
  const sampled = sourceChains(system('akinci')).find((chain) => chain.sampled);
  assert.ok(sampled);

  await draw(
    'yatay',
    <SourceChainCardImage card={sampled} format="yatay" {...COMMON} />
  );
});
