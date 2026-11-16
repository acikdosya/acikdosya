# Parametrik geometri — yapım ayrıntısı

İlkeler ve yasaklar kök CLAUDE.md §9'da (parametrik model, kesit yok, mühimmat
yok, oranların kökeni). Bu dosya kitin nasıl kurulduğunu anlatır.

## Parça kiti

Parça kiti altı ilkelden oluşur: `body`, `pod`, `panel`, `disc`, `strut`, `boom`.
Kit `three` içe aktarmaz; parçalar metre cinsinden saf biçim tanımıdır. İki tüketici
onu okur: `build3d.ts` sahneyi kurar, `project2d.ts` ortografik SVG üretir. **İki
boyutlu şema ile üç boyutlu model aynı listeden türediği için ayrışamazlar.**

Yeni bir ürün eklemek bir ürün tanımı dosyası ve `registry.ts` içinde bir satırdır.
Tip dalı açılmaz: "füze mi uçak mı" sorusu bu katmanda sorulmaz, bir ürün hangi
parçaları kuruyorsa odur. Çift kirişli, V kuyruklu ve çok yüzeyli düzenler aynı
kitle ifade edilir.

## Yüzeyler

Şematik olmak "kabaca" demek değildir. Yüzeyler düz plaka değil, veçheyle birlikte
incelen lofting yüzeylerdir; kesit yuvarlak hücum kenarı ve sivri firar kenarı taşır.
Belirli bir kanat profili İDDİA EDİLMEZ — düz plaka da hiçbir uçakta bulunmayan bir
biçimdir, yani "daha şematik" değil yalnızca daha yanlıştır.

Eşli yüzeyler (iki kanat, iki stabilize) DÖNDÜRÜLEREK değil merkez düzlemde
YANSITILARAK üretilir. Dönüş açıklığı doğru yöne taşır ama "yukarı" yönünü ters
çevirir; düz bir plakada görünmeyen bu hata, kanat ucu kıvrımı eklenince bir kanadı
aşağı baktırır.
