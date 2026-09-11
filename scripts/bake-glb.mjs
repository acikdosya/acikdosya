#!/usr/bin/env node
/**
 * Parametrik geometriyi build zamanında GLB'ye pişirir.
 *
 * Neden gerekli: ARCore Scene Viewer bir dosya URL'i ister, runtime geometri kabul
 * etmez. Tek kaynak (content/systems/*.json) → iki çıktı (web'de runtime mesh,
 * AR'da statik GLB).
 *
 * Kullanım:  pnpm bake:models   (tsx üzerinden — script .ts modül okur)
 * Çıktı:     public/models/<slug>-<variant>.glb
 */

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { dedup, draco, prune, weld } from '@gltf-transform/functions';
import draco3d from 'draco3dgltf';
import { buildModel } from '../lib/geometry/model.ts';
import { systemKind } from '../lib/geometry/measurements.ts';

/**
 * three'nin GLTFExporter'ı ikili çıktıyı FileReader üzerinden topluyor;
 * bu tarayıcı API'si Node'da yok. Blob.arrayBuffer() ile aynı işi yapan
 * asgari bir vekil kuruyoruz — yalnızca bu script sürecinde geçerli.
 */
if (typeof globalThis.FileReader === 'undefined') {
  globalThis.FileReader = class {
    readAsArrayBuffer(blob) {
      blob.arrayBuffer().then(
        (buffer) => { this.result = buffer; this.onloadend?.(); },
        (error) => { this.onerror?.(error); },
      );
    }
  };
}

const CONTENT = 'content/systems';
const OUT = 'public/models';
const MAX_BYTES = 3 * 1024 * 1024; // CLAUDE.md §6 — model başına 3 MB

/**
 * Kontur ve ölçü çizgileri GLB'ye girmez: Draco yalnızca üçgen primitif
 * sıkıştırır, çizgiler bütçeyi sıkıştırılmadan şişirir. AR'da şematik gri
 * gövde yeterli — web sahnesi konturu zaten runtime üretiyor.
 */
function stripLines(group) {
  const lines = [];
  group.traverse((node) => {
    if (node.isLine || node.isLineSegments) lines.push(node);
  });
  for (const line of lines) line.parent?.remove(line);
}

async function exportGlb(group) {
  const scene = new THREE.Scene();
  // Web sahnesiyle aynı duruş: uzun eksen yatay. Burnu yere bakan dikey
  // model hem yanlış okunur hem de sayfanın tonuna aykırı.
  group.rotation.z = Math.PI / 2;
  scene.add(group);
  const exporter = new GLTFExporter();
  const buffer = await new Promise((resolve, reject) =>
    exporter.parse(scene, resolve, reject, { binary: true }));
  return Buffer.from(buffer);
}

async function optimize(buffer) {
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({
      'draco3d.encoder': await draco3d.createEncoderModule(),
      'draco3d.decoder': await draco3d.createDecoderModule(),
    });
  const doc = await io.readBinary(new Uint8Array(buffer));
  await doc.transform(dedup(), prune(), weld(), draco());
  return Buffer.from(await io.writeBinary(doc));
}

const num = (field) => Array.isArray(field) && field[0] ? field[0].value : null;

async function main() {
  await mkdir(OUT, { recursive: true });
  const files = (await readdir(CONTENT)).filter((f) => f.endsWith('.json'));
  let failed = false;

  for (const file of files) {
    const system = JSON.parse(await readFile(path.join(CONTENT, file), 'utf8'));

    if (systemKind(system) === 'aircraft') {
      console.log(`atlandı  ${system.slug} — ilk sürümde İHA modeli üretilmiyor`);
      continue;
    }

    for (const variant of system.variants ?? []) {
      const lengthM = num(variant.specs?.length_m);
      const diameterMm = num(variant.specs?.diameter_mm);

      if (lengthM == null || diameterMm == null) {
        console.log(`atlandı  ${system.slug}/${variant.id} — ölçü verisi yok`);
        continue; // uydurma değer üretme (CLAUDE.md §7)
      }

      const { group, dispose } = buildModel({ systemSlug: system.slug, lengthM, diameterMm, radialSegments: 64 });
      stripLines(group);
      const raw = await exportGlb(group);
      const glb = await optimize(raw);
      dispose();

      const name = `${system.slug}-${variant.id}.glb`;
      await writeFile(path.join(OUT, name), glb);

      const kb = (glb.length / 1024).toFixed(0);
      if (glb.length > MAX_BYTES) {
        console.error(`BÜTÇE AŞIMI  ${name} — ${kb} KB`);
        failed = true;
      } else {
        console.log(`yazıldı  ${name}  ${kb} KB`);
      }
    }
  }

  if (failed) process.exit(1);
}

main().catch((e) => { console.error(e); process.exit(1); });
