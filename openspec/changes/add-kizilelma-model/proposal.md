## Why

KIZILELMA dosyası (`add-kizilelma-system-file`) modelsiz yayımlanıyor; sayfa ölçek
şemasında kesikli ölçü zarfı çiziyor. Üreticinin ürün sayfasındaki KeyShotXR
gösterisinin 18 karesi biçimi okumaya yetiyor. 18 karenin silüetinden kurulan görsel zarf her
kareye geri izdüşürüldüğünde örtüşme 0,955–0,984: kamera ortografik, yatay, adım
20°.

Biçimin baskın özelliği parça kitinde ifade edilemiyor. Gövde kesiti eksen boyunca
biçim değiştiriyor: köşeli (chine) elmas burun, hava alıklı yassı orta gövde,
yuvarlak lüle. `LatheSpec.section` bütün gövdeye tek profil taşıyor; köşe ya
vardır ya yoktur.

## What Changes

- **Kit:** `LatheStation.section` — anahtar kesit. Ara istasyonlar nokta nokta
  doğrusal geçiş; anahtarlar aynı nokta sayısını taşır, yeniden örnekleme yok.
  `stationSections` / `stationExtents` tek kaynak; `build3d`, `project2d`, sınır ve
  etiket çapası oradan okur. Tek profilli ürünlerin çıktısı bayt bayt aynı.
- **Ürün:** `lib/geometry/kizilelma.ts` — gövde, kanat, kanard, dışa yatık çift
  kuyruk, iniş takımı. Oranlar köken beyanıyla (§9): karelerden okunanlar
  `reading`, görülemeyenler `chosen`. Kanat kök veteri ve hücum kenarı oku `chosen`
  (kamera yukarıdan bakmıyor; AKINCI emsali).
- **Yükseklik:** takım boyu yayımlanan 3,5 m'den türer (TB2 emsali). Karelerde
  yükseklik 3,69 m (+%5,4); dış uyum dikeyde düşüyor, uyuşmazlık kayda geçer
  (`model-provenance`).
- **İçerik:** `kizilelma.json` etiketleri, `RatioLabels`, `assets.json` geometri
  kaydı, araştırma notu.

Yayındaki beş dosyanın modeli ve şeması değişmez.

## Capabilities

### New Capabilities

Yok.

### Modified Capabilities

- `system-geometry`: "Biçim parça listesi ve oran tablosu olarak tanımlanır"
  gereksinimi — gövde tek kesit biçimiyle sınırlanmaz; anahtar kesit ve geçiş.

## Non-goals

- Oranları `measured`'a yükseltmek. Görsel zarf sınavı aynı döner gösterinin
  kareleri; §9 bunu izdüşüm sınavı saymıyor. Karar TB2'deki gibi bekliyor.
- Hava alığı ağzı, lüle içi, açık takım kapakları: karelerde açıklık ya da açık
  kapak, şematik yüzeyde çizilmez; biçim kaydında yazılır.
- Mühimmat ve yük istasyonu (§9).
- Gövde kesitlerinin ön görünüşte birleşimi: şema bugün kesitlerin dışbükey zarfını
  alıyor; içbükey bölge düzleşir.

## Impact

§9 parametrik model ve oran kökeni; `lib/geometry/parts.ts`, `build3d.ts`,
`project2d.ts`; `registry.ts`; GLB bütçesi (< 3 MB).
