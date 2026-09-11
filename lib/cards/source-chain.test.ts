import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getSystem} from '../content';
import {sourceKey} from './params';
import {
  MAX_ROWS,
  MIN_ROWS,
  SAMPLE_ROWS,
  sourceChain,
  sourceChains
} from './source-chain';

/**
 * Kaynak zinciri kart verisi.
 *
 * Zincir veriden CIKARILIR, elle kurulmaz: hangi degerin hangi belgeye
 * dayandigi olcumun kendi source_url'unden gelir. Bu testler kartin
 * gercekten dosyadan turedigini ve uydurma bir bag kurmadigini siniyor.
 */

function system(slug: string) {
  const found = getSystem(slug);
  assert.ok(found, `${slug} dosyasi yok`);
  return found;
}

test('ayni belgeye dayanan degerler tek zincirde toplanir', () => {
  const atmaca = system('atmaca');
  const chains = sourceChains(atmaca);

  assert.ok(chains.length > 0, 'ATMACA dosyasinda zincir bulunamadi');

  const biggest = chains[0];
  assert.ok(biggest.total >= MIN_ROWS);
  assert.equal(
    new Set(biggest.rows.map((row) => sourceKey(row.measurement))).size,
    1,
    'zincirdeki her satir ayni belgeye dayanmali'
  );
});

test('esik altindaki belge zincir uretmez', () => {
  /*
   * Tek ya da iki kayit tasiyan bir belge zincir degildir: "hepsinin
   * dayandigi belge" demek icin once "hepsi" diye bir kume olmali.
   */
  for (const slug of ['tayfun', 'atmaca', 'akinci']) {
    for (const chain of sourceChains(system(slug))) {
      assert.ok(
        chain.total >= MIN_ROWS,
        `${slug}: ${chain.total} kayitlik zincir uretilmis`
      );
    }
  }
});

test('aralik asilinca ornek satir ve sayac', () => {
  const akinci = system('akinci');
  const sampled = sourceChains(akinci).find((chain) => chain.sampled);

  assert.ok(sampled, 'AKINCI dosyasinda sekizden fazla kayitli belge yok');
  assert.ok(sampled.total > MAX_ROWS);
  assert.equal(sampled.rows.length, SAMPLE_ROWS);
  /* Sayac toplami tasir: kart "ve dahasi" demez, kac kayit oldugunu soyler. */
  assert.ok(sampled.total > sampled.rows.length);
});

test('kart tarihi en yeni dogrulama tarihidir', () => {
  for (const chain of sourceChains(system('tayfun'))) {
    const latest = chain.rows
      .map((row) => row.measurement.verified_at)
      .reduce((best, date) => (date > best ? date : best));

    assert.ok(chain.verifiedAt >= latest);
  }
});

test('bilinmeyen kimlik kart uretmez', () => {
  const tayfun = system('tayfun');
  assert.equal(sourceChain(tayfun, 'deadbeef'), undefined);
  assert.equal(sourceChain(tayfun, null), undefined);
});

test('kimlik adrese baglidir, kaynak adina degil', () => {
  const base = {
    value: 1,
    confidence: 'official' as const,
    source: {tr: 'A', en: 'A'},
    verified_at: '2026-01-01'
  };

  assert.equal(
    sourceKey({...base, source_url: 'https://x.example/a'}),
    sourceKey({
      ...base,
      source: {tr: 'B', en: 'B'},
      source_url: 'https://x.example/a'
    }),
    'ayni belge iki kayitta farkli adlandirilmis olsa da tek zincirdir'
  );
  assert.notEqual(
    sourceKey({...base, source_url: 'https://x.example/a'}),
    sourceKey({...base, source_url: 'https://x.example/b'})
  );
});
