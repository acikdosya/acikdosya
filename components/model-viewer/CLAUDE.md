# 3D görüntüleyici — teknik kararlar

İlkeler kök CLAUDE.md §9'da; model dekoratiftir, hiçbir bilgi yalnızca 3D içinde
bulunmaz. Parça kitinin kendisi `lib/geometry/CLAUDE.md` içinde.

| Konu | Karar |
|---|---|
| Runtime | three.js + @react-three/fiber + @react-three/drei |
| Yükleme | `next/dynamic` + `ssr:false` + IntersectionObserver; bölüme gelmeden yüklenmez |
| Hotspot | drei `<Html occlude>` — DOM elemanı, yani çevrilebilir ve erişilebilir |
| Segment | parça sınıfı başına ayrı: gövde mobil 48 / masaüstü 72, disk ve çubuk daha düşük |
| Fallback | WebGL yoksa `ScaleSilhouette` — aynı parça listesinin ortografik izdüşümü |
| Görünüş | genel görünüm, ön görünüş ve etiket başına odak; kamera konumu elle yazılmaz |
| Bellek | R3F unmount'ta `dispose()` çağrılır — geometri ve materyal sızdırmaz |
| Hareket | `prefers-reduced-motion` ise autoRotate kapalı, `frameloop="demand"` |
| AR | `scripts/bake-glb.mjs` build'de GLB pişirir, ARCore Scene Viewer intent'i onu kullanır |
