import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import {AKINCI_PROFILE} from './akinci';
import {buildAircraft} from './aircraft';
import {buildModel, modelBounds} from './model';

/**
 * Modelin kaynakli iki olcusu var: uzunluk ve kanat acikligi. Testler
 * bunlari koruyor.
 *
 * Kanat ucu yukari donunce panelin kendi boyu uzuyor; kalinlik payi da
 * yatay erisime ekleniyor. Ikisi hesaba katilmazsa model, yayimlanmis
 * kanat acikligindan birkac santim genis cikar — sayfa "20 m" yazarken
 * mesh 20,10 m olur.
 */

const AKINCI = {lengthM: 12.2, wingspanM: 20} as const;

function bounds(group: THREE.Object3D) {
  const box = new THREE.Box3().setFromObject(group);
  const size = new THREE.Vector3();
  box.getSize(size);
  return {box, size};
}

test('mesh kaynakli uzunluk ve kanat acikligini birebir tasir', () => {
  const model = buildAircraft({...AKINCI, profile: AKINCI_PROFILE});
  const {size} = bounds(model.group);

  // z: kanat acikligi, y: govde ekseni (result.ts'teki ortak cerceve).
  assert.ok(
    Math.abs(size.z - AKINCI.wingspanM) < 0.01,
    `aciklik ${size.z}, beklenen ${AKINCI.wingspanM}`
  );
  assert.ok(
    Math.abs(size.y - AKINCI.lengthM) < 0.01,
    `uzunluk ${size.y}, beklenen ${AKINCI.lengthM}`
  );

  model.dispose();
});

test('olcu degisince mesh degisir', () => {
  const model = buildAircraft({
    lengthM: 6,
    wingspanM: 9,
    profile: AKINCI_PROFILE
  });
  const {size} = bounds(model.group);

  assert.ok(Math.abs(size.z - 9) < 0.01);
  assert.ok(Math.abs(size.y - 6) < 0.01);

  model.dispose();
});

test('kanat ucu yukari doner, asagi degil', () => {
  const model = buildAircraft({...AKINCI, profile: AKINCI_PROFILE});
  const {box} = bounds(model.group);

  // +x yukari. Kuyruk ucu en yuksek nokta, olculen degere yakin olmali.
  const tailTop = AKINCI.lengthM * AKINCI_PROFILE.tailHeightRatio;
  assert.ok(
    box.max.x > tailTop * 0.95 && box.max.x < tailTop * 1.15,
    `kuyruk ucu ${box.max.x}, olculen ${tailTop}`
  );

  model.dispose();
});

test('kadraj hesabi mesh ile ayni olculeri verir', () => {
  const built = buildModel({
    systemSlug: 'akinci',
    dimensions: {kind: 'aircraft', ...AKINCI}
  });
  const quick = modelBounds({
    systemSlug: 'akinci',
    dimensions: {kind: 'aircraft', ...AKINCI}
  });

  assert.ok(built && quick);
  assert.deepEqual(quick, built.dimensions);
  built.dispose();
});

test('olcu turu profil turuyle uyusmazsa model uretilmez', () => {
  // AKINCI ucak profili tasiyor; fuze olcusu gelirse govde uydurulmaz.
  assert.equal(
    buildModel({
      systemSlug: 'akinci',
      dimensions: {kind: 'missile', lengthM: 6, diameterMm: 610}
    }),
    undefined
  );
  assert.equal(
    buildModel({
      systemSlug: 'tayfun',
      dimensions: {kind: 'aircraft', lengthM: 12, wingspanM: 20}
    }),
    undefined
  );
});
