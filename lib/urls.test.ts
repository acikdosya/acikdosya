import assert from 'node:assert/strict';
import {readdirSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';
import {CARD_TEMPLATES, cardUrl} from './urls';

/**
 * Paylasim kartlarinin adresleri.
 *
 * Iki tuzak var ve ikisi de yayinda bir kez yasandi (bkz. lib/urls.ts
 * ogImage):
 *
 *  1. TR adresine /tr oneki koymak. Onek 307 ile duser ve yonlendirmeyi
 *     izlemeyen paylasim istemcisi gorseli hic gostermez.
 *  2. Yolu cevirmek. Kart rotasi bir dosya yolu; next-intl'in pathnames
 *     haritasinda yok, yani cevrilmis bir yol 404 olur.
 */

test('TR karti oneksiz, EN karti onekli', () => {
  assert.equal(
    cardUrl('tr', 'olcek', {sistem: 'tayfun'}),
    'http://localhost:3000/kart/olcek?sistem=tayfun'
  );
  assert.equal(
    cardUrl('en', 'olcek', {sistem: 'tayfun'}),
    'http://localhost:3000/en/kart/olcek?sistem=tayfun'
  );
});

test('yol cevrilmez', () => {
  for (const template of CARD_TEMPLATES) {
    const url = cardUrl('en', template, {sistem: 'tayfun'});
    assert.ok(
      url.includes(`/en/kart/${template}`),
      `${template}: Ingilizce adres cevrilmis — ${url}`
    );
  }
});

test('parametreler kodlanir', () => {
  const url = cardUrl('tr', 'deger-kapsam', {
    sistem: 'tayfun',
    alan: 'range_km',
    format: 'dikey'
  });

  const parsed = new URL(url);
  assert.equal(parsed.searchParams.get('alan'), 'range_km');
  assert.equal(parsed.searchParams.get('format'), 'dikey');
});

test('sablon listesi rota dizinleriyle ayni', () => {
  /*
   * Liste elle tutuluyor ve adresleri o uretiyor; disk ise gercek
   * rotalari tasiyor. Ikisi ayrisirsa ya var olmayan bir karta bag
   * verilir ya da calisan bir kart adressiz kalir.
   */
  const directories = readdirSync(
    join(process.cwd(), 'app', '[locale]', 'kart'),
    {withFileTypes: true}
  )
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(directories, [...CARD_TEMPLATES].sort());
});
