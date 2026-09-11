# AKINCI kaynak araştırması

**Durum:** devam ediyor — Aşama A kaynak incelemesi; şema/içerik henüz değiştirilmedi.  
**Son güncelleme:** 2026-09-11  
**Araştırmacı:** Açık Dosya  
**Dosya kapsamı:** Bayraktar AKINCI ailesi. Mühimmat listesi, hedef sınıfları, iç sistem detayı ve çatışma görselleri bu notun kapsamına girmez (`CLAUDE.md` §5).

## Kurallar

- Her sayı bir kaynakla gelir. Kaynak yoksa alan boş kalır; tahmin veya “biliniyor ki” ile doldurulmaz.
- Aynı kaynaktan türeyen haberler bağımsız teyit sayılmaz.
- Üreticinin Türkçe ve İngilizce sayfaları aynı kaynak grubundadır; dil farklılıkları not edilir, iki bağımsız kaynak gibi işlem görmez.
- PDF için SHA-256 hesaplanır; erişim tarihi ve kaynak URL kaydedilir.
- Hedef tipi listesi, hedef şehir/ülke, iç yapı, harp başlığı ve çatışma görseli bu dosyaya alınmaz (`CLAUDE.md` §5).

## Kaynak matrisi

| Alan | Değer/Operatör | Kaynak | Confidence | Scope | Varyant | Durum |
|---|---|---|---|---|---|---|
| `length_m` | 12,2 m | Baykar AKINCI TR/EN ürün sayfası, teknik özellikler | `official` | `beyan` | aile | **Karar:** kayda alınacak. |
| `wingspan_m` | 20 m | Baykar AKINCI TR/EN ürün sayfası, teknik özellikler | `official` | `beyan` | aile | **Karar:** kayda alınacak. |
| `height_m` | 4,1 m | Baykar AKINCI TR/EN ürün sayfası, teknik özellikler | `official` | `beyan` | aile | **Açık:** iniş takımı konfigürasyonu belirtilmemiş. |
| `mtow_kg` | 6.000 kg | Baykar AKINCI TR/EN ürün sayfası, teknik özellikler | `official` | `beyan` | aile | **Karar:** kayda alınacak. |
| `payload_kg` | 1.500 kg | Baykar AKINCI TR/EN ürün sayfası, teknik özellikler | `official` | `beyan` | aile | **Karar:** kayda alınacak; “faydalı yük kapasitesi” anlamı korunacak. |
| `endurance_h` | 24+ saat | Baykar AKINCI TR/EN ürün sayfası, teknik özellikler | `official` | `beyan` | aile | **Açık:** `24+` için hangi operatör kullanılacağı netleştirilecek (`>`/`≥`/`~`?). |
| `service_ceiling_ft` | 40.000 ft | Baykar AKINCI TR/EN ürün sayfası, teknik özellikler | `official` | `beyan` | aile | **Açık:** sayfa üst banner’ında “Maksimum İrtifa 45.118 Feet” geçiyor; teknik tablo 40.000 ft. İki değer çelişki mi, farklı kavlam mı? |
| `operating_altitude_ft` | 30.000 ft | Baykar AKINCI TR/EN ürün sayfası, teknik özellikler | `official` | `beyan` | aile | **Karar:** kayda alınacak; servis tavanından ayrı alan olarak. |
| `cruise_speed_ktas` / `max_speed_ktas` | 150 – 240 KTAS | Baykar AKINCI TR/EN ürün sayfası, teknik özellikler | `official` | `beyan` | aile | **Açık:** kaynak tek aralık veriyor; iki ayrı alana mı bölünecek, yoksa bir alanda 150–240 aralığı mı tutulacak? |
| `operational_range_km` | 6.000 km | Baykar AKINCI TR/EN ürün sayfası, teknik özellikler | `official` | `beyan` | aile | **Karar:** tabloda “operasyonel menzil” olarak kaydedilecek; harita yarıçapına çevrilmeyecek. |
| Varyant adları | A, B, C | Baykar AKINCI TR/EN ürün sayfası, teknik özellikler | `official` | `beyan` | — | **Açık:** A/B/C’ye özgü sayı yok; ilk sürümde yalnızca aile düzeyi beyanlar. |

## 1. Baykar AKINCI ürün web sayfası (Türkçe)

- **Yayıncı:** BAYKAR Teknoloji A.Ş.
- **Başlık:** Bayraktar AKINCI
- **URL:** https://baykartech.com/tr/uav/bayraktar-akinci/
- **Erişim tarihi:** 2026-09-11
- **Dil:** Türkçe
- **İncelenen alanlar:**
  - `length_m`: 12,2 mt.
  - `wingspan_m`: 20 mt.
  - `height_m`: 4,1 mt.
  - `mtow_kg`: 6.000 kg (“Azami Kalkış Ağırlığı”)
  - `payload_kg`: 1.500 kg (“Faydalı Yük Kapasitesi”)
  - `endurance_h`: 24+ saat (“Havada Kalış”)
  - `service_ceiling_ft`: 40.000 feet (“Servis Tavanı”)
  - `operating_altitude_ft`: 30.000 feet (“Operasyonel İrtifa”)
  - Hız: “Seyir - Azami Hız 150 - 240 KTAS”
  - `operational_range_km`: 6.000 km (“Operasyonel Menzil”)
  - Varyasyon: AKINCI-A, AKINCI-B ve AKINCI-C
  - Güç sistemi: 2 x 450 hp / 2 x 750 hp / 2 x 850 hp Turboprop Motor
- **Belge sürümü:** web sayfası; sürüm bilgisi sayfada belirgin değil.
- **Açık sorular:**
  - Sayfa üst banner’ında “Maksimum İrtifa 45.118 Feet” görülüyor; teknik tablo “Servis Tavanı 40.000 feet” diyor. İki değer aynı şey mi, farklı ölçüm mü?
  - “Seyir - Azami Hız 150 - 240 KTAS” tek aralık mı, yoksa iki ayrı değer mi?
  - `endurance_h` için `24+` operatörü nasıl temsil edilecek?
  - Yükseklik ölçümünün iniş takımı durumu belirtilmemiş.
- **Karar:** Değerler `official` + `beyan` olarak işaretlenecek; yukarıdaki belirsizlikler `context_note` veya `_todo` ile görünür kalacak.

## 2. Baykar AKINCI ürün web sayfası (İngilizce)

- **Yayıncı:** BAYKAR Teknoloji A.Ş.
- **Başlık:** Bayraktar AKINCI
- **URL:** https://baykartech.com/en/uav/bayraktar-akinci/
- **Erişim tarihi:** 2026-09-11
- **Dil:** İngilizce
- **İncelenen alanlar:**
  - `length_m`: 12.2 mt.
  - `wingspan_m`: 20 m
  - `height_m`: 4.1 m
  - `mtow_kg`: 6.000 kg (“MTOW”)
  - `payload_kg`: 1.500 kg (“Payload Capacity”)
  - `endurance_h`: 24+ hours (etikette “Hover” yazıyor — bu çeviri/terim hatasıdır; doğru kavlam “Endurance”)
  - `service_ceiling_ft`: 40.000 feet (“Service Ceiling”)
  - `operating_altitude_ft`: 30.000 feet (“Operational Altitude”)
  - Hız: “Cruise - Maximum Speed 150 - 240 KTAS”
  - `operational_range_km`: 6.000 km (“Operational Range”)
  - Versions: AKINCI-A, AKINCI-B, and AKINCI-C
  - Power Plant: 2 x 450 hp / 2 x 750 hp / 2 x 850 hp Twin Turboprop
- **Belge sürümü:** web sayfası; Türkçe sayfayla aynı kaynak grubunda.
- **Karar:** Türkçe sayfayla aynı gösterimi taşıyor; “Hover” etiketi araştırma notunda kaydedilecek, site içeriğinde “Endurance” kullanılacak.

## Kararlar ve uygulama durumu

1. **Kategori:** `insansiz-hava-araci` — `lib/schema.ts` enumuna eklenecek.
2. **Yeni ölçü anahtarları:** `wingspan_m`, `height_m`, `mtow_kg`, `payload_kg`, `endurance_h`, `service_ceiling_ft`, `operating_altitude_ft`, `cruise_speed_ktas`, `max_speed_ktas`, `operational_range_km` — `lib/schema.ts` `specKeys`/`specsSchema` içine eklenecek.
3. **Aile düzeyi `specs`:** `systemSchema` içine opsiyonel `specs` alanı eklenecek; AKINCI aile ölçüleri burada tutulacak. A/B/C varyantlarına otomatik kopyalanmayacak.
4. **Menzil zorunluluğu:** `range_km` zorunluluğu `balistik-fuze` ve `seyir-fuzesi` için korunacak, `insansiz-hava-araci` için kaldırılacak.
5. **Harita:** AKINCI için coğrafi menzil zarfı üretilmeyecek. `operational_range_km` değeri tabloda kalacak, yarıçapa çevrilmeyecek.
6. **Durum (`status`):** Henüz kararlanmadı; kaynaklı bir takvim olayı bulunduktan sonra atanacak. Sayfa “birçok ülke tarafından aktif olarak kullanılan” ifadesi geçiyor ama bu `envanterde` statüsü için yeterli bir kaynak değil.

## Önerilen ilk `timeline` kayıtları (taslak)

| Tarih | Başlık (TR) | Başlık (EN) | Confidence | Kaynak | Durum |
|---|---|---|---|---|---|
| 2019-12-06 | İlk uçuş | First flight | `official` | Baykar basın duyuruları | **Doğrulanacak** — şu an kaynak URL yok. |
| 2021-08 | TSK envanterine ilk teslimat | First delivery to Turkish Armed Forces | `official` / `press` | Baykar / basın | **Doğrulanacak**. |
| 2023 | İhracat başlangıcı / yabancı operatör | Export / foreign operator | `press` | Savunma basını | **Doğrulanacak**. |

Yukarıdaki tarihler bu ön incelemede tek tek doğrulanmadı; `content/systems/akinci.json` oluşturulmadan önce ayrı kaynak araması yapılacak.

## Reddedilen kaynaklar

Henüz yok.

## _todo

### Tamamlanacaklar

- [ ] Baykar basın arşivinden ilk uçuş, ilk teslimat ve varyant kilometre taşlarına dair tarihli duyurular bul.
- [ ] “Maksimum İrtifa 45.118 Feet” ile “Servis Tavanı 40.000 feet” arasındaki ilişkiyi açıklığa kavuştur; gerekiyorsa iki ayrı kayıt olarak ekle.
- [ ] `endurance_h` için `24+` gösteriminin operatör kararını netleştir (`>` / `≥` / `~`).
- [ ] Hız alanı için kaynak tek aralık veriyor; `cruise_speed_ktas` ve `max_speed_ktas` ayrımı veya tek aralık kararını ver.
- [ ] A/B/C varyantlarına özgü kaynaklı veri olup olmadığını araştır; yoksa varyant satırları bilgi boşluğu notuyla bırak.
- [ ] Dış görünüş / siluet için yayımlanmış, lisansı açık referans araştır (fotoğraf, teknik çizim, üretici broşürü).
- [ ] `status` alanı için kaynaklı takvim olayı belirle.
- [ ] Üretici sayfasının üçüncü taraf arşiv kopyasını al (Internet Archive / archive.today).

### Açık karar noktaları (kullanıcı onayı gerekebilir)

1. **Servis tavanı / maksimum irtifa:** Sayfada iki farklı rakam var. İkisi de mi kaydedilsin, yoksa teknik tablodaki 40.000 ft mi esas alınsın?
2. **Hız aralığı:** 150–240 KTAS tek kaynak olarak mı tutulsun, yoksa seyir/azami hız diye ikiye mi bölünsün?
3. **Endurance operatörü:** `24+` için `>` mü, `≥` mi, yoksa `~` mi kullanılsın?
4. **Varyantlar:** A/B/C adları var ama özgü veri yok. İlk sürümde yalnızca aile düzeyi mi gösterilsin?
