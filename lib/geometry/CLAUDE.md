# Parametrik geometri — yapım ayrıntısı

İlkeler ve yasaklar kök CLAUDE.md §9'da (parametrik model, kesit yok, mühimmat
yok, oranların kökeni). Bu dosya kitin nasıl kurulduğunu anlatır.

## Parça kiti

Parça kiti altı ilkelden oluşur: `body`, `pod`, `panel`, `disc`, `strut`, `boom`.
Kit `three` içe aktarmaz; parçalar metre cinsinden saf biçim tanımıdır. İki tüketici
onu okur: `build3d.ts` sahneyi kurar, `project2d.ts` ortografik SVG üretir. **İki
boyutlu şema ile üç boyutlu model aynı listeden türediği için ayrışamazlar.**

Yeni bir ürün eklemek bir ürün tanımı dosyası ve `registry.ts` içinde bir satırdır.
Kaynakta görünüp çizilmeyen dış parçalar ürün tanımının `omitted` listesine
yazılır; sayfa onları biçim kaydında gösterir (kök CLAUDE.md §9).
Tip dalı açılmaz: "füze mi uçak mı" sorusu bu katmanda sorulmaz, bir ürün hangi
parçaları kuruyorsa odur. Çift kirişli, V kuyruklu ve çok yüzeyli düzenler aynı
kitle ifade edilir.

## Yüzeyler

Şematik olmak "kabaca" demek değildir. Yüzeyler düz plaka değil, veçheyle birlikte
incelen lofting yüzeylerdir; kesit yuvarlak hücum kenarı ve sivri firar kenarı taşır.
Belirli bir kanat profili İDDİA EDİLMEZ — düz plaka da hiçbir uçakta bulunmayan bir
biçimdir, yani "daha şematik" değil yalnızca daha yanlıştır. Pervane kanadı da
`DiscPart.blade` verilince aynı kesitle loft edilir; halkalar `discBladeRings`
içinde tek yerde üretilir. Verilmezse kanat eski kutu biçiminde kalır.

Eşli yüzeyler (iki kanat, iki stabilize) DÖNDÜRÜLEREK değil merkez düzlemde
YANSITILARAK üretilir. Dönüş açıklığı doğru yöne taşır ama "yukarı" yönünü ters
çevirir; düz bir plakada görünmeyen bu hata, kanat ucu kıvrımı eklenince bir kanadı
aşağı baktırır.

## Gövde kesiti

Gövde tek profil (`LatheSpec.section`) ya da istasyon başına anahtar kesit
(`LatheStation.section`) taşır; ikisi birlikte yazılamaz. Anahtar kesitler aynı
nokta sayısını taşır ve i. nokta hepsinde aynı kenarı gösterir; ara istasyonlar
nokta nokta doğrusal geçiştir. Yeniden örnekleme yapılmaz, köşe yuvarlanırdı.
Profil ve uzanım `stationSections` / `stationExtents` içinde tek yerde kurulur;
model, şema, sınır ve etiket çapası oradan okur. Anahtar kesitli gövdenin ön
görünüşü istasyon halkalarının dışbükey zarfıdır.
