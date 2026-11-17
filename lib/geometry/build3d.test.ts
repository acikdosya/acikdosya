import assert from 'node:assert/strict';
import {test} from 'node:test';
import * as THREE from 'three';
import {buildGroup} from './build3d';
import {wingStations} from './panel';
import {vec3, type DiscPart, type PanelPart, type Part} from './parts';

/**
 * Yuzey sarimi disa bakar.
 *
 * Malzeme yalniz on yuzu cizer; ice bakan bir yuz disaridan delik gibi
 * gorunur. Disbukey bir loftta (duz, sabit vecheli panel; sabit vecheli
 * kanat) her yuzun normali parcanin agirlik merkezinden uzaga bakmali.
 * Ayna parcada grubun olcegi sarimi cevirir; three bunu determinant
 * isaretiyle telafi eder, test de ayni isareti kullanir.
 */
function inwardFaces(part: Part): number {
  const {group} = buildGroup([part]);
  group.updateMatrixWorld(true);
  const triangles: Array<[THREE.Vector3, THREE.Vector3, THREE.Vector3]> = [];

  group.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    const geometry = node.geometry as THREE.BufferGeometry;
    const position = geometry.attributes.position;
    const index = geometry.index;
    if (!index) return;
    const flip = node.matrixWorld.determinant() < 0;
    for (let i = 0; i < index.count; i += 3) {
      const corner = (k: number) =>
        new THREE.Vector3().fromBufferAttribute(position, index.getX(i + k)).applyMatrix4(node.matrixWorld);
      const a = corner(0);
      const b = flip ? corner(2) : corner(1);
      const c = flip ? corner(1) : corner(2);
      triangles.push([a, b, c]);
    }
  });

  const centre = new THREE.Vector3();
  for (const [a, b, c] of triangles) centre.add(a).add(b).add(c);
  centre.divideScalar(triangles.length * 3);

  let inward = 0;
  for (const [a, b, c] of triangles) {
    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    if (normal.lengthSq() < 1e-14) continue;
    const middle = new THREE.Vector3().add(a).add(b).add(c).divideScalar(3);
    if (normal.dot(middle.sub(centre)) < 0) inward++;
  }
  return inward;
}

const STATIONS = wingStations({
  span: 1,
  rootChord: 0.5,
  tipChord: 0.5,
  thicknessRatio: 0.16,
  closeTip: false
});

for (const mirror of [false, true]) {
  test(`acik uclu panelin kok ve uc kapagi disa bakar${mirror ? ' (ayna)' : ''}`, () => {
    const panel: PanelPart = {
      kind: 'panel',
      id: 'test-panel',
      root: vec3(0, 0, 2),
      angleDeg: 90,
      mirror,
      stations: STATIONS,
      rootFillet: 0
    };
    assert.equal(inwardFaces(panel), 0);
  });
}

test('kesik uclu pervane kanadinin kapaklari disa bakar', () => {
  const disc: DiscPart = {
    kind: 'disc',
    id: 'test-disc',
    orientation: 'along',
    center: vec3(),
    radius: 1,
    hubRadius: 0.01,
    bladeCount: 1,
    bladeChord: 0.2,
    thickness: 0.002,
    blade: {
      angleDeg: 20,
      stations: [0.2, 0.6, 1].map((span) => ({span, rise: 0, offset: -0.1, chord: 0.2, thickness: 0.024}))
    }
  };
  // Gobek silindiri de disbukey ama kanattan ayri; yalniz kanadi say.
  const {group} = buildGroup([disc]);
  let meshes = 0;
  group.traverse((node) => {
    if (node instanceof THREE.Mesh) meshes++;
  });
  assert.equal(meshes, 2);
  assert.equal(inwardFaces({...disc, hubRadius: 0, thickness: 0}), 0);
});
