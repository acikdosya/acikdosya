import assert from 'node:assert/strict';
import {test} from 'node:test';
import {getSystem, getSystemSlugs} from './content';
import {revisionIssues} from './revisions';
import {
  systemSchema,
  type Operator,
  type Revision,
  type Specs,
  type System
} from './schema';

/**
 * Defter ile tablo tutuyor mu.
 *
 * Kontrol bilincli olarak dar: yalnizca alanin SON duzeltmesine, yalnizca
 * olcum koluna ve yalnizca bilinen alan adlarina bakiyor. Asagidaki
 * testler hem yakaladigi hem de BILEREK yakalamadigi durumlari yaziyor —
 * ikincisi olmadan bir sonraki okuyucu kontrolu "eksik" sanip genisletir
 * ve yanlis yere hata vermeye baslar.
 */

function build(specs: Specs, revisions: Revision[]): System {
  return systemSchema.parse({
    $schema_version: '0.1',
    id: 'ornek',
    slug: 'ornek',
    name: {tr: 'Örnek', en: 'Example'},
    /* IHA secildi: fuze kategorisi her varyantta range_km istiyor. */
    category: 'insansiz-hava-araci',
    manufacturer: [{id: 'uretici', name: 'Üretici'}],
    status: 'envanterde',
    variants: [{id: 'temel', label: 'Temel', specs, attributes: {}}],
    timeline: [],
    revisions,
    disclaimer: {tr: 'Bağımsız dosya.', en: 'Independent file.'}
  });
}

function measurement(value: number, operator?: Operator) {
  return {
    value,
    ...(operator ? {operator} : {}),
    confidence: 'official' as const,
    source: {tr: 'Kaynak', en: 'Source'},
    verified_at: '2026-01-01'
  };
}

const REASON = {tr: 'Gerekçe.', en: 'Rationale.'};

test('yayindaki dosyalarda uyusmazlik yok', () => {
  for (const slug of getSystemSlugs()) {
    const system = getSystem(slug);
    assert.ok(system);
    assert.deepEqual(
      revisionIssues(system),
      [],
      `${slug}: defter ile tablo ayrismis`
    );
  }
});

test('son kayittaki deger dosyada yoksa hata', () => {
  const system = build({length_m: [measurement(12.2)]}, [
    {
      date: '2026-01-02',
      field: 'length_m',
      from: {kind: 'measurement', value: 12.2, unit: 'm'},
      to: {kind: 'measurement', value: 12.3, unit: 'm'},
      reason: REASON
    }
  ]);

  const [issue] = revisionIssues(system);
  assert.ok(issue);
  assert.equal(issue.kind, 'value-missing');
  assert.equal(issue.field, 'length_m');
  assert.deepEqual(issue.found, ['12.2 m']);
});

test('yalnizca alanin SON kaydi kiyaslanir', () => {
  /*
   * Eski kayit zaten gecersiz kilinmistir; onu bugunku degerle
   * kiyaslamak her ikinci duzeltmede hata verirdi.
   */
  const system = build({length_m: [measurement(12.3)]}, [
    {
      date: '2026-01-01',
      field: 'length_m',
      from: {kind: 'removed'},
      to: {kind: 'measurement', value: 12, unit: 'm'},
      reason: REASON
    },
    {
      date: '2026-01-02',
      field: 'length_m',
      from: {kind: 'measurement', value: 12, unit: 'm'},
      to: {kind: 'measurement', value: 12.3, unit: 'm'},
      reason: REASON
    }
  ]);

  assert.deepEqual(revisionIssues(system), []);
});

test('kaldirma kaydi kiyaslanmaz', () => {
  /* Deger baska bir varyanttan kaldirilmis olabilir; alanda hala kayit olabilir. */
  const system = build({length_m: [measurement(12.3)]}, [
    {
      date: '2026-01-02',
      field: 'length_m',
      from: {kind: 'measurement', value: 12.3, unit: 'm'},
      to: {kind: 'removed'},
      reason: REASON
    }
  ]);

  assert.deepEqual(revisionIssues(system), []);
});

test('metin kolu kiyaslanmaz', () => {
  const system = build({length_m: [measurement(12.3)]}, [
    {
      date: '2026-01-02',
      field: 'length_m',
      from: {kind: 'removed'},
      to: {kind: 'text', tr: '~ 10 m (BLOK-4, basın)', en: '~ 10 m (BLOK-4, press)'},
      reason: REASON
    }
  ]);

  assert.deepEqual(revisionIssues(system), []);
});

test('sema disi alan adi kiyaslanmaz', () => {
  const system = build({length_m: [measurement(12.3)]}, [
    {
      date: '2026-01-02',
      field: 'source',
      from: {kind: 'text', tr: 'Eski', en: 'Old'},
      to: {kind: 'measurement', value: 1, unit: 'm'},
      reason: REASON
    }
  ]);

  assert.deepEqual(revisionIssues(system), []);
});

test('operator degerin parcasidir', () => {
  /* "> 280" ile "280" ayni sayi degil — §5.8 ile ayni kural. */
  const system = build({operational_range_km: [measurement(280, '>')]}, [
    {
      date: '2026-01-02',
      field: 'operational_range_km',
      from: {kind: 'removed'},
      to: {kind: 'measurement', value: 280, unit: 'km'},
      reason: REASON
    }
  ]);

  assert.equal(revisionIssues(system)[0]?.kind, 'value-missing');
});

test('aralikli kayit tek degerle eslesmez', () => {
  const system = build(
    {
      length_m: [
        {
          value: 4.3,
          upper_value: 5.2,
          confidence: 'official',
          source: {tr: 'Kaynak', en: 'Source'},
          verified_at: '2026-01-01'
        }
      ]
    },
    [
      {
        date: '2026-01-02',
        field: 'length_m',
        from: {kind: 'removed'},
        to: {kind: 'measurement', value: 4.3, unit: 'm'},
        reason: REASON
      }
    ]
  );

  const [issue] = revisionIssues(system);
  assert.ok(issue, 'aralikli kayit tek deger gibi sayilmis');
  assert.deepEqual(issue.found, ['4.3 – 5.2 m']);
});

test('birim alan adiyla tutmali', () => {
  const system = build({length_m: [measurement(12.3)]}, [
    {
      date: '2026-01-02',
      field: 'length_m',
      from: {kind: 'removed'},
      to: {kind: 'measurement', value: 12.3, unit: 'km'},
      reason: REASON
    }
  ]);

  assert.equal(revisionIssues(system)[0]?.kind, 'unit-mismatch');
});

test('deger baska bir grupta bulunabilir', () => {
  /*
   * Kayit hangi varyanta ait oldugunu soylemiyor. Aile duzeyinde duran
   * bir deger icin yazilmis duzeltme, varyant listesinde bulunamadi diye
   * hata vermemeli.
   */
  const system = systemSchema.parse({
    $schema_version: '0.1',
    id: 'ornek',
    slug: 'ornek',
    name: {tr: 'Örnek', en: 'Example'},
    category: 'insansiz-hava-araci',
    manufacturer: [{id: 'uretici', name: 'Üretici'}],
    status: 'envanterde',
    specs: {length_m: [measurement(12.3)]},
    variants: [{id: 'temel', label: 'Temel', specs: {}, attributes: {}}],
    timeline: [],
    revisions: [
      {
        date: '2026-01-02',
        field: 'length_m',
        from: {kind: 'removed'},
        to: {kind: 'measurement', value: 12.3, unit: 'm'},
        reason: REASON
      }
    ],
    disclaimer: {tr: 'Bağımsız dosya.', en: 'Independent file.'}
  });

  assert.deepEqual(revisionIssues(system), []);
});
