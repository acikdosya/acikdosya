import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import {buildGroup} from './build3d';
import {
  isSectioned,
  partsBounds,
  sectionExtent,
  stationExtents,
  stationSections,
  vec3,
  type BodyPart,
  type LatheSpec,
  type SectionPoint
} from './parts';
import {projectBounds} from './project2d';

/**
 * Anahtar kesitler — istasyon basina profil.
 *
 * Ornek iki profil ayni nokta sayisini tasiyor ve i. nokta ikisinde de
 * ayni kenari gosteriyor: alt orta, kose, ust orta. Elmas profilin
 * kosesi yanda (v = 0, w = 1); yuvarlaga yakin profilde ayni nokta
 * yine en genis yer. Sayilar bicim degil sinav icin secildi.
 */
const DIAMOND: SectionPoint[] = [
  {v: -1, w: 0},
  {v: -0.5, w: 0.5},
  {v: 0, w: 1},
  {v: 0.5, w: 0.5},
  {v: 1, w: 0}
];
const ROUND: SectionPoint[] = [
  {v: -1, w: 0},
  {v: -0.7, w: 0.7},
  {v: 0, w: 1},
  {v: 0.7, w: 0.7},
  {v: 1, w: 0}
];

function body(spec: LatheSpec): BodyPart {
  return {kind: 'body', id: 'body', orientation: 'along', origin: vec3(), spec};
}

const KEYED: LatheSpec = {
  aspect: 1,
  stations: [
    {y: 0, radius: 0.0005, section: DIAMOND},
    {y: 1, radius: 0.5, section: DIAMOND},
    {y: 2, radius: 0.5},
    {y: 3, radius: 0.5, section: ROUND},
    {y: 4, radius: 0.5}
  ]
};

test('ara istasyon iki anahtarin nokta nokta gecisi', () => {
  const sections = stationSections(KEYED);
  assert.ok(sections);
  assert.equal(sections.length, 5);
  // y = 2, iki anahtarin tam ortasi: 0,5 ile 0,7 arasi.
  assert.equal(sections[2][1].w, 0.6);
  assert.equal(sections[2][1].v, -0.6);
  // Son anahtardan sonra en yakin anahtar tasinir.
  assert.deepEqual(sections[4], ROUND);
  // Kose kendi noktasinda kalir; yeniden ornekleme yok.
  for (const profile of sections) assert.deepEqual(profile[2], {v: 0, w: 1});
});

test('tek profilli govdenin yolu degismez', () => {
  const spec: LatheSpec = {
    aspect: 1,
    section: DIAMOND,
    stations: [
      {y: 0, radius: 0.1},
      {y: 1, radius: 0.5}
    ]
  };
  const sections = stationSections(spec);
  assert.ok(sections);
  assert.ok(sections.every((profile) => profile === DIAMOND));
  assert.deepEqual(sectionExtent(spec), {up: 1, down: 1, width: 1});
  assert.equal(
    stationSections({aspect: 1.2, stations: [{y: 0, radius: 1}]}),
    undefined
  );
});

test('anahtar kesit gecersiz yazilirsa reddedilir', () => {
  assert.throws(
    () =>
      stationSections({
        aspect: 1,
        section: DIAMOND,
        stations: [{y: 0, radius: 1, section: ROUND}]
      }),
    /birlikte yazilamaz/
  );
  assert.throws(
    () =>
      stationSections({
        aspect: 1,
        stations: [
          {y: 0, radius: 1, section: DIAMOND},
          {y: 1, radius: 1, section: ROUND.slice(0, 4)}
        ]
      }),
    /ayni nokta sayisini/
  );
  // Tek uzanim anahtar kesitli govdede anlamsiz; sessizce yanlis donmez.
  assert.throws(() => sectionExtent(KEYED), /istasyon basina/);
});

test('uzanim, sinir ve izdusum istasyonun kendi profilini okur', () => {
  const profileUp = (profile: SectionPoint[]) =>
    Math.max(...profile.map((point) => point.v));
  const extents = stationExtents(KEYED);
  assert.equal(extents[1].width, 1);
  assert.equal(extents[3].up, profileUp(ROUND));

  const part = body(KEYED);
  const bounds = partsBounds([part]);
  assert.equal(bounds.max.z, 0.5);
  assert.equal(bounds.max.x, 0.5);

  // Ustten ve yandan gorunus uc boyutlu sinirla ayni uzanimi verir.
  const top = projectBounds([part], 'top');
  const side = projectBounds([part], 'side');
  assert.ok(top && side);
  assert.ok(Math.abs(top.maxV - top.minV - 1) < 1e-9, 'en 1 m');
  assert.ok(Math.abs(side.maxV - side.minV - 1) < 1e-9, 'boy 1 m');
  assert.ok(isSectioned(KEYED));
});

test('uc boyutlu govde her istasyonda ayni sayida nokta tasir', () => {
  const {group} = buildGroup([body(KEYED)]);
  let vertices = 0;
  group.traverse((node) => {
    if (node instanceof THREE.Mesh) {
      vertices += (node.geometry as THREE.BufferGeometry).attributes.position
        .count;
    }
  });
  // Halka: 5 noktali profil + 3 ayna noktasi = 8; bes istasyon.
  assert.equal(vertices, 8 * 5);
});
