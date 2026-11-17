## Why

Altıncı dosya Bayraktar KIZILELMA. Üreticinin ürün sayfası (TR/EN, 17 Kasım 2026'da
okundu) on bir sayısal beyan veriyor. Bugünkü `lib/schema.ts` bunlardan **sekizini**
olduğu gibi alıyor (uzunluk, açıklık, yükseklik, MTOW, faydalı yük, havada kalış,
servis tavanı, operasyonel irtifa). **Üçünü** alamıyor:

- **0,6 ve 0,9 Mach** seyir ve azami hız. Şemadaki hız alanları KTAS. Mach'ı KTAS'a
  çevirmek bir irtifa ister — ses hızı sıcaklıkla değişir — ve sayfa irtifa yazmıyor.
  Çevrilmiş sayı kaynağın söylemediği bir sayı olurdu (§5.7). TB2'de broşürün
  "70 knots" değeri aynı gerekçeyle KTAS alanına çevrilmemişti.
- **500 nm görev yarıçapı.** `operational_range_km` AKINCI'da üreticinin
  "operasyonel menzil" terimi için açıldı ve yarıçap olarak yorumlanmadı; görev
  yarıçapı ise tanımı gereği bir yarıçap beyanı. Aynı alana konursa iki farklı nicelik
  tek cetvele girer. Kilometreye çevrilip yazılırsa sayfada kaynakta olmayan bir sayı
  (926) belirir.

Görev yarıçapı `specs/range-envelope`'ta bir boşluk açıyor. "Ölçütü karşılayan değer"
senaryosu her yöne geçerli bir mesafe beyanından halka çizilmesini istiyor ve görev
yarıçapı bu tarife uyuyor. Ama sayfa görev profilini (yük, yedek yakıt, irtifa)
yazmıyor; halka bu koşullu sayıyı her yöne koşulsuz geçerli bir mesafe olarak
okuturdu. Karar verildi: halka çizilmez, değer mesafe cetvelinde durur. Spec bu kararı
bugün taşımıyor. Kayda geçmezse ya halka "unutulmuş" görünür ya da bir sonraki dosya
aynı soruyu yeniden açar.

## What Changes

- `lib/schema.ts` alanları: `cruise_speed_mach`, `max_speed_mach`, `combat_radius_nm`.
- `lib/measurement/divergence.ts`: `mach` ve `nm` birimleri. Mach ayrı bir boyutta,
  KTAS ile kıyaslanmaz. Deniz milinin çarpanı tanım gereği tam 1852 m.
  `convertValue()` dönüşümü tek yerde dışa açar; boyutlar farklıysa hata atar.
- `lib/format.ts`: `0,9 Mach` ve `500 NM` basılır. `nm` SI'da nanometre simgesi
  olduğundan ICAO kısaltması `NM` kullanılır.
- `components/range-scale/RangeScale.tsx`: görev yarıçapını cetvele alır. Çubuk boyu
  kilometreye çevrilerek çizilir ama yazılan değer kaynağın yazdığı sayıdır. Altyazı
  cetvelde hangi alanlar varsa onların gerekçesini söyler.
- `scripts/validate-content.ts`: `nm` alanları da menzil beyanı sayılır. Halka kaydı
  olmayan dosya için uyarı verilir, hata değil.
- `components/scale-silhouette`: ölçek şemasının ekran okuyucu etiketi çizilen şeyi
  söyler. Model olmayan uçakta "dış hat" değil "kesikli ölçü zarfı" der. Yayındaki
  beş dosyanın hepsinde model olduğu için durum ilk kez KIZILELMA'da görünür oldu.
- `content/systems/kizilelma.json`: ürün sayfasının on bir beyanı, güç sistemi,
  haberleşme, varyant adları; kaynaklı takvim ve durum.
- `docs/research/kizilelma-sources.md`: REA gözlemi, kaynaklar, yayın kararları ve
  karelerden ilk okumalar.
- `content/assets.json`: KeyShotXR kareleri için referans kaydı (`presence: absent`).

Yayındaki beş dosyanın sayfası değişmiyor. Yeni alanların hiçbiri onlarda dolu değil.
Cetvelin değer etiketi artık `withUnit()` ile basılıyor; kilometre alanlarında çıktı
aynı (`6.000 km`).

## Capabilities

### New Capabilities

Yok.

### Modified Capabilities

- `range-envelope`: "Halka yalnız yarıçap iddiası taşıyan alandan çizilir" gereksinimi
  iki senaryo alır. Görev profili yazılmamış görev yarıçapı halka olarak çizilmez,
  cetvelde gösterilir ve sebebi yazılır. Cetvel değeri kaynağın biriminde basar.

## Non-goals

- **3B/2B model.** İkinci PR'da, ayrı değişiklik olarak. Gövde kesiti boyunca
  değişiyor: köşeli (chine) elmas burun, hava alıklı geniş orta gövde, yuvarlak lüle.
  Bugün `LatheSpec.section` tek bir profil taşıyor ve bu istasyon başına profil
  ister. Model gelene kadar sayfa modeli açmaz.
- Mühimmat listesi, faydalı yük (İGK) listesi, hedef sınıfları (§5.2, §5.3). Ürün
  sayfasında var, TB2 ve AKINCI'daki gibi alınmaz.
- Uçak gemisi kabiliyeti özellik olarak yazılmaz. Sayfa onu "Gelişmiş Özellikler"
  altında sayıyor, aynı sayfanın metni ise "çalışmalar sürdürülmektedir" diyor.
  Varyantın `_todo`'sunda kayıtlı.
- Ana sayfa işaretçisi (`hero`) bu değişiklikte taşınmaz. Editoryal bir karar,
  ayrıca verilir (§3).

## Impact

- §3 veri sözleşmesi (yeni ölçüm alanları, birim tablosu), §3 menzil halkasının alanı,
  §5.1 menzil zarfı, §5.7 uydurma yok, §5.8 yapısal veri (yeni alanlar
  `unitText: "Mach"` / `"NM"` ile çıkar; sayfada görünenle aynı).
- Paylaşım kartları ve harita etkilenmez. Halka çizilmediği için üretilmiş görsele
  harita girmez (§5.9).
