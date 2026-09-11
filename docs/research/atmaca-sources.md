# ATMACA kaynak araştırması

**Durum:** tamamlandı — Aşama A, B, C, D ve E tamamlandı; `content/systems/atmaca.json` ve bağlı şema/geometri/etiket değişiklikleri uygulandı.  
**Son güncelleme:** 2026-09-11  
**Araştırmacı:** Açık Dosya  
**Dosya kapsamı:** ATMACA deniz konfigürasyonu. KARA ATMACA bu notun kapsamına girmez; kaynak ATMACA ailesi genelinde bilgi veriyorsa deniz konfigürasyonuna atanmadan önce ayrım kanıtı aranır.

## Kurallar

- Her sayı bir kaynakla gelir. Kaynak yoksa alan boş kalır; tahmin veya "biliniyor ki" ile doldurulmaz.
- Aynı kaynaktan türeyen haberler bağımsız teyit sayılmaz.
- PDF için SHA-256 hesaplanır; erişim tarihi ve kaynak URL kaydedilir.
- Üretici web sayfası ile bağlı PDF aynı gösterimi kullanmıyorsa otomatik olarak birleştirilmez; konfigürasyon eşleşmesi kanıtlanmalı.
- Hedef tipi listesi, hedef şehir/ülke, iç yapı, harp başlığı ve çatışma görseli bu dosyaya alınmaz (`CLAUDE.md` §5).

## Kaynak matrisi

| Alan | Değer/Operatör | Kaynak | Confidence | Scope | Varyant | Durum |
|---|---|---|---|---|---|---|
| Uzunluk | 4,3–5,2 m | ROKETSAN ATMACA ürün web sayfası (TR/EN), teknik tablo | `official` | `beyan` | belirsiz | **Açık**: aralık farklı platform entegrasyonlarını mı kapsıyor? |
| Uzunluk | 5,2 m | ROKETSAN ATMACA PDF kataloğu (TR/EN) | `official` | `beyan` | belirsiz | **Açık**: web aralığının üst sınırı mı, yoksa tek başına bir konfigürasyon mu? |
| Kütle | < 750 kg | ROKETSAN ATMACA ürün web sayfası (TR/EN) | `official` | `beyan` | belirsiz | **Açık**: PDF'deki 750 kg ile aynı konfigürasyon mu? |
| Kütle | 750 kg | ROKETSAN ATMACA PDF kataloğu (TR/EN) | `official` | `beyan` | belirsiz | **Açık**: web'deki < 750 ile çelişki mi, kapsam farkı mı? |
| Kütle | < 800 kg | Savunma Sanayi 2019, Naval News 2025, DefenceTurk 2022 | `press` | `beyan` | belirsiz | ROKETSAN kaynaklarından türemiş olabilir; bağımsız teyit değil. |
| Menzil | 250 km | ROKETSAN ATMACA ürün web sayfası / PDF | `official` | `beyan` | belirsiz | Net; aralık yok. |
| Menzil | > 200 km | Savunma Sanayi 2019 / 2020, İsmail Demir açıklaması | `official` | `test` | belirsiz | Test atışında kat edilen mesafe; beyan edilen menzille aynı şeyi ölçmez. |
| Menzil | > 220 km | Naval News 2021/2025, DefenceTurk 2022 | `press` | `beyan` | belirsiz | ROKETSAN kaynağına yakın ama farklı rakam; kökeni belirsiz. |
| Çap | 370 mm | ROKETSAN ATMACA PDF kataloğu (TR/EN) | `official` | `beyan` | belirsiz | Web tablosunda yok. |
| Harp başlığı ağırlığı | 220 kg | ROKETSAN ATMACA web sayfası / PDF, DefenceTurk 2022 | `official` | `beyan` | belirsiz | Basın kaynaklarında 250 kg da geçiyor; çelişki mi, farklı konfigürasyon mu? |
| Durum | `seri-uretim` | SSB-ROKETSAN sözleşmesi (2 Kasım 2018); ROKETSAN CEO'su Murat İkinci (Ağustos 2021); Naval News (Şubat 2021) | `official`/`press` | `beyan` | — | **Karar:** ilk dosyada `seri-uretim` kullanılacak. |
| Durum | `envanterde` | Naval News 2025 "2023'te envantere girdi" | `press` | `beyan` | — | Kaynak gösterilmedi; tek başına `status` kararı için yeterli değil. |

## 1. ROKETSAN ATMACA ürün web sayfası (Türkçe)

- **Yayıncı:** ROKETSAN A.Ş.
- **Başlık:** ATMACA Gemisavar Füzesi
- **URL:** https://www.roketsan.com.tr/tr/urunler/atmaca-gemisavar-fuzesi
- **Erişim tarihi:** 2026-09-11
- **Dil:** Türkçe
- **İncelenen alanlar:**
  - `length_m`: 4,3–5,2 m (teknik tablo)
  - `mass_kg`: < 750 kg (teknik tablo)
  - `range_km`: 250 km (teknik tablo)
  - `diameter_mm`: teknik taboda görülmedi
  - `warhead_weight_kg`: 220 kg (teknik tablo — şemada henüz yok)
  - Güdüm: ANS + KKS + Barometrik Altimetre + Radar Alimetre
- **Belge sürümü:** web sayfası; sürüm bilgisi sayfada belirgin değil.
- **Açık sorular:**
  - Uzunluk aralığı hangi konfigürasyonları kapsıyor? PDF'deki 5,2 m bu aralığın üst sınırı mı?
  - `< 750 kg` ile PDF'deki `750 kg` aynı konfigürasyon için mi?
  - Sayfadaki teknik tablo ile bağlı PDF neden farklı gösterimler kullanıyor?
- **Karar:** Değerler `official` + `beyan` olarak işaretlenecek; konfigürasyon belirsizliği çözülmeden PDF değerleriyle çelişki üretilmeyecek.

## 2. ROKETSAN ATMACA ürün web sayfası (İngilizce)

- **Yayıncı:** ROKETSAN A.Ş.
- **Başlık:** ATMACA Anti-Ship Missile
- **URL:** https://www.roketsan.com.tr/en/products/atmaca-anti-ship-missile
- **Erişim tarihi:** 2026-09-11
- **Dil:** İngilizce
- **İncelenen alanlar:**
  - `length_m`: 4.3 - 5.2 m
  - `mass_kg`: < 750 kg
  - `range_km`: 250 km
  - `diameter_mm`: teknik taboda görülmedi
  - `warhead_weight_kg`: 220 kg
  - Güdüm: INS + GPS + Barometric Altimeter + Radar Altimeter
- **Bağlı PDF:** https://www.roketsan.com.tr/uploads/docs/kataloglar/ENG/2024/1726595873_atmaca.pdf
- **Belge sürümü:** web sayfası; sürüm bilgisi sayfada belirgin değil.
- **Karar:** Türkçe sayfayla aynı gösterimi taşıyor; aynı kaynak grubunda değerlendirilir.

## 3. ROKETSAN ATMACA PDF kataloğu (Türkçe)

- **Yayıncı:** ROKETSAN A.Ş.
- **Başlık:** ATMACA Gemisavar Füzesi (sayfa başlığından)
- **URL:** https://www.roketsan.com.tr/uploads/docs/kataloglar/TR/2024/1726595374_atmaca.pdf
- **Erişim tarihi:** 2026-09-11
- **Dil:** Türkçe
- **İncelenen alanlar:**
  - `length_m`: 5,2 m
  - `mass_kg`: 750 kg
  - `range_km`: 250 km
  - `diameter_mm`: 370 mm
  - `warhead_weight_kg`: 220 kg
  - Güdüm: Radar arayıcı başlık, kızılötesi görüntüleyicili arayıcı başlık, ataletsel, karıştırmaya dayanıklı küresel konumlama sistemi, barometrik altimetre, radar altimetre
  - Platformlar: su üstü, denizaltı, muharip uçak, taktik tekerlekli kara platformları, sabit lançer
- **Belge sürümü:** URL'de `2024` klasörü ve `1726595374` damgası var; PDF metadata'sında CreationDate/ModDate yok; içerikte basım tarihi görülmedi.
- **SHA-256:** `c7163fec0439b99cce3d7b6bc6d44a634261c5a630e62397c3d6032c4270fbb4`
- **Arşiv URL'si:** _todo — Internet Archive / archive.today kopyası aranacak_
- **Açık sorular:**
  - PDF'deki tek uzunluk, web'deki aralığın üst sınırı mı? Yoksa farklı bir konfigürasyon mu?
  - `750 kg` ile `< 750 kg` matematiksel olarak ayrışır; aynı konfigürasyon için kaynaklar çelişiyor gibi görünür.
  - PDF'de geçen "kızılötesi görüntüleyicili arayıcı başlık" web sayfasında yok; bu ATMACA ailesi genelinde mi, deniz konfigürasyonunda mı?
  - Platform listesi ATMACA ailesini mi, yoksa tek bir konfigürasyonu mu tarif ediyor?
- **Karar:** Değerler `official` + `beyan` olarak işaretlenecek; web kaynağıyla karşılaştırma konfigürasyon ayrımına göre yapılacak.

## 4. ROKETSAN ATMACA PDF kataloğu (İngilizce)

- **Yayıncı:** ROKETSAN A.Ş.
- **Başlık:** ATMACA Anti-Ship Missile
- **URL:** https://www.roketsan.com.tr/uploads/docs/kataloglar/ENG/2024/1726595873_atmaca.pdf
- **Erişim tarihi:** 2026-09-11
- **Dil:** İngilizce
- **İncelenen alanlar:**
  - `length_m`: 5.2 m
  - `mass_kg`: 750 kg
  - `range_km`: 250 km
  - `diameter_mm`: 370 mm
  - `warhead_weight_kg`: 220 kg
  - Güdüm: Terminal guidance; Imaging Infrared Seeker + Radio Frequency Seeker; Mid-guidance; INS, anti-jam GNSS, barometric altimeter, radar altimeter
  - Platformlar: naval platforms, submarine platforms, 5th gen fighter jet, tactical wheeled land platforms, fixed launcher
- **Belge sürümü:** Türkçe PDF ile aynı görünüm; farklı zaman damgası (`1726595873`).
- **SHA-256:** `2c70cdd3335e11574c45b0604d5464807ec581f96e0e5265b0e10c44cc6c2680`
- **Arşiv URL'si:** _todo_
- **Karar:** Türkçe PDF ile aynı kaynak grubunda; İngilizce terminoloji çeviri için kullanılabilir, bağımsız bir kaynak değil.

## 5. Savunma Sanayi — TCG Kınalıada test atışı

- **Yayıncı:** savunmasanayi.org
- **Başlık:** TCG Kınalıada Atmaca'yla Vurdu
- **URL:** https://savunmasanayi.org/2019/11/04/kinaliada-atmaca-test/
- **Yayın tarihi:** 2019-11-04
- **Erişim tarihi:** 2026-09-11
- **Dil:** Türkçe
- **İncelenen alanlar:**
  - `length_m`: 4.800 – 5.200 mm (tablo)
  - `mass_kg`: < 800 kg (tablo)
  - `range_km`: > 200 km (tablo)
  - Güdüm: ANS+KKS+Barometrik Altimetre+Radar Altimetre
  - Harp başlığı: Yüksek Patlayıcılı Penetrasyon Etkili
  - Arayıcı: Aktif RF
- **Kaynak zinciri:** ROKETSAN-ASELSAN ortak üretimi; SSB Başkanı İsmail Demir'in Twitter paylaşımından alıntı.
- **Açık sorular:**
  - Tablodaki `< 800 kg` ROKETSAN'ın `< 750 kg` değerinden farklı. Bu farklı bir kaynaktan mı, yuvarlama/yazım hatası mı?
  - `> 200 km` menzil değeri ROKETSAN'ın `250 km` değerinden farklı.
- **Karar:** Haberdeki tablo muhtemelen ROKETSAN'ın eski/güncellenmemiş bir ürün kartından türemiş; bağımsız kaynak değil. Tarihli açıklama (`stated_at: 2019-11-04`) ve test bağlamı ayrıca değerlendirilebilir. `confidence: press` olarak kaydedilebilir; ROKETSAN `official` değerleriyle karşılaştırma kapsam farkı üzerinden yapılacak.

## 6. Savunma Sanayi — 200 km test atışı

- **Yayıncı:** savunmasanayi.org
- **Başlık:** ROKETSAN'IN ATMACA'SI 200 KM ÖTEDEKİ HEDEFİ TAM ON İKİDEN VURDU
- **URL:** https://savunmasanayi.org/2020/07/04/roketsanin-atmacasi-200-km-otedeki-hedefi-tam-on-ikiden-imha-etti/
- **Yayın tarihi:** 2020-07-04
- **Erişim tarihi:** 2026-09-11
- **Dil:** Türkçe
- **İncelenen alanlar:**
  - Test tarihi: 2020-07-01
  - Menzil: 200 km+
  - Sözleşme: ROKETSAN-SSB seri üretim sözleşmesi, 2018-11-02
  - İsmail Demir açıklaması: "ATMACA seyir füzemiz envantere girmeye hazırlanıyor"
  - Ayrıca: "Harp başlığı ağırlığı 250 kilogram, toplam ağırlığı ise 800 kilogramın altında" — yazar metni, doğrudan alıntı değil.
- **Karar:** `range_km` test atışı kaydı olarak eklenebilir (`scope: test`, `confidence: official` çünkü SSB Başkanı açıklaması). 250 kg harp başlığı ifadesi doğrudan alıntı olmadığı için ayrı bir kaynak olarak değerlendirilemez.

## 7. Daily Sabah — 200 km test atışı / program geçmişi

- **Yayıncı:** Daily Sabah
- **Başlık:** Turkey's 1st maritime missile Atmaca successfully passes latest test
- **URL:** https://www.dailysabah.com/business/defense/turkeys-1st-maritime-missile-atmaca-successfully-passes-latest-test
- **Yayın tarihi:** 2020-07-05
- **Erişim tarihi:** 2026-09-11
- **Dil:** İngilizce
- **İncelenen alanlar:**
  - İsmail Demir açıklaması: "200 km+ hedefi vurdu, envantere girmeye hazır"
  - Geliştirme: 2009'da başladı
  - Testler: Kasım 2018'de tamamlandı
  - Sözleşme: SSB ve Roketsan arasında 2018'de seri üretim anlaşması
  - Menzil: up to 250 km
  - Launch control systems: ASELSAN
  - Fire control system: Turkish Naval Research Center Command (ArMerKom)
  - IDEF'19'da tanıtıldı
- **Karar:** Program takvimi için kullanılabilir kaynak. `range_km` test kaydı olarak değerlendirilebilir. 2009 başlangıcı ve 2018 seri üretim sözleşmesi `timeline` için eklenebilir.

## 8. Naval News — IOC testleri (Şubat 2021)

- **Yayıncı:** Naval News
- **Başlık:** Video: Turkey's New ATMACA Missile Aces Latest Tests, Achieves IOC
- **URL:** https://www.navalnews.com/naval-news/2021/02/video-turkeys-new-atmaca-missile-aces-latest-tests-achieves-ioc
- **Yayın tarihi:** 2021-02-05
- **Erişim tarihi:** 2026-09-11
- **Dil:** İngilizce
- **İncelenen alanlar:**
  - Test tarihleri: 3 Şubat 2021 (telemetry, harp başlığı olmadan), 4 Şubat 2021 (live warhead)
  - Platform: TCG Kınalıada
  - Sonuç: IOC (Initial Operational Capability) achieved
  - Seri üretim sözleşmesi: SSB-ROKETSAN, 2 Kasım 2018
  - ROKETSAN'a göre: subsonic, sea-skimming, range over 220 km, 250kg-class warhead
  - Gelecek geliştirmeler: yerli turbojet motor, IIR seeker, hybrid guidance
- **Karar:** `timeline` için önemli kaynak: IOC 2021 Şubat. `status: seri-uretim` için destekleyici kaynak. Teknik veri kutusundaki `> 220 km` ve `250 kg-class` ROKETSAN resmî değerlerinden farklı; `press`/`beyan` olarak ayrıca not edilecek.

## 9. ROKETSAN — IDEF'21 basın toplantısı

- **Yayıncı:** ROKETSAN A.Ş.
- **Başlık:** Turkey's Rocket and Missile Center Roketsan is Ready for IDEF'21 with New Products
- **URL:** https://www.roketsan.com.tr/en/media/news/turkeys-rocket-and-missile-center-roketsan-ready-idef21-new-products
- **Yayın tarihi:** 2021-08-17
- **Erişim tarihi:** 2026-09-11
- **Dil:** İngilizce
- **İncelenen alanlar:**
  - ROKETSAN CEO Murat İkinci: "2021'in ilk yarısında ATMACA Anti-Ship Guided Missile son test atışını başarıyla tamamladı ve seri üretime başladık"
  - KARA ATMACA IDEF'21'de ilk kez sergilenecek
  - KARA ATMACA: surface-to-surface cruise missile, IIR seeker (deniz versiyonundan farklı)
- **Karar:** `status: seri-uretim` için güçlü `official` kaynak. KARA ATMACA ayrımı için resmî kaynak.

## 10. Naval News — Denizaltıdan atılan ATMACA testi

- **Yayıncı:** Naval News
- **Başlık:** Turkish Navy test-fires submarine-launched version of Atmaca missile for the first time
- **URL:** https://www.navalnews.com/naval-news/2025/03/turkish-navy-test-fires-submarine-launched-version-of-atmaca-missile-for-the-first-time
- **Yayın tarihi:** 2025-03-13
- **Erişim tarihi:** 2026-09-11
- **Dil:** İngilizce
- **İncelenen alanlar:**
  - Test tarihi: 2025-03-12
  - Platform: TCG Preveze (S-353) denizaltısı
  - Versiyon: Sub-Atmaca / encapsulated submarine-launched
  - ATMACA 2023'te envantere girdi (yazar iddiası, kaynak gösterilmedi)
  - Teknik veri kutusu:
    - Length: 4,800 – 5,200 mm
    - Weight: < 800 kg
    - Range: > 220 km
    - Warhead Weight: 250 kg
    - Seeker: Active RF (ship-launched), IIR (land-launched)
- **Açık sorular:**
  - 2023 envantere giriş iddiasının kaynağı nedir?
  - Teknik veri kutusundaki `250 kg` harp başlığı ve `< 800 kg` ağırlık ROKETSAN'ın resmî değerlerinden farklı; bu değerlerin kökeni belirsiz.
- **Karar:** Test atışı `press` kaynağı olarak zaman çizelgesine eklenebilir. Teknik veri kutusu bağımsız doğrulanamadığı için `press`/`beyan` veya ayrıca not edilecek.

## 11. DefenceTurk — Kara konuşlu ATMACA test atışı

- **Yayıncı:** DefenceTurk
- **Başlık:** Kara konuşlu ATMACA gemisavar füzesinin test atışı yapıldı
- **URL:** https://www.defenceturk.net/kara-konuslu-atmaca-gemisavar-fuzesinin-test-atisi-yapildi
- **Yayın tarihi:** 2022-07-02
- **Erişim tarihi:** 2026-09-11
- **Dil:** Türkçe
- **İncelenen alanlar:**
  - Test tarihi: 2022-07-02
  - MSB duyurusu: Kara konuşlu ATMACA Karadeniz'de denizdeki hedefe ateşlendi
  - Fırlatma sistemi: 8×8 araç, 4 adet ATMACA
  - KARA ATMACA ayrımı: RF yerine IIR arayıcı, farklı harp başlığı/menzil/ağırlık
  - Teknik özellikler tablosu:
    - Uzunluk: 4,3 m – 5,2 m
    - Ağırlık: < 750 kg
    - Menzil: > 220 km
    - Harp Başlığı Ağırlığı: 220 kg
- **Karar:** KARA ATMACA kapsam dışı; kara konuşlu test atışı ATMACA ailesi için `press`/`test` zaman çizelgesi kaydı olarak değerlendirilebilir. Teknik tablo ROKETSAN kaynaklarına yakın.

## Kararlar ve uygulama durumu

1. **Kategori:** `seyir-fuzesi` — `lib/schema.ts` enumuna eklendi, `content/systems/atmaca.json`da kullanıldı.
2. **Aralık desteği:** `Measurement.upper_value` + `upper_operator` — `lib/schema.ts` ve `lib/measurement/divergence.ts`'e eklendi; `formatValue` aralık gösterimini destekliyor. ROKETSAN web sayfasındaki `4,3–5,2 m` tek kayıtta tutuldu.
3. **Konfigürasyon belirsizliği:** Ek `comparison_context` alanı açılmadı; çelişki/farklı açıklama durumu mevcut `scope` + operatör + `upper_value` mekanizmasıyla görünür hale geliyor. Web/PDF arasındaki uzunluk ve kütle farklılıkları açık kayıtta `_todo` olarak bırakıldı.
4. **Model seçimi:** `lib/geometry/selection.ts` oluşturuldu; sistem slug'ına göre profil seçiyor.
5. **ATMACA dış biçimi:** `lib/geometry/atmaca.ts` + `lib/geometry/model.ts` oluşturuldu; `lib/geometry/missile.ts` korundu. `components/model-viewer/MissileViewer.tsx` ve `scripts/bake-glb.mjs` yeni `buildModel` çağrısına geçirildi.
6. **Durum:** `content/systems/atmaca.json`da `status: seri-uretim` olarak kaydedildi. Kaynaklar: SSB-ROKETSAN seri üretim sözleşmesi (2 Kasım 2018), ROKETSAN CEO Murat İkinci (Ağustos 2021) ve Naval News IOC haberi (Şubat 2021). `envanterde` için kesin tarihli resmî kaynak bulunamadı; 2021 envantere giriş iddiası (TRT World/AA) `press` kaynaklı ve tek başına `status` kararı için yeterli görülmedi.
7. **Harp başlığı ağırlığı / güdüm / platformlar:** `warhead_weight_kg` `lib/schema.ts` `specKeys` dizisine eklendi; `content/systems/atmaca.json`da 220 kg (resmî) ve 250 kg (basın) kaydedildi. `attributes.guidance` ve `attributes.propellant` dolduruldu.

## Önerilen ilk `timeline` kayıtları

| Tarih | Başlık (TR) | Başlık (EN) | Confidence | Kaynak |
|---|---|---|---|---|
| 2009 | Proje başlangıcı | Project start | `official` | Daily Sabah 2020, Naval News 2021 |
| 2018-11-02 | Seri üretim sözleşmesi | Serial production contract | `official` | Naval News 2021, Savunma Sanayi 2020 |
| 2019-11-03 | İlk denizden test atışı | First ship-launched test | `official` | Naval News 2021, Savunma Sanayi 2019 |
| 2020-07-01 | 200 km+ test atışı | 200 km+ test launch | `official` | Savunma Sanayi 2020, Daily Sabah 2020 |
| 2021-02-04 | IOC testi (live warhead) | IOC test (live warhead) | `press` | Naval News 2021 |
| 2022-07-02 | Kara konuşlu test atışı | Land-based test launch | `press` | DefenceTurk 2022 |
| 2025-03-12 | Denizaltıdan test atışı | Submarine-launched test | `press` | Naval News 2025 |

## Reddedilen kaynaklar

Henüz yok.

## _todo

### Tamamlananlar

- [x] ROKETSAN TR web sayfasını incele.
- [x] ROKETSAN EN web sayfasını incele.
- [x] ROKETSAN TR PDF'ini indir ve SHA-256 özetini hesapla.
- [x] ROKETSAN EN PDF'ini indir ve SHA-256 özetini hesapla.
- [x] Savunma Sanayi 2019/2020 haberlerini incele.
- [x] Naval News 2021/2025 haberlerini incele.
- [x] DefenceTurk 2022 haberini incele.
- [x] Daily Sabah 2020 haberini incele.
- [x] ROKETSAN IDEF'21 basın toplantısı haberini incele.
- [x] SSB KARA ATMACA sayfasını incele (kapsam ayrımı için).
- [x] Durum (`status`) için kaynak değerlendirmesi yap — karar: `seri-uretim`.
- [x] `content/systems/atmaca.json` oluştur.
- [x] `lib/schema.ts` güncelle (`seyir-fuzesi`, `warhead_weight_kg`, `upper_value`/`upper_operator`).
- [x] `lib/format.ts` ve mesaj paketlerini güncelle.
- [x] `lib/geometry/selection.ts`, `lib/geometry/model.ts`, `lib/geometry/atmaca.ts` oluştur.
- [x] `components/model-viewer/MissileViewer.tsx` ve `scripts/bake-glb.mjs` yeni modele geçir.
- [x] `pnpm typecheck && pnpm lint && pnpm test && pnpm validate:content && pnpm build` çalıştır.

### Açık kalanlar

- [ ] ROKETSAN web/PDF sayfalarının üçüncü taraf arşiv kopyasını al (Internet Archive / archive.today).
- [ ] PDF'nin gerçek yayımlanma tarihi/sürümünü doğrula; metadata yok, içerikte basım tarihi aranacak.
- [ ] Web sayfasındaki uzunluk aralığının (4,3–5,2 m) hangi konfigürasyonları kapsadığını açıklığa kavuştur.
- [ ] Web `< 750 kg` ile PDF `750 kg` arasındaki ilişkiyi konfigürasyon ayrımıyla çöz veya açık çelişki olarak kaydet; şimdilik `revisions` boş, çünkü gerçekleşmiş bir düzeltme kaydı yok.
- [ ] Dış görünüş / kanatçık profili için lisansı açık referans bul veya sadeleştirme kararı ver.
- [ ] 2024-03-10 Kale KTJ-3200 motorlu test için orijinal kaynak bul (TRT World / ROKETSAN).
- [ ] Ek tarihli kaynakları (SSB basın bültenleri, IDEF duyuruları, DHA/AA/TRT haberleri) araştır ve matrise ekle.
