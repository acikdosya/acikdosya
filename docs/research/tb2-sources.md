# Bayraktar TB2 kaynak ve model araştırması

**İnceleme tarihi:** 17 Kasım 2026  
**Üretim slug'ı:** `tb2`  
**REA Evidence:** `ev_5415bd1de06d0b29cee28019016cfb3ddb2b29080359b3f2b4574c0c96f49490`

## REA gözlemi

REA 6.7.0 CLI, sağlanan Chrome ile geçici ve headless bir tarayıcı profili çalıştırdı. Senaryo yalnızca ürün sayfasını açıp altı saniye bekledi; başka sayfaya gidilmedi, form doldurulmadı ve hesap kullanılmadı. Tarayıcı REA tarafından kapatıldı.

Kayıt `complete`: 184 olay tutuldu, olay kaybı veya ağ işlemi eksikliği bildirilmedi. Son DOM, erişilebilirlik ağacı, ekran görüntüsü ve URL alındı. Ağ içerikleri istenmedi; yalnızca istek/yanıt üstverisi ve adresleri gözlendi. Olay sırası sağlayıcının alım sırasıdır, istekler arasında neden-sonuç kanıtı değildir.

Gözlenen oynatıcı `KeyShotXR-Tech.js` kullanıyor ve şu klasörden 16 kare yüklüyor:

`https://cdn.baykartech.com/static/assets/libs/keyshotxr/img/bayraktar-tb2/0_0.png` … `0_15.png`

Kareler 1920×800 PNG. Bu akışta GLB, GLTF, USDZ, FBX veya OBJ bulunmadı. Sonuç: üreticinin etkileşimli gösterisi döndürülebilir bir görüntü dizisi; indirilebilir veya yeniden kullanılabilir bir 3B model değil. Projede hazır model kullanılmadı, parametrik dış geometri üretildi.

## Birincil kaynaklar

- [BAYKAR Bayraktar TB2 ürün sayfası](https://baykartech.com/tr/uav/bayraktar-tb2/) ve [İngilizce sürüm](https://baykartech.com/en/uav/bayraktar-tb2/): güncel ölçüler, performans beyanları, güç/haberleşme ve varyant adları.
- [BAYKAR TB2UAS broşürü](https://cdn.baykartech.com/media/upload/userFormUpload/sy7JH9hB9upCek920ObOU7SOc2ihH9gr.pdf): 2019 PDF üstverisi; SHA-256 `d1380e679c20c480ec3c73f722f706b3ddc332df30655e1712877a99bf6a4e0f`.
- [BAYKAR, 10 Aralık 2024](https://baykartech.com/tr/press/turkiyenin-ilk-milli-sihasi-bayraktar-tb2-1-milyon-ucus-saatini-asti/): 2014 envanter, 2019 uçuş rekoru ve 2024 bir milyon saat duyurusu.
- [Anadolu Ajansı yazısının BAYKAR sayfasındaki kopyası, 26 Şubat 2024](https://baykartech.com/tr/press/turkiyenin-sihalardaki-bayrak-tasiyicisi-bayraktar-tb2/): 2012 başlangıç ve 2014 ilk tam otomatik uçuş. Kurumun kendi bülteni olmadığı için `press`.

Ürün sayfasının iki dil sürümü bağımsız iki kaynak sayılmadı. Teknik tablo ve aynı sayfadaki banner farklı değerler verdiğinde ikisi de `official` kaldı ve ayrı `context_note` ile kaydedildi.

## Yayın kararları

| Konu | Güncel ürün sayfası | 2019 broşürü | Karar |
|---|---|---|---|
| Uzunluk | 6,4 m | 6,5 m | İki kayıt; modelde güncel 6,4 m birincil. |
| Kanat açıklığı | 12 m | 12 m | İki kaynak kaydı; aynı değer. |
| Yükseklik | 2,2 m | Yok | Ürün sayfası; konfigürasyon notuyla. |
| MTOW | 700 kg | 650 kg | İki üretici beyanı; varyant ataması yapılmadı. |
| Faydalı yük | 150 kg | 55 + 85 = 140 kg | İki kayıt. Broşür görselindeki toplam kullanıldı. |
| Havada kalış | Tabloda 18+, banner'da 20+ saat | >24 saat | Üç ayrı beyan; 27 saat 3 dakikalık rekor bunlara eklenmedi. |
| Servis/mutlak tavan | Tabloda 20.000, banner'da 22.000 ft | 25.000 ft | Üç ayrı beyan; uçuş rekoruyla birleştirilmedi. |
| Operasyonel irtifa | 16.000 ft | 18.000 ft | İki kayıt. |
| Seyir hızı | 90 KTAS | 70 knots | Broşür değeri KTAS alanına çevrilmedi; `_todo`. |
| Azami hız | 110 KTAS | 116 KTAS @ 16.000 ft | İki kayıt; irtifa bağlamı korundu. |
| Haberleşme | LOS ve BLOS | >150 km haberleşme menzili | Menzil halkası yok; haberleşme menzili operasyonel menzil sayılmadı. |

Broşürün OCR çıktısı ilk okumada faydalı yükü ve seyir birimini belirsizleştirdi. Sayfanın yerel çözünürlüklü görüntüsünde teknik tablo yeniden okundu: **55 + 85 = 140 kg** ve **70 knots**. OCR metni tek başına veri kaynağı yapılmadı.

TB2-A/B/C/D adları ürün sayfasında var, ancak varyantlara özgü ölçü tablosu yok. Genel TB2 kayıtları bu dört ada otomatik dağıtılmadı. TB2T-AI da mevcut adlarla birleştirilmedi.

## Parametrik model

Model `lib/geometry/tb2.ts` içinde, mevcut parça kitinden üretilir. 17 Kasım 2026'da KeyShotXR kareleri piksel düzeyinde yeniden okundu ve dış profil baştan türetildi.

### Okuma düzeni

- Kareler 1920×800, saydam zemin; siluet doğrudan alfa kanalından alındı.
- Ölçek: yan görünüşte (0_4) burun ucundan kiriş ucuna 947 px, ön görünüşte (0_8) kanat açıklığı 1798 px. Ön görünüşte yükseklik 329 px; açıklık ölçeğiyle 2,196 m, yayımlanan 2,2 m ile uyumlu.
- Zıt yönlerden alınan kare çiftleri birbirinin aynası: ön↔arka %0,39, 45° çiftleri %0,2–0,3 piksel farkla. Perspektif kamerada yakın ve uzak parçalar farklı büyüklükte çıkacağı için bu, gösterinin ortografik ve yatay kamerayla çekildiğini gösteriyor. Aynı gösterinin kareleri olduğu için §9'daki izdüşüm sınavı yerine geçirilmedi; oranlar `reading` kaldı. Karar sahibinde.
- Kayıtta yaklaşık 0,26° yatış var: ön görünüşte sağ kanat ucu 8 px yukarıda, fark açıklıkla doğrusal büyüyor. Dihedral iki yanın ortalamasından okundu.
- Burun ucundaki ince prob (~0,4 m) modellenmedi; sayfada biçim kaydının başında yazılı (`TB2.omitted`, §9). Prob hariç uzunluk 947 px, dahil 1009 px; açıklık ölçeğiyle 6,32 ve 6,73 m. Yayımlanan iki uzunluğa (6,4 ve 6,5 m) prob hariç ölçü daha yakın.

### Önceki sürümden düzeltilenler

| Konu | Önceki | Karelerden |
|---|---|---|
| Gövde boyu | Uzunluğun tamamı, pervane kuyrukta | %60'ta küt biter, arkasında 0,37 m göbek konisi; kuyruğu kirişler taşır |
| Gövde eni / derinliği | 1,09 m / ~1,0 m | ~0,61 m / 0,80 m; sarkık burun, düz taban |
| Kanat kök / uç veçhesi | 1,20 / 0,98 m | ~0,86 / ~0,52 m, hücum kenarında ~4° ok |
| Kanat konumu | Gövde üstünde, "yüksek kanat" | Veçhe düzlemi orta çizginin altında; etiket "Kanat" oldu |
| Dihedral | 2,2° | 4,9° |
| Kiriş | Yassı (0,72), yatay, %42 → %97 | Dik oval, kuyruğa doğru yükselir, hücum kenarından en arka noktaya |
| Kuyruk | Kök veçhesi 1,02 m, 12° ok, %82 | 0,81 m, ~3° ok, %86; iki yüzey tepede birleşir |
| Pervane | Ø1,34 m, kuyrukta, kutu kanat | Ø~1,64 m, göbek konisinde (%61,7); düz firar kenarlı, uca incelen, 19° açılı kanat |
| Taret | r 0,32 m, %37 | r ~0,2 m, %25 |
| Ana takım | %55, ±0,84 m | %45, ±0,78 m |

Pervane kanadı arka (0_0) ve ön (0_8) görünüşte gövdenin dışında kalan kısmından, 256 sütunda okundu: en geniş veçhe ~0,14 m, firar kenarı düz, hücum kenarı yarıçapın %46'sından sonra 2,2 üssüyle geri çekiliyor, uç en geniş veçhenin %43'ü ve kesik (karekök ortalama sapma 0,65 px). Yan karelerde (0_4, 0_12) yakın kanat uçtan görünüyor; kesit dikeyden 23° ve 16° eğik, ortalama 19°, hücum kenarı buruna dönük. Kesit ince bir çizgi olduğu için burulma çizilmedi. Aynı okuma pervane düzlemini koninin ucundan (%64,3) kesitin geçtiği yere (%61,7) taşıdı.

Gövde ile göbek konisi ayrı okundu. Yan karelerde gri gövdenin üst çizgisi sona kadar neredeyse düz (362 → 364 px) ve 837 px sütununda (3,84 m, %60) küt bitiyor; arkasında beyaz koni 783 px'e (4,21 m) uzanıyor. Önceki okuma koniyi gövdenin daralması sayıp gövdeyi göbek yarıçapına inerek %63,9'da bitiriyordu. Uç yüzeyi arka görünüşte koninin çevresinde koyu bir halka: tepe 364,5 px, yanlar ±30 px, alt kenar ~425 px (yan görünüşte kirişin arkasında kalıyor; açıkta kalan alt çizgi uzatılarak doğrulandı). Koni gövde sonundan 0,15 m yarıçapla çıkan bir paraboloit: r = R·√(1 − s^1,05), iki yan karede 108 sütunda sapma en çok 1 px. Gövde ile koni arasındaki 2–3 px'lik oluk çizilmedi. Kanat kalınlığı seçildi; kesit yüzeylerdeki genel kesit, belirli bir profil iddiası yok.

Kiriş kanat hücum kenarında küt bitmiyor: ön ucu sivrilerek kanada karışıyor (0_5, 0_6). Uç hücum kenarında; incelmenin başladığı yer gölge sınırı, siluet değil, bu yüzden kaplama boyu (~0,32 m) seçildi. Kaplama kirişin ilk kesitine teğet bir parabol; kiriş çizgisi, yarıçapı ve eğimi değişmedi.

Sırt kaplaması, hava girişi ve egzoz diskleri kaldırıldı: karelerde bunlar dışa taşan biçim değil, gövdedeki açıklıklar; şematik gri yüzeyde gösterilemezler. Yerine karelerde görülen iki dış biçim eklendi: kanadın alt yüzeyini gövde tabanına bağlayan V kaplama ve burun altındaki yassı kaplama.

Kanat ucu kesik: karelerde veçhe uca kadar korunuyor. AKINCI'dan gelen kapanma kuralı (son %7'de veçhe ve kalınlık sıfıra) TB2'de ucu sivriltiyordu ve 45° karelerinde uç 24 px içeride kalıyordu; kaldırıldı, uç artık karelerdeki ucun 1–2 px yakınında. Kanat tek yüzey: ayrı aileron şeridi ve çizim boşluğu kaldırıldı, karelerde yalnız panel çizgisi var. Kanat altındaki dört yük istasyonu çizilmiyor: karelerde mühimmat yüklü ve mühimmat modellenmediği için istasyon da çizilmedi; sayfada biçim kaydında yazılı.

Ters V kuyruk karelerde tek parça: iki yüzey tepede keskine yakın bir sırtla birleşiyor (arka görünüşte tepe satırı 6 px). Önceki sürümde iki eğik levhanın uçları merkezi yarım kalınlık geçip çapraz kesişiyordu. Yarılar artık yatay açıklıklı, kesitleri dikey; son kesitleri merkez düzleminde birebir aynı, gönye ile birleşiyor. Tepenin dış çizgisi okunan 234 px'te kaldı. Bedeli: dikey kök kesiti kirişin altına eskisinden ~5 cm fazla sarkıyor (yan görünüş 0,917 → 0,912). Karelerde kuyruk kiriş ucundaki dikey bir çıkıntıya oturuyor; o çıkıntı çizilmedi.

Doğrulama sabit kamerayla yapıldı: model, karelerdeki ortografik kameraya yerleştirme uydurulmadan izdüşürüldü ve siluet örtüşmesi ölçüldü. Dokuz karede ortalama örtüşme 0,39'dan 0,83'e çıktı (yan görünüş 0,50 → 0,91, ön görünüş 0,19 → 0,77). Pilonlar kaldırılınca ortalama 0,839'dan 0,834'e indi: karelerde pilonlar ve yükler var. Karelerdeki dış yükler modellenmediği için tam örtüşme beklenmez. Okuma ölçeği, ara ölçümler ve araç betikleri depoya alınmadı.

### Kit değişiklikleri

- `LatheStation.lift`: kesit merkezinin istasyon başına dikey kayması. Sarkık burun ve göbeğin çevresinde biten arka gövde bununla ifade edilir.
- `BoomPart.endLift`: kirişin kuyruğa doğru yükselmesi; kesitler gövde eksenine dik kalır.
- `WingStationSpec.closeTip`: ucu başka bir yüzeye birleşen yüzey kapanmaz; ters V'nin iki yüzeyi tepede çentiksiz birleşir.
- `DiscPart.bladePhaseDeg`: pervane karelerdeki park duruşunda, yatay çizilir. Biçim değil, duruş.
- `DiscPart.blade`: pervane kanadı kutu değil, yüzeylerle aynı genel kesitle loft edilir (istasyon başına veçhe, kanat açısı). Halkalar `discBladeRings` içinde tek yerde üretilir; model, şema ve sınır kutusu aynı noktaları okur. Verilmeyen üründe (AKINCI) kanat eskisi gibi kutu.
- İki boyutlu izdüşüm artık istasyonun üst/alt çarpanını, kaymayı, kiriş daralmasını ve en/boy oranını da taşıyor; önceden yok sayılıyordu ve şema modelden ayrışıyordu.
- Ölçü çizgisi ve kadraj uzunluğu gövdenin değil parçaların eksen boyu uzanımından alınır. Diğer ürünlerde ikisi aynı; TB2'de gövde pervanede bittiği için ayrışıyordu.

Taşınan mühimmat modellenmez. Kesit, iç sistem, güdüm veya üretim ayrıntısı yok. Kaynak karelerde görünen mühimmatlar modele aktarılmadı.

Kaynak görseller geçici araştırma alanında incelendi ve ürün deposuna eklenmedi. `content/assets.json` içinde kod ve referans kayıtları ayrıdır; üretici görseli yeniden yayımlanmaz.
