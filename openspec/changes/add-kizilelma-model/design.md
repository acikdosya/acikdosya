## Context

Gerekçe proposal.md'de. Kitin bugünkü hali: `sectionExtent(spec)` tek profilin
uç değerlerini döndürür ve `latheBounds`, `partAnchor`, `project2d.reach` bunu
parça başına bir kez okur; `sectionGeometry` tek halkayı her istasyonda ölçekler.

## Decisions

**1. Anahtar kesit, eşleşen noktalar.** `LatheStation.section` yalnız anahtar
istasyonlarda yazılır; ara istasyon iki komşu anahtarın nokta nokta doğrusal
geçişidir. Anahtarlar aynı nokta sayısını taşır ve i. nokta hepsinde aynı kenarı
gösterir. *Reddedilen:* yay boyuna göre yeniden örnekleme — köşeyi yuvarlar; köşe
burnun bilgisi. *Reddedilen:* her istasyona profil yazmak — geçiş elle yazılır,
drift üretir.

**2. Tek kaynak.** `stationSections(spec)` ve `stationExtents(spec)` profil ve uç
değerleri istasyon başına verir. Tek profilli gövdede hepsi aynı profil — mevcut yol.
`sectionExtent` ve `sectionLowerAt` anahtar kesitli gövdede hata atar: tek bir
uzanım yoktur, sessizce yanlış değer dönmez.

**3. Karışık yazım reddedilir.** Gövde düzeyinde `section` ile istasyon anahtarı
birlikte yazılamaz. Hangisinin kazandığı bir kural daha olurdu.

**4. Ön görünüş dışbükey zarf.** Anahtar kesitli gövdenin uçtan görünüşü
istasyon halkalarının dışbükey zarfı (TB2'nin kayan kesitleriyle aynı yol). Çokgen
birleşimi kitin dışında; içbükeylik kaybı proposal'da kapsam dışı.

**5. Okuma yöntemi.** Görsel zarf (18 kare, 2 px voksel). Yan profil ve gövde
kesitleri zarftan; uç köşeleri karelerin uç noktalarından üçgenleme (bir köşe en az
iki karede, farkı ≤ 7 px). Kanat planformu zarftan okunamaz: yatay kamera, 20°
aralıklı dokuz doğrultu hücum kenarı içbükeyliğini oymuyor.

**6. Yükseklik.** Takım boyu yayımlanan yükseklikten türer (TB2). Karelerdeki
takım 0,19 m uzun; fark biçim kaydında ve araştırma notunda.

## Risks / Trade-offs

- [Mevcut ürünlerde gerileme] → Altı ürünün parça sınırı ve üç görünüş izdüşümü
  değişiklikten önce ve sonra bayt bayt aynı (karşılaştırma betiği kayıtta değil,
  sonucu PR'da).
- [GLB boyutu] → Anahtar kesit halka nokta sayısını artırmaz; istasyon sayısı TB2
  düzeyinde tutulur.
- [Planform `chosen`] → Sayfada köken kaydı açıkça söyler; ileride üstten bir
  kaynak bulunursa oran değişir, model kendiliğinden güncellenir.
