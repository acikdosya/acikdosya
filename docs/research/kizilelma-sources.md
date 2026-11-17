# Bayraktar KIZILELMA kaynak ve model araştırması

**İnceleme tarihi:** 17 Kasım 2026  
**Üretim slug'ı:** `kizilelma`  
**REA Evidence:** `ev_d986cdcbf5fdcca9e3c5b06956b738996da8ae83ab24522256cb781ef905cea6`

Mühimmat listesi, faydalı yük (İGK) listesi, hedef sınıfları, güdüm ve iç sistem
ayrıntısı, atış testleri bu notun kapsamı dışında (`CLAUDE.md` §5.2, §5.3, §5.4).

## REA gözlemi

REA 6.7.0, sağlanan Chrome ile geçici bir tarayıcı profili açtı. Senaryo yalnız ürün
sayfasını açıp altı saniye bekledi; form doldurulmadı, hesap kullanılmadı. Kayıt
`complete`. Ağ içerikleri istenmedi, yalnız istek adresleri gözlendi.

Oynatıcı `KeyShotXR-Tech.js`; şu klasörden 18 kare yükleniyor:

`https://cdn.baykartech.com/static/assets/libs/keyshotxr/img/bayraktar-kizilelma/0_0.png` … `0_17.png`

GLB, GLTF, USDZ, FBX veya OBJ yok. Üreticinin gösterisi bir görüntü dizisi,
yeniden kullanılabilir bir 3B model değil.

Proje sahibinin elindeki 18 kare CDN'deki karelerle bayt düzeyinde aynı (0_0, 0_4, 0_9
sha256 karşılaştırması). Kareler depoya girmedi; referans kaydı `content/assets.json`
içinde (`kizilelma-turntable-refs`).

## Birincil kaynaklar

- [BAYKAR KIZILELMA ürün sayfası](https://baykartech.com/tr/uav/bayraktar-kizilelma/)
  ve [İngilizce sürüm](https://baykartech.com/en/uav/bayraktar-kizilelma/). İki dil
  sürümü bağımsız iki kaynak sayılmadı; değerler aynı.
- BAYKAR KIZILELMA broşürü, güncel sürüm:
  [TR](https://cdn.baykartech.com/media/upload/userFormUpload/Xfy33FcNkq6AvteUTaQZK5XzNx5FZCC0.pdf)
  SHA-256 `8bbd66637dc7f78995c8cf3020ab7a6f6d226613f9de7cdbcbf6c3ff9eb39b76`,
  [EN](https://cdn.baykartech.com/media/upload/userFormUpload/ZebsLh7KXVkG5r8RoxdRoz8rTrEkp5eR.pdf)
  SHA-256 `e4dc310c602307afbf10792da3105ac143957957ddef5084bd705eb10e447f90`.
  PDF üstverisi: oluşturma 7 Ağustos 2026. Metin katmanı yok; değerler sayfa
  görüntüsünden okundu.
- BAYKAR KIZILELMA broşürü, Şubat 2026 sürümü (CDN'de hâlâ erişilebilir):
  [TR](https://cdn.baykartech.com/media/upload/userFormUpload/qSPIXVS5hO9cw8cmXdshAqKWNeCCdGM0.pdf)
  SHA-256 `2c0c8d1316c0cc2b9fa1e92044b0aaf711c1969ad59bc9b6689e095c183ee9f3`,
  [EN](https://cdn.baykartech.com/media/upload/userFormUpload/2J3zB4L5xcfjVkf7OTLQo6jhfe8hL5l3.pdf)
  SHA-256 `f78204c2235778a79de1554cd4c749be8de3dfb1b4d80d658dfb2e555509a826`.
- Ürün sayfasının önceki sürümleri, Wayback Machine. Eski adresler
  `/tr/bayraktar-kizilelma-mius/` ve `/en/bayraktar-kizilelma-fighter-uav/` (Ekim
  2022 – Mart 2023 arası kayıtlı, sonra ana sayfaya yönleniyor).
- BAYKAR basın bültenleri (takvim, aşağıda) ve SSB haftalık özetleri. Anadolu
  Ajansı ya da İhlas Haber Ajansı yazısı BAYKAR sitesinde yayımlanmışsa `press`.

Kayıtlara giren her alıntı 17 Kasım 2026'da yeniden indirilen sayfada sınandı.

## Yayın kararları

| Alan | Güncel ürün sayfası | Diğer beyanlar | Karar |
|---|---|---|---|
| Uzunluk / açıklık / yükseklik | 14,5 / 10 / 3,5 m | Broşür aynı | İki kayıt. Ölçüler sayfada ilk kez Ağustos 2024'te görünüyor; başka değer bulunmadı. |
| MTOW | 8500 kg | Broşür "Tasarım MTOW 8.500 kg"; sayfa Ekim 2022 – Mart 2023 "6 Ton" | Üç kayıt. 6 t aynı dönemin bültenlerinde hedef olarak geçiyor; not kayıtta. |
| Faydalı yük | 1500 kg | Broşür aynı | İki kayıt. İHA aktarımındaki "1,5 kilogram" yazım hatası alınmadı. |
| Havada kalış | 3+ saat | 5 saat (2022–2024 başlık), 4-5 saat (Ağustos 2024 tablo), 4+ saat (2025 İngilizce başlık), broşür 3+ | Beş kayıt. Aralıklar örtüşüyor; tablo "farklı açıklama" der, "çelişki" demez. |
| Servis tavanı | 40.000 ft | Broşür "40.000+ ft"; sayfa Ağustos 2024 – Temmuz 2026 ve Şubat 2026 broşürü 45.000 ft | Dört kayıt. |
| Operasyonel irtifa | 25.000 ft | 35.000 ft (2022 – Mart 2023), 30.000 ft (Nisan 2023 – Ağustos 2024), broşür 25.000 | Dört kayıt. |
| Seyir / azami hız | 0,6 / 0,9 Mach | Broşür aynı; SSB 19 Ocak 2026 "0,8 mach hızına ulaştı" | Mach alanları; KTAS'a çevrilmedi. 0,8 Mach `scope: test`, beyanla kıyaslanmaz. |
| Görev yarıçapı | 500 nm | 2022'den beri aynı; broşürlerde yok | `combat_radius_nm`. Halka çizilmez: görev profili yazılmamış (`specs/range-envelope`). |
| Varyant adları | A, B, CA, CB, D | Sayfa Ağustos 2024 – Temmuz 2026 "Sübsonik, Transonik ve Süpersonik"; Şubat 2026 broşürü A, B, C, D | Özellik tek değer taşıyor; güncel liste yazıldı, geçmiş burada. |
| Uçak gemisi | "Gelişmiş Özellikler" altında sayılıyor | Aynı sayfanın metni "çalışmalar sürdürülmektedir" | Özellik olarak yazılmadı; `_todo`. |

**Arşiv kayıtları.** Eski sürümlerin değerleri `archive_url` ve `document_version`
(kayıt aralığı) ile girildi; `stated_at` yazılmadı. Wayback bir değerin hangi gün
sayfada durduğunu söyler, üreticinin onu hangi gün açıkladığını söylemez. Kayıtlar
seyrek; değişikliğin günü bilinmiyor.

**Ayrışmanın niteliği.** MTOW, servis tavanı ve operasyonel irtifadaki çelişkiler iki
kaynağın anlaşmazlığı değil, üreticinin kendi beyanını zamanla değiştirmesi. Kural
gereği görünür (`CLAUDE.md` §3: `stated_at` kıyas ekseni değil); daha yeni beyanın
eskisini geçersiz kılması henüz tasarlanmadı. KIZILELMA bu tasarımın ilk gerçek
örneği.

## Takvim

Takvime yalnız BAYKAR'ın kendi bültenleri (`official`) ve bir ajans yazısı (`press`)
girdi:

| Tarih | Olay | Kaynak |
|---|---|---|
| 20.07.2021 | Kavramsal tasarım kamuoyuyla paylaşıldı | BAYKAR, 12.03.2022 |
| 12.03.2022 | Ad duyuruldu, ilk prototip entegrasyon hattında | BAYKAR, 12.03.2022 |
| 17.09.2022 | İlk motor entegrasyon testi | BAYKAR, 19.09.2022 |
| 14.11.2022 | TC-ÖZB üretim hattından çıktı | BAYKAR, 14.12.2022 |
| 14.12.2022 | İlk uçuş, 14.59–15.17 | BAYKAR, 14.12.2022 |
| 24.04.2023 | AKINCI ile ilk kol uçuşu | BAYKAR, 06.06.2023 |
| 25.09.2024 | Üretim prototipi TC-ÖZB3'ün ilk uçuşu | BAYKAR, 26.09.2024 |
| 08.10.2025 | Seri üretime geçildiği açıklandı | BAYKAR, 08.10.2025 |
| 27.12.2025 | PT3 ve PT5 ile otonom yakın kol uçuşu | BAYKAR, 28.12.2025 |
| 09.05.2026 | Endonezya ile 12 uçaklık ilk ihracat anlaşması | Anadolu Ajansı (`press`); BAYKAR bülteni yok |

Takvime girmeyenler:

- **Atış testleri ve AESA radarlı ilk uçuş (§5.3, §5.4).** Radarlı ilk uçuş yalnız
  basında var (TurDef, FlightGlobal, 21 Ekim 2025); ASELSAN'ın kendi metni
  bulunamadı.
- **Seri üretim modeli S2'nin 8 Temmuz 2026 uçuşu.** Yalnız bir atış testi bülteninde
  geçiyor.
- **Bulunamayanlar:** PT-2 ve PT-5'in ilk uçuş tarihleri.
- **Endonezya'nın ek alım miktarı.** Janes (8 Mayıs 2026) bir BAYKAR sözcüsüne
  dayanarak anlaşmanın teslimatı ileride 48 uçağa çıkarma hükmü taşıdığını yazıyor.
  Aynı konuda farklı miktar veren Quwa yazısı bu ağdan okunamadı (HTTP 403).
  Anlaşmanın kendisi dışında yazılmadı.

## Durum

`seri-uretim`. BAYKAR, 8 Ekim 2025: "Test faaliyetleri sürerken seri üretim sürecine
de geçilen Bayraktar KIZILELMA'nın 2026 yılında envantere girmesi hedefleniyor."

Teslimat ya da envantere giriş için resmî beyan bulunamadı. BAYKAR bültenleri 13
Kasım 2026'ya, SSB haftalık özetleri 16 Kasım 2026'ya kadar tarandı. Anadolu Ajansı'nın
9 Mayıs 2026 yazısı aynı metinde iki şey söylüyor: Haluk Bayraktar'ın "ilk seri
teslimatları bu yıl yapmayı hedefliyoruz" sözü ve Baykar'ın anlaşmayı "testler ve ilk
yurt içi teslimatlar tamamlanana kadar" beklettiği. İkincisi teslimat olmuş gibi
okunuyor, birincisi henüz olmadığını söylüyor; takvime yazılmadı.

## Karelerden ilk okumalar

Model ikinci adımda. Bu okumalar onun başlangıç noktası; hiçbiri içeriğe sayı olarak
girmedi.

- **Kareler.** 1919×1199 RGBA, saydam zemin, 20° adım: 0_0 arka, 0_9 ön. Tam yan
  görünüş yok, en yakınları 0_4 (80°) ve 0_5 (100°).
- **Kamera.** Ön ve arka siluet birbirinin aynası (örtüşme 0,9998, 9 px): kamera
  ortografik ve yatay. Aynı gösterinin kareleri olduğu için §9'daki izdüşüm sınavı
  sayılmadı. k ile 18−k kare çiftleri ayna simetrik (0,989–0,995).
- **Dönme ekseni.** Ekseni gövde ortasından yana ~0,6 m kayık (ön ve arka görünüşte
  orta çizgi 897,5 ve 1020,5 px, görüntü merkezi 959 px). Okumada düzeltilecek.
- **Ölçek.** Kanat açıklığı 1014 px ≈ 10 m, yani 101,4 px/m.
- **Uzunluk.** 80° ve 100° karelerindeki burun ucundan 14,5–14,65 m çıkıyor; yayımlanan
  14,5 m ile uyumlu. Alt sınır, en arka noktanın orta çizgide olup olmadığına bağlı.
- **Yükseklik: 374–375 px, 3,69 m; yayımlanan 3,5 m (+%5,4).** Modelin dikey ölçüsü
  tablodaki değerle örtüşmeyecek; sebebi model sayfasında yazılacak (§9).
- **Planform.** Kamera hiç yukarıdan bakmıyor, kanat ve kanard planformu görünmüyor.
  Ok açısı birden çok azimuttan uç noktalarının üçgenlenmesiyle çıkarılacak.
- **Dış biçim.** Köşeli (chine) burun, burun altında iki yan hava alığı, alığın
  yanında alçak kanard, ince orta kanat, dışa yatık çift dikey kuyruk, tek yuvarlak
  lüle, üç tekerli iniş takımı. Karelerde dış yük yok.
- **Parça kiti.** Gövde kesiti boyunca değişiyor: elmas burun, alıklı geniş orta
  gövde, yuvarlak lüle. `LatheSpec.section` bugün tek profil taşıyor; istasyon başına
  profil gerekecek. Kanard, kanat, yatık kuyruk ve takım mevcut `panel`, `strut` ve
  `pod` ile ifade edilebilir.

Okuma betikleri ve ara ölçümler depoya alınmadı.
