import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  isSamePublisher,
  measurementSchema,
  originSchema,
  systemSchema,
  type Origin
} from './schema';

/**
 * Koken kaydi — bir belge ve o belgeyi tasiyan yayinlar.
 *
 * Ornekler SIPER raporundan. 30.12.2022'de bir paylasim ">100 km" dedi;
 * bu taramada alti yayinci onu aktardi. Alintiladigimiz yayin (AA) da
 * o altidan biri: ozgun paylasima dogrudan erisilemedi.
 *
 * Ikinci oruntu daha sinsi: bir yazarin tahmini, AYNI SITENIN sonraki
 * yazisinda yeniden cikti. Iki tekrar sayica esit, epistemik olarak
 * degil.
 */

const DEMIR: Origin = {
  id: 'demir-2022-12-30',
  document: {
    tr: 'SİPER Ürün-1 test duyurusu',
    en: 'SİPER Product-1 test announcement'
  },
  publisher: 'SSB Başkanı, resmî görev hesabı',
  date: '2022-12-30',
  accessed: false,
  carried_by: [
    {publisher: 'Anadolu Ajansı', date: '2022-12-30'},
    {publisher: 'TRT Haber', date: '2022-12-30'},
    {publisher: 'SavunmaTR', date: '2022-12-31'},
    {publisher: 'DonanımHaber', date: '2022-12-30'},
    {publisher: 'Hürriyet', date: '2022-12-30'},
    {publisher: 'Ekonomim', date: '2022-12-30'}
  ]
};

function system(patch: Record<string, unknown> = {}) {
  return {
    $schema_version: '0.1',
    id: 'test',
    slug: 'test',
    name: {tr: 'TEST', en: 'TEST'},
    category: 'balistik-fuze',
    manufacturer: [{id: 'test', name: 'TEST'}],
    status: 'test',
    variants: [
      {
        id: 'test',
        label: 'TEST',
        specs: {
          range_km: [
            {
              value: 100,
              operator: '>',
              confidence: 'press',
              scope: 'test',
              source: {tr: 'AA', en: 'AA'},
              verified_at: '2026-09-10'
            }
          ]
        },
        attributes: {}
      }
    ],
    timeline: [],
    disclaimer: {tr: 'not', en: 'note'},
    ...patch
  };
}

test('tekrar sayisi listeden turer, ayri bir sayac yok', () => {
  const parsed = originSchema.parse(DEMIR);
  assert.equal(parsed.carried_by.length, 6);
  assert.ok(!('count' in parsed), 'kokende sayac alani var');

  // Sayac yazmaya calisilirsa strictObject reddeder.
  assert.equal(originSchema.safeParse({...DEMIR, count: 6}).success, false);
});

test('bos tekrar listesi yazilamaz — sifir tekrar bir iddiadir', () => {
  const result = originSchema.safeParse({...DEMIR, carried_by: []});
  assert.equal(result.success, false);
});

test('ayni adres iki tekrar kaydinda gecemez', () => {
  const amp = 'https://ornek.example/haber';
  const result = originSchema.safeParse({
    ...DEMIR,
    carried_by: [
      {publisher: 'Anadolu Ajansı', url: amp},
      {publisher: 'Anadolu Ajansı', url: amp}
    ]
  });

  assert.equal(result.success, false);
});

test('ayni yayinci tekrari yayinci adindan turer, elle bayraktan degil', () => {
  const kula: Origin = {
    id: 'kula-2023-11-12',
    document: {
      tr: 'Türkiye’nin Millî Katmanlı Hava Savunma Projeksiyonu',
      en: 'Turkey’s National Layered Air Defence Projection'
    },
    publisher: 'DefenceTurk',
    date: '2023-11-12',
    accessed: true,
    carried_by: [{publisher: 'DefenceTurk', date: '2023-11-23'}]
  };

  assert.equal(isSamePublisher(kula, kula.carried_by[0]), true);
  assert.equal(isSamePublisher(DEMIR, DEMIR.carried_by[0]), false);
});

test('kokene dogrudan erisilip erisilmedigi kayitta durur', () => {
  /*
   * Alintiladigimiz yayin kokenin YERINE GECMEZ. Ozgun paylasim
   * okunamadiginda bunu soylemenin tek yeri bu alan.
   */
  assert.equal(originSchema.parse(DEMIR).accessed, false);
  assert.equal(originSchema.safeParse({...DEMIR, accessed: undefined}).success, false);
});

test('olcume dogrudan tekrar sayisi yazilamaz', () => {
  const base = {
    value: 100,
    confidence: 'press' as const,
    source: {tr: 'AA', en: 'AA'},
    verified_at: '2026-09-10'
  };

  assert.equal(measurementSchema.safeParse(base).success, true);
  assert.equal(
    measurementSchema.safeParse({...base, repeated_by: {count: 5, names: []}})
      .success,
    false,
    'tekrar sayisi olcumun icine yazilabiliyor'
  );
  // Kimlikle gostermek serbest.
  assert.equal(
    measurementSchema.safeParse({...base, origin_id: 'demir-2022-12-30'}).success,
    true
  );
});

test('tanimsiz koken kimligi dosyayi dusurur', () => {
  const withOrigin = system({
    origins: [DEMIR],
    variants: [
      {
        id: 'test',
        label: 'TEST',
        specs: {
          range_km: [
            {
              value: 100,
              operator: '>',
              confidence: 'press',
              scope: 'test',
              origin_id: 'demir-2022-12-30',
              source: {tr: 'AA', en: 'AA'},
              verified_at: '2026-09-10'
            }
          ]
        },
        attributes: {}
      }
    ]
  });
  assert.equal(systemSchema.safeParse(withOrigin).success, true);

  const broken = system({
    origins: [DEMIR],
    variants: [
      {
        id: 'test',
        label: 'TEST',
        specs: {
          range_km: [
            {
              value: 100,
              operator: '>',
              confidence: 'press',
              scope: 'test',
              origin_id: 'yazim-hatasi',
              source: {tr: 'AA', en: 'AA'},
              verified_at: '2026-09-10'
            }
          ]
        },
        attributes: {}
      }
    ]
  });
  assert.equal(systemSchema.safeParse(broken).success, false);
});

test('takvim olayi da ayni koken kaydini gosterebilir', () => {
  const parsed = systemSchema.safeParse(
    system({
      origins: [DEMIR],
      timeline: [
        {
          date: '2022-12-30',
          date_kind: 'announcement',
          title: {tr: 'Test duyurusu', en: 'Test announcement'},
          confidence: 'press',
          origin_id: 'demir-2022-12-30'
        }
      ]
    })
  );

  assert.equal(parsed.success, true);
});

test('koken idleri benzersiz olmali', () => {
  const result = systemSchema.safeParse(
    system({origins: [DEMIR, {...DEMIR, publisher: 'Baska'}]})
  );

  assert.equal(result.success, false);
});

test('koken kaydi olmayan dosya gecerli — kayit yoklugu iddia degil', () => {
  assert.equal(systemSchema.safeParse(system()).success, true);
});
