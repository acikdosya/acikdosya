import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {test} from 'node:test';
import {
  attributeSchema,
  systemSchema,
  timelineEventSchema,
  type Attribute,
  type TimelineEvent
} from './schema';

/**
 * Rozetin asgari atfi — openspec/specs/confidence-attribution.
 *
 * Olcum, ozellik ve takvim olayi ayni seyi tasir: guven seviyesi ve
 * okunan yayinin adi. Ozellik ayrica kontrol tarihini tasir. Eskiden
 * ozellik ve takvim olayinda kaynak istege bagliydi; TAYFUN dokuz rozeti
 * kaynaksiz yayimladi.
 *
 * Her red sinavinin yaninda ayni kaydin tam hali kabul edilir. Yoksa red
 * baska bir alandan gelebilir ve sinav yanlis seyi dogrular.
 */

/** TAYFUN gudum ozelligi — dosyada kayitli, kaynakli. */
const GUIDANCE: Attribute = {
  value: {
    tr: 'Koordinata güdüm sistemi; karıştırmaya karşı dayanıklı',
    en: 'Coordinate guidance system; resistant to jamming'
  },
  confidence: 'official',
  source: {
    tr: 'ROKETSAN TAYFUN ürün kartı',
    en: 'ROKETSAN TAYFUN product card'
  },
  source_url:
    'https://www.roketsan.com.tr/uploads/docs/kataloglar/TR/2024/1726595739_tayfun.pdf',
  verified_at: '2026-09-11'
};

/** ATMACA'nin ilk takvim olayi — dosyada kayitli, kaynakli. */
const PROJECT_START: TimelineEvent = {
  date: '2009',
  title: {tr: 'Proje başlangıcı', en: 'Project start'},
  confidence: 'press',
  source: {tr: 'Daily Sabah, 5 Temmuz 2020', en: 'Daily Sabah, 5 Jul 2020'},
  source_url:
    'https://www.dailysabah.com/business/defense/turkeys-1st-maritime-missile-atmaca-successfully-passes-latest-test'
};

function without<T extends object>(
  record: T,
  key: keyof T & string
): unknown {
  return Object.fromEntries(
    Object.entries(record).filter(([name]) => name !== key)
  );
}

type ParseResult = {
  success: boolean;
  error?: {issues: {path: PropertyKey[]}[]};
};

function failsAt(result: ParseResult, field: string) {
  assert.equal(result.success, false);
  assert.ok(
    result.error?.issues.some((issue) => issue.path[0] === field),
    `hata ${field} alanina isaret etmeli`
  );
}

test('kaynakli ozellik ve takvim olayi kabul edilir', () => {
  assert.equal(attributeSchema.safeParse(GUIDANCE).success, true);
  assert.equal(timelineEventSchema.safeParse(PROJECT_START).success, true);
});

test('kaynak adi olmayan ozellik reddedilir', () => {
  failsAt(attributeSchema.safeParse(without(GUIDANCE, 'source')), 'source');
});

test('kontrol tarihi olmayan ozellik reddedilir', () => {
  failsAt(
    attributeSchema.safeParse(without(GUIDANCE, 'verified_at')),
    'verified_at'
  );
});

test('kaynak adi olmayan takvim olayi reddedilir', () => {
  failsAt(
    timelineEventSchema.safeParse(without(PROJECT_START, 'source')),
    'source'
  );
});

test('koken kimligi kaynak adinin yerine gecmez', () => {
  /*
   * Koken, okunan yayinin aktardigi belgedir. Kimligi tek basina
   * okuyucuya bizim hangi yayini okudugumuzu soylemez.
   */
  const originOnly = {
    ...(without(PROJECT_START, 'source') as Record<string, unknown>),
    origin_id: 'demir-2022-12-30'
  };
  failsAt(timelineEventSchema.safeParse(originOnly), 'source');
});

test('kaynakli uc dosya kuraldan degismeden gecer', () => {
  for (const slug of ['atmaca', 'akinci', 'siper']) {
    const file = join(process.cwd(), 'content', 'systems', `${slug}.json`);
    const raw: unknown = JSON.parse(readFileSync(file, 'utf8'));
    const result = systemSchema.safeParse(raw);
    assert.equal(
      result.success,
      true,
      `${slug}: ${JSON.stringify(result.error?.issues)}`
    );
  }
});
