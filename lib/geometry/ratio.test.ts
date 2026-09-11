import assert from 'node:assert/strict';
import {test} from 'node:test';
import {chosen, measured, ratioValue, ratioValues} from './ratio';
import {ratioSchema} from './ratio.schema';

const NOTE = {tr: 'gerekce', en: 'rationale'};

function measuredFixture(overrides: Record<string, unknown> = {}) {
  return {
    basis: 'measured',
    value: 0.09,
    note: NOTE,
    source_url: 'https://example.org/on-gorunus.png',
    seen_at: '2026-09-11',
    axis: 'lateral',
    projection_check: {tr: 'sinav', en: 'check'},
    ...overrides
  };
}

test('olculmus oran kaynak, tarih, eksen ve izdusum sinavi tasir', () => {
  assert.equal(ratioSchema.safeParse(measuredFixture()).success, true);
});

for (const missing of [
  'source_url',
  'seen_at',
  'axis',
  'projection_check'
] as const) {
  test(`olculmus oranda ${missing} eksikse sema duser`, () => {
    const fixture = measuredFixture();
    delete (fixture as Record<string, unknown>)[missing];
    assert.equal(ratioSchema.safeParse(fixture).success, false);
  });
}

test('dikey olculmus oran da ayni dort alani zorunlu tutar', () => {
  const fixture = measuredFixture({axis: 'vertical'});
  delete (fixture as Record<string, unknown>).projection_check;
  assert.equal(ratioSchema.safeParse(fixture).success, false);
});

test('izdusum sinavi bos dize olamaz', () => {
  const fixture = measuredFixture({projection_check: {tr: '', en: ''}});
  assert.equal(ratioSchema.safeParse(fixture).success, false);
});

test('gelecek tarihli seen_at reddedilir', () => {
  const fixture = measuredFixture({seen_at: '2099-01-01'});
  assert.equal(ratioSchema.safeParse(fixture).success, false);
});

test('secilmis oran kaynak alani tasiyamaz', () => {
  const fixture = {
    basis: 'chosen',
    value: 3,
    note: NOTE,
    source_url: 'https://example.org/x.png'
  };
  assert.equal(ratioSchema.safeParse(fixture).success, false);
});

test('secilmis oran gerekcesiz olamaz', () => {
  assert.equal(
    ratioSchema.safeParse({basis: 'chosen', value: 3}).success,
    false
  );
});

test('koken beyani olmayan oran reddedilir', () => {
  assert.equal(ratioSchema.safeParse({value: 0.09}).success, false);
});

test('yardimcilar semadan gecen nesne uretir', () => {
  const m = measured(0.22, {
    note: NOTE,
    source_url: 'https://example.org/yan-gorunus.png',
    seen_at: '2026-09-11',
    axis: 'along',
    projection_check: {tr: 'sinav', en: 'check'}
  });
  const c = chosen(3, {note: NOTE});

  assert.equal(ratioSchema.safeParse(m).success, true);
  assert.equal(ratioSchema.safeParse(c).success, true);
  assert.equal(ratioValue(m), 0.22);
  assert.equal(ratioValue(c), 3);
  assert.equal(ratioValue(1.5), 1.5);
  assert.deepEqual(ratioValues({a: m, b: c}), {a: 0.22, b: 3});
});
