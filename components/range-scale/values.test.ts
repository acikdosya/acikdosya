import assert from 'node:assert/strict';
import {test} from 'node:test';
import {captionKeys, scaleKm, valueLabel} from './values';

/*
 * Ornek degerler icerikte kayitli: AKINCI'nin 6.000 km operasyonel
 * menzili, KIZILELMA'nin 500 nm gorev yaricapi.
 */

test('kilometre alaninin etiketi degismedi', () => {
  assert.equal(valueLabel('operational_range_km', 6000, 'tr'), '6.000 km');
  assert.equal(valueLabel('operational_range_km', 6000, 'en'), '6,000 km');
  assert.equal(scaleKm('operational_range_km', 6000), 6000);
});

test('gorev yaricapi kaynagin biriminde basilir, cubuk kilometrede', () => {
  assert.equal(valueLabel('combat_radius_nm', 500, 'tr'), '500 NM');
  assert.equal(valueLabel('combat_radius_nm', 500, 'en'), '500 NM');
  assert.equal(scaleKm('combat_radius_nm', 500), 926);
});

test('bicimlenmis deger dizesi birimiyle birlesir', () => {
  assert.equal(valueLabel('combat_radius_nm', '500', 'tr'), '500 NM');
});

test('altyazi cetveldeki alanlarin gerekcesini secer', () => {
  assert.deepEqual(captionKeys(['operational_range_km']), ['caption']);
  assert.deepEqual(captionKeys(['combat_radius_nm']), ['captionRadius']);
  assert.deepEqual(captionKeys(['range_km', 'combat_radius_nm']), [
    'caption',
    'captionRadius'
  ]);
  assert.deepEqual(captionKeys([]), []);
});
