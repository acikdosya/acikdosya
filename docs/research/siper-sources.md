# SİPER kaynak araştırması

**Durum:** tamamlandı — `content/systems/siper.json` yazıldı; şema, kıyas ekseni, köken kaydı ve halka seçimi değişiklikleri uygulandı.
**Son güncelleme:** 2026-09-12
**Araştırmacı:** Açık Dosya
**Dosya kapsamı:** SİPER ailesi. Aynı ad hem sistemi hem füze ürünlerini anlatıyor; bu dosyada ikisi ayrı nesne olarak tutulur. Kanister, atıcı araç, radar ve komuta unsurları sistemin parçasıdır ama kendi ölçüleriyle ayrı kayıtlardır.

## Kurallar

- Her sayı bir kaynakla gelir. Kaynak yoksa alan boş kalır; tahmin veya "biliniyor ki" ile doldurulmaz.
- Aynı kaynaktan türeyen haberler bağımsız teyit sayılmaz. Köken ile tekrar `origins` kaydında ayrılır.
- Füze menzili ile sistem önleme menzili aynı alana yazılmaz. Ayrım `object` ekseniyle taşınır.
- Hedef tipi listesi, hedef şehir/ülke, iç yapı, harp başlığı ve çatışma görseli bu dosyaya alınmaz (`CLAUDE.md` §5).
- Broşürlerdeki "+" işareti, eşitliği dışladığı belgelenmediği için ihtiyatlı biçimde `≥` kodlandı. Basındaki açık "aştı/geçti" ifadesi `>` olarak korundu.
- `stated_at` yalnızca açıklama günü biliniyorsa yazıldı. PDF adresindeki yıl ve dosya adı tarih kanıtı sayılmadı.

## Nesne sınırı

Rapor bu ayrımı birinci maddesinde uyarıyor ve dosya onu izliyor.

| Nesne | Hangi alanlar | Kaynak |
|---|---|---|
| Füze | uzunluk, çap, menzil | ROKETSAN ürün broşürü |
| Sistem | önleme menzili, önleme irtifası, yanca kapsama, izleme / angajman / güdülebilen füze kapasitesi | ASELSAN ürün broşürü |
| Atıcı | füze taşıma kapasitesi | ASELSAN ürün broşürü |
| Kanister | üç boyut — **alınmadı**, bkz. açık sorular | ROKETSAN ürün broşürü |

Aynı `range_km` alanında hem füzenin hem sistemin kaydı var; `object` ekseni ikisini ayırıyor ve kıyas hesabı onları birbirine karşı çalıştırmıyor. Sonuç `farkli-kapsam`, çelişki değil.

## Kaynak matrisi

| Alan | Değer/Operatör | Nesne | Kaynak | Confidence | Scope | Varyant | Durum |
|---|---|---|---|---|---|---|---|
| Uzunluk | 5,4 m | füze | ROKETSAN ürün broşürü | `official` | `beyan` | Ürün-1 | Net |
| Çap | 370 mm | füze | ROKETSAN ürün broşürü | `official` | `beyan` | Ürün-1 | Net |
| Menzil | ≥ 100 km | füze | ROKETSAN ürün broşürü | `official` | `beyan` | Ürün-1 | Broşürde "100+ km" |
| Menzil | > 100 km | füze | Anadolu Ajansı, 30.12.2022 | `press` | `test` | Ürün-1 | Köken: aynı günkü paylaşım; bu taramada altı yayıncı |
| Menzil | > 100 km | füze | SavunmaSanayiST, 22.11.2022 | `press` | `test` | Ürün-1 | **Açık**: yıl sonu duyurusuyla aynı atış mı, ayrı mı? |
| Menzil | 70–100 km | füze | DefenceTurk / Mehmet Ali Kula, 12.11.2023 | `estimate` | `tahmin` | Ürün-1 | Açıkça tahmin diye yayımlanmış |
| Menzil | 100 km | sistem | MSB, TBMM Plan ve Bütçe Komisyonu | `official` | `beyan` | Ürün-1 | Katalog eşiğiyle aynı ölçüm değil |
| Sistem önleme menzili | ≥ 70 km | sistem | ASELSAN ürün broşürü | `official` | `beyan` | Ürün-1 | Broşürde "70+ km" |
| Önleme irtifası | 20 km | sistem | ASELSAN ürün broşürü | `official` | `beyan` | Ürün-1 | |
| Uzunluk | 6,3 m | füze | ROKETSAN ürün broşürü | `official` | `beyan` | Ürün-2 | Net |
| Çap | 420 mm | füze | ROKETSAN ürün broşürü | `official` | `beyan` | Ürün-2 | Net |
| Menzil | 150 km | füze | ROKETSAN ürün broşürü | `official` | `beyan` | Ürün-2 | Aralık yok |
| Menzil | 120–140 km | füze | DefenceTurk / Mehmet Ali Kula, 12.11.2023 | `estimate` | `tahmin` | Ürün-2 | Sonraki beyanla uyuşmuyor; silinmedi, resmî de yapılmadı |
| Menzil | 150 km | sistem | DefenceTurk, 26.11.2024 | `press` | `beyan` | Ürün-2 | Bakanın komisyon konuşması aktarımı |
| Sistem önleme menzili | ≥ 150 km | sistem | ASELSAN ürün broşürü | `official` | `beyan` | Ürün-2 | Broşürde "150+ km" |
| Önleme irtifası | 30 km | sistem | ASELSAN ürün broşürü | `official` | `beyan` | Ürün-2 | |
| Yanca kapsama | 360° | sistem | ASELSAN ürün broşürü | `official` | `beyan` | her iki ürün | |
| İzleme kapasitesi | 100 | sistem | ASELSAN ürün broşürü | `official` | `beyan` | her iki ürün | Donanım adedi veya teşkilat türetilmedi |
| Angajman kapasitesi | 10 | sistem | ASELSAN ürün broşürü | `official` | `beyan` | her iki ürün | |
| Güdülebilen füze kapasitesi | 20 | sistem | ASELSAN ürün broşürü | `official` | `beyan` | her iki ürün | |
| Atıcı taşıma kapasitesi | 6 | atıcı | ASELSAN ürün broşürü | `official` | `beyan` | her iki ürün | |
| Menzil | 180 km | sistem | DefenceTurk, 26.11.2024 | `press` | `beyan` | Ürün-3 | Gelecek zamanlı program hedefi |
| Menzil | ≥ 180 km | füze | DefenceTurk / Mehmet Ali Kula, 12.11.2023 | `estimate` | `tahmin` | Ürün-3 | Bağımsız yazar tahmini |
| Durum | `seri-uretim` | — | MSB imza töreni; ASELSAN faaliyet raporu | `official` | `beyan` | — | **Açık**: Ürün-1 envanterde, aile düzeyi durum tek değer taşıyor |

## Köken ile tekrarın ayrıldığı yerler

İki köken kaydı yazıldı. Sayı listeden türüyor; kayıtta ayrı bir sayaç yok.

**Test sayısının çoğalması.** 30 Aralık 2022'de bir paylaşım Ürün-1 testinde 100 km'nin aşıldığını duyurdu. Bu taramada altı yayıncı aynı açıklamayı aktarıyor: Anadolu Ajansı, TRT Haber, SavunmaTR, DonanımHaber, Hürriyet, Ekonomim. Özgün paylaşımın metnine doğrudan erişilemedi, bu yüzden kaynak olarak Anadolu Ajansı gösteriliyor — ama o da altı tekrardan biri, kökenin kendisi değil. Kayıtta `accessed: false` bunu söylüyor.

Ayrıca 22 Kasım 2022 tarihli daha erken bir aktarım var ve aynı eşiği veriyor. Yıl sonu paylaşımı bu rakamın ilk ortaya çıkışı olarak sunulamaz; ikisinin aynı atışa mı ilişkin olduğu bilinmiyor.

**Tahminin kendi yayıncısında tekrarı.** 12 Kasım 2023 tarihli bağımsız değerlendirmedeki menzil aralıkları, aynı sitenin 23 Kasım 2023 tarihli yazısında yeniden yer alıyor. Bu bağımsız bir ikinci değerlendirme değil; kayıt bunu yayıncı adından türeterek işaretliyor ve sayfa iki durumu farklı çiziyor.

## Açık sorular

- **Kanister boyutları.** 6450 × 850 × 800 mm yayımlanmış, ama kaynak hangi boyutun uzunluk olduğunu söylemiyor. İlk sayıyı uzunluk alanına yazmak kaynağın söylemediğini iddia etmek olurdu. Eksen adları bulunana kadar alan boş.
- **Kütle ve hız.** İncelenen teknik tablolarda yok. Boyuttan hesaplanmadı.
- **ASELSAN broşürünün ±%10 toleransı.** Belge geneli bir not; `uncertainty` alanına yazılmadı. İki sebep: şema `uncertainty`'yi açık uçlu operatörle reddediyor, yani `≥ 70 ± %10` yazılamaz; ve `360° ± %10` anlamsız bir sonuç verir. Not `context_note` alanında, ASELSAN kaynaklı on sekiz kaydın her birinde duruyor.
- **Broşürlerin açıklanma günü.** ASELSAN belgesinin iç baskı kodu 05.2025; kesin gün bilinmiyor ve `stated_at` yazılmadı. ROKETSAN PDF adresindeki yıl tarih kanıtı sayılmadı.
- **Sözleşme tarihi farkı.** Ürün-1 seri üretim sözleşmesi için MSB'nin tören haberi 15 Aralık 2023, sonraki bir haber 1 Aralık 2023 diyor. Sözleşmenin aslı görülmedi; ikisi ayrı kayıt olarak korunmalı.
- **Radar model adları.** ALP 310-G ve PUSAT 1000-G tek bir basın kaydında geçiyor. Bunlar model kimlikleridir, performans değeri değil; her konfigürasyonun aynı radarlarla donatıldığı sonucu çıkarılmadı.
- **SİPER-A ve SİPER-4.** Tören konuşmasının basın aktarımında duyurulmuş adlar. Üretici teknik kartı bulunamadı; ayrı varyant açılmadı, ad kaydı olarak Ürün-3'ün altında duruyor.
- **"Blok-0" kullanımı.** Eski haberlerdeki bu ad, üreticinin sonraki Ürün/Block eşlemesine otomatik bağlanmadı. Kesin resmî eşleme belgesi elde edilemedi.

## Görsel ve lisans

SİPER'e ait, dosya bazında açık lisansı doğrulanabilen fotoğraf bu taramada bulunamadı. Dört kayıt `content/assets.json` içindeki `rejected` dizisine düştü: iki üretici PDF'i (bağlantı veriliyor, dosya alınmıyor), Wikimedia Commons kategorisi (kategori lisansı içindeki her dosyayı kapsamaz) ve bir haberdeki temsilî görsel.

Modelin ölçeği yayımlanmış uzunluk ve çaptan geliyor; biçimini belirleyen oranların hepsi **seçilmiş**. Ortografik olduğu bilinen bir kaynak görsel yok, yani izdüşüm sınavı yapılamıyor ve hiçbir oran `measured` sayılamaz. Atıcı araç, radar ve komuta unsurları modellenmedi — hiçbiri için ölçü kaydımız yok.
