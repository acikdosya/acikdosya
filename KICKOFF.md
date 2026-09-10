# KICKOFF.md — Claude Code'a verilecek ilk prompt

> Kullanım: boş bir klasör aç, içine `CLAUDE.md`, `reference/prototype.html` ve
> `reference/tayfun.json` dosyalarını koy, `claude` başlat ve aşağıdaki metni yapıştır.

---

## İlk prompt

```
Sıfırdan bir Next.js projesi kuracağız. Projenin kalıcı bağlamı CLAUDE.md'de;
önce onu oku. reference/prototype.html çalışan bir tek dosya prototip —
davranış ve tasarım referansı olarak al, kopyalama, yeniden yapılandır.
reference/tayfun.json veri şemasının doldurulmuş örneği.

Faz 0 hedefi: TAYFUN için tek bir derin sayfa, üretime yakın kalitede.

Yapılacaklar:

1. Next.js (App Router) + TypeScript + Tailwind iskeleti kur. pnpm kullan.
   next-intl ile TR (varsayılan) ve EN rotaları. ESLint + tsconfig strict.

2. lib/schema.ts içinde zod ile veri şemasını yaz. CLAUDE.md §3'teki
   Measurement sözleşmesine birebir uy. Build zamanında content/ altındaki
   tüm JSON'ları doğrulayan bir script ekle (pnpm validate:content) ve
   build'e bağla.

3. reference/tayfun.json'ı content/systems/tayfun.json'a taşı, şemaya uydur,
   eksik alanları TODO ile işaretle — uydurma değer üretme.

4. Tasarım tokenlarını (CLAUDE.md §4) CSS custom property olarak globals.css'e
   koy, Tailwind theme'e bağla. Archivo ve Source Serif 4'ü next/font/local ile
   self-host et (Google CDN kullanma) — font dosyalarını nereden indireceğimi
   bana söyle, ben koyacağım.

5. Şu bileşenleri kur, her biri kendi klasöründe, veriyle beslenen ve
   Türkçe/İngilizce çalışan halde:
   - ScaleSilhouette: length_m ve diameter_mm'den SVG siluet üretir,
     1,8 m insan figürüyle ölçekli. Sayfa yüklenirken bir kez çizim animasyonu,
     prefers-reduced-motion desteği.
   - SpecTable: her alan için değer + güven rozeti + kaynak. Bir alanda birden
     fazla değer varsa çelişkiyi görünür kıl, gizleme.
   - Timeline: sıralı program olayları, güven rozetli.
   - RangeEnvelope: MapLibre GL, jeodezik halkalar (lib/geo.ts içinde kendi
     büyük daire fonksiyonumuz, Turf ekleme). Sürüklenebilir referans nokta,
     halka aç/kapa kontrolleri. Harita bileşeni dinamik import, SSR kapalı.
     CLAUDE.md §5'teki dil kurallarına uy — hedef/şehir etiketlemesi yok.

6. app/[locale]/sistemler/[slug]/page.tsx — bu bileşenleri birleştiren sayfa,
   generateStaticParams ile SSG. Footer'da bağımsızlık ibaresi.

7. content/assets.json'ı boş lisans kaydıyla oluştur ve README'de kuralı yaz.

Harita tile'ı için şimdilik demotiles.maplibre.org kullan ama tile URL'ini
tek bir config noktasından oku — sonra kendi PMTiles'ımıza geçeceğiz.

3D henüz yok. Sayfada yerini bırak, boş bileşen kurma.

Başlamadan önce bana kısa bir plan ve dosya listesi çıkar, onaylayayım.
Sonra adım adım ilerle; her adımdan sonra typecheck ve lint çalıştır.
```

---

## Faz 0 bittiğinde "tamam" sayılma ölçütü

- [ ] `pnpm build` temiz geçiyor, içerik doğrulaması build'e bağlı
- [ ] TR ve EN rotaları çalışıyor, Türkçe karakterler her fontta doğru
- [ ] Menzil haritası mobilde akıcı, ilk yüklemede JS bütçesi < 180 KB gzip
- [ ] Tablodaki her sayının bir kaynağı ve güven seviyesi var
- [ ] Lighthouse: performans > 90, erişilebilirlik > 95
- [ ] Klavye ile tüm interaktif öğelere erişilebiliyor, focus görünür

## Faz 0'dan sonraki sıra

1. GLB pipeline + R3F model görüntüleyici (hotspot'lu patlatılmış görünüm)
2. İkinci sistemi ekle → kıyas motoru (şemanın çok ürünlü çalıştığını doğrular)
3. PMTiles self-host
4. Android: önce PWA/TWA, trafik gelirse Kotlin + Compose kabuk + ARCore Scene Viewer
