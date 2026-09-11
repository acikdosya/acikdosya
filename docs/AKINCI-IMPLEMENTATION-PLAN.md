# AKINCI dosyası — uygulama planı

**Proje:** Açık Dosya  
**Depo:** https://github.com/acikdosya/acikdosya  
**İnceleme tarihi:** 11 Eylül 2026  
**İncelenen commit:** `cc5471feabffbd8b7c4b8d1cf3aef8fd5e2e6178` — `feat: ATMACA sistem dosyası ekle`  
**Durum:** Uygulama öncesi plan; AKINCI kodu veya yayın verisi oluşturulmadı.  
**Önerilen depo konumu:** `docs/AKINCI-IMPLEMENTATION-PLAN.md` — yeni dosya önerisi.

## 1. Amaç ve temel karar

AKINCI'yı TAYFUN ve ATMACA'dan sonra üçüncü sistem dosyası olarak, mevcut kaynak disiplini ve görsel kimlikle hazırlamak. Dosya; boyutları, birbirinden farklı performans kavramlarını, üreticinin aile düzeyindeki açıklamalarını ve kaynakla ayrıştırılabilen varyant bilgilerini anlaşılır kılmalı.

**AKINCI bir hava aracı dosyasıdır. Füze verisi, füze geometrisi ve menzil halkası varsayımları uçağa uygulanmayacak.**

İlk sürüm için öneriler:

1. Türkçe `/sistemler/akinci`, İngilizce `/en/systems/akinci`.
2. Slug/kimlik `akinci`; üretici adı düz metin BAYKAR; başlık `Bayraktar AKINCI`.
3. Yeni kategori `insansiz-hava-araci`; TR “İnsansız hava aracı”, EN “Unmanned aerial vehicle”.
4. Aile düzeyinde verilen ölçüler ayrı tutulacak; A/B/C varyantlarına otomatik kopyalanmayacak.
5. Açıklanan uçuş menzili teknik tabloda bağlamıyla bulunabilecek; ilk sürümde AKINCI için coğrafi menzil halkası üretilmeyecek.
6. Kanat açıklığı/uzunluk odaklı ölçek gösterimi ve kaynaklı veri tablosu temel çıktı. Şematik 3D ve AR, dış biçim için yeterli dayanak bulunduğunda eklenecek.
7. Yeni bir CMS, genel uçak simülatörü, görev planlayıcı veya mühimmat kataloğu kurulmayacak.

## 2. CLAUDE.md uyumu ve uygulama sınırı

Güncel `CLAUDE.md` GitHub eklentisi üzerinden bütünüyle okundu. Depo ayrıca aynı commit'te ayrı yerel çalışma ağacında incelendi. Bu plandaki tasarım önerileri mevcut kuralları kendiliğinden değiştirmez.

| Kural | AKINCI uygulaması |
|---|---|
| §1: az sayıda derin dosya | İlk sürüm tek AKINCI ailesi; bütün İHA ekosistemine genişleme yok. |
| §3: kaynaklı ölçüm dizileri | Yeni havacılık alanları da `Measurement[]`; kaynaksız sayı veya tek “doğru” değer yok. |
| §4: palet, font, desenli rozetler | Archivo/Source Serif 4, cetvel motifi ve mevcut tokenlar korunur. Üç güven seviyesi renk yanında desenle ayrılır. |
| §4: tek orkestre hareket | Giriş kaskadı, otomatik uçuş gösterisi, sürekli pervane animasyonu eklenmez. Kullanıcı kontrollü model dönüşü ve reduced-motion davranışı korunur. |
| §5: editoryal sınırlar | Hedefler, mühimmat yükleme kombinasyonları, çatışma görselleri, iç sistem/üretim detayı ve isabet optimizasyonu yok. |
| §5/§10: bağımsızlık ve marka | BAYKAR logosu ve ortaklık izlenimi yok; üretici adı metin, bağımsızlık açıklaması görünür. |
| §6: performans | LCP < 2,0 sn; ilk JS < 180 KB gzip; GLB < 3 MB; ağır katmanlar görünürlükle yüklenir. |
| §8: plan/onay | Bu dosya incelemeye sunulacak planın kendisidir. Büyük şema/model değişiklikleri plan değerlendirildikten sonra uygulanır. |
| §9: parametrik, dış görünüş | Hazır uçak modeli indirilmez; ölçü yoksa model uydurulmaz; fotogerçekçilik, kesit ve iç bileşen yok. |
| §11: mevcut dağıtım | Sunucu, nginx, sertifikalar, harita paketi ve Umami topolojisi değiştirilmez. |

**Özel karar noktası:** §9'daki `length_m + diameter_mm`, füze geometrisi ve `t + angle` annotation örneği mevcut füze uygulamasını tarif ediyor. AKINCI için uzunluk/kanat açıklığı/yükseklik ve uçağa uygun oransal etiket konumları gerekiyor. Bu genişletme planın açık bir parçasıdır; uygulayıcı kuralı sessizce yeniden yorumlayıp sahte çap üretemez. Plan onayında bu uçak uyarlaması karara bağlanır; gerekirse §9 için dar bir açıklama değişikliği ayrıca önerilir. Bu plan hazırlanırken `CLAUDE.md` değiştirilmedi.

## 3. Güncel depoda neler var, neler hâlâ eksik?

Bu belge önceki ATMACA planının uygulandığını varsaymıyor; gerçek commit'teki kodu esas alıyor.

| Dosya / alan | İncelenen durum | AKINCI'ya etkisi |
|---|---|---|
| `content/systems/` | `tayfun.json` ve `atmaca.json` mevcut. | İki sistemin regresyonu kontrol edilecek. |
| `docs/research/atmaca-sources.md` | ATMACA araştırma/karar notu var. | Aynı belge türü AKINCI için kullanılabilir; içindeki bütün kararlar AKINCI'ya taşınmaz. |
| `lib/schema.ts` | `balistik-fuze`, `seyir-fuzesi`; altı mevcut ölçü anahtarı. | Uçak kategorisi ve gerçek anlamlarıyla havacılık ölçüleri eklenmeli. |
| `measurementSchema` | `upper_value` ve `upper_operator` eklendi. | Aralık desteği yeniden icat edilmeyecek; yeni tüketiciler üst sınırı da taşımalı. |
| `systemSchema` | Her sistemde en az bir `range_km` zorunlu. | Uçak dosyası için bu zorunluluk koşullu hale gelmeli. |
| `lib/geometry/selection.ts` | Adına rağmen ölçüm seçmiyor; `specFor(slug)` ile füze profil oranlarını seçiyor. Bilinmeyen slug TAYFUN profiline düşüyor. | Gerçek ortak ölçüm seçici hâlâ gerekiyor. AKINCI bilinmeyen füze profili gibi çizilemez. |
| `lib/geometry/model.ts` | `ModelSpec` uzunluk ve çap istiyor; bütün yollar `buildMissile()` çağırıyor. | Uçak/füze türlerini açıkça ayıran dar bir model sözleşmesi gerekiyor. |
| `lib/geometry/atmaca.ts` | Ayrı uçak benzeri üretici değil, mevcut füze için profil sabitleri. | Dosyanın varlığı genel geometri desteğinin tamamlandığı anlamına gelmiyor. |
| `MissileViewer.tsx` | Kamera ve hotspotlar uzunluk/çapa ve gövde eksenine bağlı. | Kanat açıklığını kapsayan kamera, uçak yönelimi ve etiket konumu gerekiyor. |
| `scripts/bake-glb.mjs` | `buildModel()` kullanıyor, fakat ölçüleri hâlâ dizinin ilk elemanından alıyor. | Web/AR ölçüm tutarlılığı çözülmeli. |
| SVG/OG/MeasureGap | Uzunluk ve çap bekliyor; uçak türü ayrımı yok. | Uçakta çap eksik diye bütün görseller düşmemeli; füze silueti çizilmemeli. |
| `lib/measurement/divergence.ts` | Birimler `m/mm/km/kg`, boyutlar uzunluk/kütle; kıyas eksenleri `scope` ve `variant_id`. | Süre/hız/irtifa birimleri ve koşul bilinmezliği için küçük genişletme gerekiyor. |
| `lib/stats.ts` | `valueKey()` üst sınırı hesaba katmıyor. | Yeni çok değerli içerikte farklı aralıkların aynı sayılmasını önleyen tamamlayıcı düzeltme. |
| `lib/structured-data.ts` | `bounded()` mevcut aralık üst sınırını okumuyor. | Ortak veri yolunda üst sınır kaybını gidermek gerekiyor. |
| `SpecTable.tsx` | Yalnız varyant ölçülerini geziyor; kapsam notunu ıraksama olduğunda gösteriyor. | Aile ölçüleri ve tek kayıtta bile önemli olan uçuş koşulu notu görünmeli. |
| `lib/analytics.ts` | Beş olay ve kendi origin'inde Umami mevcut. | Yeni izleme altyapısı gerekmez. |

Mevcut şemada `warhead_weight_kg` bulunması, AKINCI faydalı yükünün o alana yazılabileceği anlamına gelmez. AKINCI'da bu alan kullanılmayacak. Mevcut füze içeriklerinin kapsamını değiştirmek bu planın işi değildir.

## 4. Kaynak ön incelemesi ve veri kapsamı

Başlangıç kaynakları 11 Eylül 2026'da okunan üretici sayfalarıdır:

- [Baykar — AKINCI Türkçe](https://baykartech.com/tr/uav/bayraktar-akinci/)
- [Baykar — AKINCI İngilizce](https://baykartech.com/en/uav/bayraktar-akinci/)

Bu iki sayfa aynı üreticinin dil sürümleridir; iki bağımsız teyit sayılmaz. Sayfalardaki değerler üretici beyanıdır, bağımsız performans doğrulaması değildir. Yayın tarihi/sürüm ve her değerin varyant eşleştirmesi henüz kapanmış kabul edilmez.

| Alan | Sayfalarda görülen beyan | İlk sürüm yaklaşımı |
|---|---|---|
| Uzunluk | 12,2 m | Aile düzeyinde, kaynağıyla. |
| Kanat açıklığı | 20 m | Ayrı ölçü; uçak ölçek gösteriminin ana boyutu. |
| Yükseklik | 4,1 m | İniş takımı/ölçüm konfigürasyonu araştırılacak. |
| Azami kalkış kütlesi | 6.000 kg | Genel `mass_kg` yerine MTOW alanı. |
| Faydalı yük | 1.500 kg | Ayrı kapasite alanı; silah yükü olarak etiketlenmez. |
| Havada kalış | 24+ saat | Kaynaktaki “+” anlamı korunur; izinli operatöre dönüşüm açıklığa kavuşmadan kesin eşitlik üretilmez. |
| Servis tavanı | 40.000 ft | Operasyonel irtifadan ayrı alan. |
| Operasyonel irtifa | 30.000 ft | Servis tavanıyla çelişki gibi sunulmaz. |
| Seyir / azami hız | 150 / 240 KTAS | İki farklı alan; bir hız aralığı veya iki çelişen ölçüm değil. |
| Operasyonel menzil | 6.000 km | Kaynağın terimi korunur; görev yarıçapı olarak yorumlanmaz. |
| Varyant adları | A, B, C | Adların varlığı ortak ölçülerin her birine aynı şekilde uygulanmasını kanıtlamaz. |

İngilizce sayfada havada kalış satırı “Hover” olarak etiketlenmiş. Bu sözcük uçağın havada asılı kalma kabiliyeti olarak aktarılmayacak. Kaynak ifadesi araştırma notunda korunacak; site çevirisinde doğru kavram olan “Endurance” kullanılacak ve bunun bizim terminoloji düzeltmemiz olduğu not edilecek. İngilizce sayı yazımındaki noktalama da veri anlamına göre kontrol edilecek; otomatik metin ayrıştırma tek başına yeterli değil.

### Araştırma defteri

**Yeni:** `docs/research/akinci-sources.md`. `content/` altında araştırma dizini açma; mevcut doğrulayıcı yalnız tanımlı içerik yapısını kabul ediyor.

Her iddia için: yayıncı/URL, özgün ifade ve birim, aile/varyant kapsamı, tarih hassasiyeti, `confidence`, `scope`, belge sürümü varsa sürüm, erişim/doğrulama tarihi, bağlam/koşullar, yayına alma kararı tutulmalı. PDF kullanılırsa gerçekten indirilen belgenin SHA-256 özeti hesaplanmalı; arşiv adresi yoksa uydurulmamalı. Üretici broşürü veya görselleri izin/lisans olmadan yeniden barındırılmamalı.

Araştırma sırası: güncel TR/EN sayfalar → üreticinin tarihli ilk uçuş/teslimat duyuruları → varyantı açıkça belirten üretici kayıtları → yalnız boşluğu kapatan erişilebilir basın kaynakları. “Resmî açıklamaya göre” yazan haber, doğrudan birincil belge bulunmadıkça `press` kalır.

İlk uçuş, ilk teslimat ve varyant kilometre taşları için tarihli kaynaklar bu ön incelemede tek tek doğrulanmadı. Plan bu olaylara hazır tarih atamıyor. Durum alanı da `envanterde` diye otomatik doldurulmayacak; seçilen durum kaynaklı takvim olayıyla desteklenecek.

## 5. Veri sözleşmesi — anlamı doğru alanlarda sakla

### 5.1 Önerilen yeni ölçü anahtarları

Mevcut `length_m` yeniden kullanılır. Aşağıdaki alanlar `lib/schema.ts` içindeki tek sözleşmeye, aynı `Measurement[]` modeliyle eklenir. Alanlar opsiyoneldir; boş dizi yerine alan atlanır.

| Anahtar önerisi | Anlam / birim | Yanlış eşleme |
|---|---|---|
| `wingspan_m` | Kanat açıklığı, m | `diameter_mm` değil. |
| `height_m` | Toplam yükseklik, m | Gövde çapı veya kanat kalınlığı değil. |
| `mtow_kg` | Azami kalkış kütlesi, kg | Boş kütle veya genel `mass_kg` değil. |
| `payload_kg` | Yayımlanmış faydalı yük kapasitesi, kg | Harp başlığı ya da doğrulanmış silah yükü değil. |
| `endurance_h` | Havada kalış, saat | Hızla çarpılıp yeni menzil üretilmez. |
| `service_ceiling_ft` | Servis tavanı, ft | Operasyonel irtifa değil. |
| `operating_altitude_ft` | Operasyonel irtifa, ft | Servis tavanının eski/yeni sürümü değil. |
| `cruise_speed_ktas` | Seyir gerçek hava hızı, KTAS | Yer hızı veya azami hız değil. |
| `max_speed_ktas` | Azami gerçek hava hızı, KTAS | Seyir hızı değil. |
| `operational_range_km` | Kaynaktaki operasyonel menzil beyanı, km | Füze `range_km` alanı veya görev yarıçapı değil. |

İlk sürümde motor gücü eşleştirmeleri, mühimmat listesi, kalkış mesafesi, gövde çapı, boş kütle ve görev yarıçapı için yeni alan açılmaz. Daha sonra açık ihtiyaç ve kaynak bulunursa eklenebilir.

### 5.2 Aile düzeyi ve varyantlar

**Öneri:** `systemSchema` içine opsiyonel `specs` ekle; bu aile düzeyindeki beyanları taşır. Mevcut `variants[].specs` varyanta özgü ölçüler için kalır. `system.specs` başka bir şema kopyası değil, aynı `specsSchema` kullanımıdır.

- Aile beyanı A/B/C'ye çoğaltılmaz; eksik varyant hücresine görünmez miras yoluyla yazılmaz.
- A/B/C adları doğrulandığında gerçek varyant kayıtları açılabilir. Varyanta özgü sayı yoksa `specs: {}`, `attributes: {}` ve gerekçeli `_todo` kullanılabilir; sıfır/varsayılan ölçü konmaz.
- Varyant adının kaynağı gerekiyorsa varyant nesnesinde opsiyonel `source`/`source_url` ile izlenir; kaynak adı iki dillidir. Sırf üç sütun doldurmak için motor seçenekleri varyantlara dağıtılmaz.
- Aile tablosu “Üreticinin aile düzeyindeki beyanları” olarak görünür. Varyanta özgü veri yoksa üç boş tablo sütunu yerine varyant adları ve bilgi boşluğu kısa biçimde gösterilir.
- Aile modelinden üç aynı A/B/C modeli üretilmez. Tek model varsa “AKINCI — aile düzeyindeki ölçülerle şematik görünüş” açıklaması taşır.

**Yeni önerilen yardımcı:** `lib/measurement/groups.ts`. Aile ve varyant gruplarını ortak biçimde dolaştırır. Spec tablosu, istatistik, hero, son güncelleme, kaynak listesi ve JSON-LD bu yardımcıyı kullanır. Yeni aile alanının yalnız tabloda görünüp istatistik/SEO'da kaybolması önlenir.

Eski TAYFUN/ATMACA'da `system.specs` bulunmaması geçerli kalır; zorunlu toplu veri göçü yoktur. Aynı aile kaydı varyant sayısıyla çarpılarak değer/kaynak sayacı şişirilmez.

### 5.3 Menzil zorunluluğunu koşullu yap

Mevcut `range_km` zorunluluğu, var olan iki füze kategorisi için korunur. `insansiz-hava-araci` için kaldırılır. AKINCI `range_km` içermeden şemadan geçebilmeli; hatta yanlışlıkla bu alanla harita üretimine girmesini önleyen kategori doğrulaması eklenmeli.

`operational_range_km` kaynağı doğrulanamazsa alan atlanır; sırf build geçsin diye sayı eklenmez. İlk sürümün yayın eşiği; kaynaklı temel boyutlar, yeterli açıklama/takvim ve doğru veri sunumudur, harita değildir.

### 5.4 Bağlam ve karşılaştırılabilirlik

`confidence` kimin söylediğini, `scope` nasıl elde edildiğini ifade etmeye devam eder. Uçuş koşulları bu ikisinin yerine geçmez.

Önerilen küçük ekler:

- `Measurement.context_note?: LocalizedText`: varyant/koşul belirsizliğini insan okuyabilir biçimde belirtir; tek kayıt olsa da önemli not görünür.
- `Measurement.comparison_context_id?: slug`: yalnız gerçekten eşleştirilmiş koşullar için kullanılır. Aynı kimlik, kaynak defterinde tanımlanan aynı varyant, yük, koşul ve ölçüm anlamına dayanır; aynı URL'de bulunmak yeterli gerekçe değildir.

Karşılaştırıcıya alan anlamı da taşınmalı. Performans alanları için önce varyant/aile ve `scope` kontrol edilir; ardından koşul denetimi gelir:

1. Bilinen kapsamlar farklıysa mevcut “farklı kapsam” sonucu.
2. Koşula duyarlı iki performans kaydında karşılaştırma bağlamı eksikse, ikisinde de eksik olsa bile “belirsiz”.
3. İki doğrulanmış bağlam farklıysa “farklı kapsam”.
4. Aynı bağlam doğrulanmışsa mevcut sayısal/aralık karşılaştırması.

Bu kural mevcut bütün füze verilerine körlemesine uygulanmaz; yeni havacılık performans alanlarının semantik politikası olarak tanımlanır. Serbest metin notlarından otomatik bağlam kimliği çıkarılmaz. Varyant genel ölçülerinin de kapsamı açıklanmamışsa kesin uyuşmazlık iddiası yapılmaz.

Servis tavanı ve operasyonel irtifa, seyir ve azami hız, MTOW ve faydalı yük zaten farklı anahtarlardır; birbiriyle çelişki hesabına sokulmaz. Güncel sayfadaki azami değerler, aynı uçuşta birlikte sağlanmış tek performans paketi gibi sunulmaz.

### 5.5 Birimler, aralıklar ve özgün gösterim

- `SPEC_UNITS`, `SpecUnit` ve boyut eşlemesi süre ve hız boyutlarıyla genişletilir; ft uzunluk birimi olarak açık dönüşüm katsayısıyla tanımlanır.
- İlk sürümde kaynak birimi korunur. Metre/km-sa gibi ek dönüşüm isteğe bağlıdır; eklenirse aynı kaydın türetilmiş gösterimi olur, yeni bağımsız ölçüm gibi sayılmaz.
- KTAS kaynağı yer hızı diye çevrilmez. Mach dönüşümü ve atmosfer modeli eklenmez.
- `upper_value`/`upper_operator` zaten vardır. Seyir/azami hız çiftini bu aralık yapısına koyma.
- “24+” için anlamı netleştirmeden `24` eşitliği veya gelişigüzel `>`/`≥` seçilmez. Özgün gösterim araştırma defterinde saklanır; uygun operatör dayanağı bulunamazsa üretim sayısal alanı `_todo` ile ertelenir. `CLAUDE.md` operatör kümesine sessizce `+` eklenmez.
- Ortak `valueKey()` üst sınırı da kapsar; JSON-LD üst sınırü ve operatör açıklamasını korur. Bu iki mevcut eksik dar regresyon testleriyle tamamlanır.

## 6. Sayfa yapısı ve görsel anlatım

Önerilen sıra: kısa kapsam özeti → ölçek → model varsa model → aile/varyant teknik verisi → performans terimleri açıklaması → program takvimi → gerçek revizyon varsa revizyonlar. Bölüm numaraları mevcut dinamik dizi yaklaşımından türetilir.

Yeni performans açıklaması çok kısa olmalı: tabloda geçen kavramları açıklar, yeniden kaynaksız rakam yayımlamaz. Menzil/görev yarıçapı, seyir/azami hız, servis tavanı/operasyonel irtifa ayrımına odaklanır. Uçuş koşullarının açıklanmadığı yerde bunu söyler; hesap makinesi ve görev simülasyonu sunmaz.

### 6.1 Ölçekli çizim

**Yeni öneri:** `components/scale-silhouette/aircraft-geometry.ts`; mevcut `ScaleSilhouette` uygun türe yönlendirir.

- Üst görünüş için uzunluk ve kanat açıklığı gerekir. İki eksen aynı metre/piksel ölçeği kullanır; geniş ekrana sığdırmak için kanat açıklığı ezilmez.
- Yan görünüşte uzunluk ve uygun konfigürasyondaki yükseklik kullanılır. Toplam yükseklik gövde kalınlığı olarak kullanılamaz.
- İnsan referansı varsa aynı fiziksel ölçekte ve açık karşılaştırma etiketiyle verilir; insan boyu uçağın plan görünüşünün yüksekliği sanılmamalı.
- Yalnız toplam boyutlar ayrıntılı uçak silueti için yeterli değildir. Dış hat kanıtı yoksa ölçü çizgileriyle boyut şeması gösterilir; uçak konturu uydurulmaz.
- Kaynaklı ölçü değişince SVG ve ölçü etiketleri değişir. Metinler ortak biçimlendiriciden gelir; operatör ve güven seviyesi kaybolmaz.

### 6.2 Parametrik 3D

**Yeni öneri:** `lib/geometry/akinci.ts`. Ortak `model.ts` içinde ayrımlı sözleşme:

- Füze kolu: mevcut kaynaklı uzunluk + çap.
- Uçak kolu: kaynaklı uzunluk + kanat açıklığı + gerekli yükseklik ve doğrulanmış dış profil bilgisi.
- Bilinmeyen sistem/model türü: desteklenmiyor sonucu; varsayılan TAYFUN geometrisi yok.

Sadece üç toplam boyuttan gerçek gövde genişliği, kanat profili, kanat kalınlığı, motor yeri veya kuyruk oranı türetilemez. Gereken dış biçim bilgisi yayımlanmış referanslarla desteklenmeli; görsel çıkarımın sınırı ve güveni belirtilmeli. Referanssız ayrıntı verilmez. Boyut şeması ile ayrıntılı modelin yayın eşikleri farklıdır.

İlk modelde sade dış gövde/kanat/kuyruk yeterlidir. Motor/pervane/iniş takımı ve yük istasyonları modellenmez. Dış biçim için yeni bir performans hesabı veya aerodinamik model kullanılmaz. Hazır model indirilmez.

**Güncelleme, 11.09.2026.** Üreticinin yayımladığı görsellerden — 360° gösterinin kareleri dahil — *oran ölçmek* serbesttir. Görselin kendisi indirilip saklanmaz, depoya girmez, sayfada gösterilmez; alınan şey görüntü değil, ölçülen orandır. Ölçüm yöntemi, görülme tarihi ve kaynak adresi profil dosyasına yazılır ve hangi oranın ölçüldüğü, hangisinin seçildiği ayrı ayrı belirtilir (`lib/geometry/akinci.ts`). İnternette görüntülenebilir olmak hâlâ yeniden kullanım lisansı sayılmaz; bu yüzden görsel yeniden yayımlanmaz.

### 6.3 Ortak ölçüm seçimi

Mevcut `selection.ts::specFor()` profil seçer; onu tamamlanmış ölçüm seçicisi sanma. **Yeni öneri:** `lib/geometry/measurements.ts` ile tek kaynaklı seçim sonucu üret:

- Kullanılacak ölçüm kayıtları, tür, boyutlar, kaynak bağlantıları ve varsa model üretilememe gerekçesi.
- Aynı belge/konfigürasyondan tutarlı ölçü seti; ayrı alanlardaki en yüksek güvenli değeri birleştirip hiç yayımlanmamış uçak oluşturma.
- Aralık veya çözülmemiş alternatif varsa model için keyfî uç/ortalama seçme.
- Gösterim için tek ölçü seti seçmek, teknik tablodan alternatifleri çıkarmak değildir. Model altında hangi kaydın kullanıldığı açıklanır.
- Güven bilgisi ölçü bazında taşınır; modelin bütününü “resmî model” yapan tek rozet kullanılmaz.

SVG, web modeli, OG, GLB üretimi ve `MeasureGap` bu ortak seçim sonucunu kullanır. Aile modeline açık bir çıktı kimliği atanır; bu kimlik fiziksel bir varyantmış gibi veri tablosuna eklenmez. Mevcut füze GLB URL'leri gereksiz yere değiştirilmez.

### 6.4 Kamera, annotation, AR ve bellek

- `MissileViewer.tsx` içindeki `goalFor()` yalnız uzunluk/çapı dikkate alıyor. Uçak için bounding box ve gerçek aspect ratio üzerinden kadraj hesaplanmalı; mobilde kanat uçları kesilmemeli.
- Füzedeki otomatik 90° döndürme uçak modeline aynen uygulanmamalı. Dünya birimi metre, dikey yön, üst/yan görünüş ve AR ölçeği birlikte doğrulanmalı.
- Uçak etiketi gerekiyorsa annotation şeması ayrımlı yapılır: mevcut füze `t/angle` kayıtları korunur; uçak için boyut kutusuna göre normalize edilmiş konum önerilir. Mutlak dünya koordinatı ve ikinci sahne veri şeması yoktur.
- Bu annotation genişletmesi §9 karar noktasının parçasıdır. İlk sürümde kaynaklı etiket ihtiyacı yoksa boş annotation listesiyle ilerlemek mümkündür.
- Genel görünüş/üst/yan görünüş kontrolleri aynı modelin kullanıcı kontrollü bakışlarıdır; otomatik sinematik kaskad eklenmez.
- `ModelSection` görünürlük kapısı ve dinamik import korunur. Uçak kodu bütün füze sayfalarının ilk JS yüküne eklenmez.
- Runtime ve GLB aynı tür seçicisini, ölçü setini ve üreticiyi çağırır; eski `[0].value` yolu kaldırılır.
- Draco, doku kullanılacaksa KTX2, model başına 3 MB sınırı, unmount/variant değişiminde `dispose()` ve reduced-motion korunur.
- GLB üretilemeyen durumda AR linki yoktur. Eski çıktıların yeni build'e sızmaması sadece uygulamanın ürettiği dosyaları kapsayan kontrollü temizlikle sağlanır.

## 7. Harita kararı

**AKINCI ilk sürümünde coğrafi menzil zarfı yok.** Üreticinin operasyonel menzil terimi, tek yön erişim veya üs çevresindeki görev yarıçapı olarak yorumlanamaz. Açıklanmayan yük, rota, yakıt rezervi ve uçuş koşullarını tamamlayan hesap yapılmaz.

- `buildRings(system)` kategori/özellik uygunluğunu kontrol ederek AKINCI için boş dizi döndürür.
- `operational_range_km`, `range_km`'ye otomatik eşlenmez.
- AKINCI'da RangeEnvelope ve harita chunk'ı oluşturulmaz; var olmayan bölüme menü/link eklenmez.
- TAYFUN/ATMACA menzil halkaları ve mevcut self-host altlık davranışı korunur.
- Harita yerine kaynaklı ölçek gösterimi ve performans terimleri açıklaması kullanılır.

Sonraki bir sürümde kaynak açık görev yarıçapı verse bile harita otomatik açılmaz; ayrı ürün/editoryal değerlendirme gerektirir. Sayısal bilginin tabloda bulunması haritayla gösterilmesini zorunlu kılmaz.

## 8. Dosya bazlı uygulama haritası

“Yeni” dosyalar öneridir. Diğer yollar incelenen commit'te vardır.

| Dosya / grup | Yapılacak iş |
|---|---|
| **Yeni** `docs/research/akinci-sources.md` | Kaynak, aile/varyant, terim, koşul ve görsel dayanak matrisi. |
| **Yeni** `content/systems/akinci.json` | Kaynaklı TR/EN aile/varyant içeriği ve gerçek `_todo`lar. |
| `lib/schema.ts` | İHA kategorisi, havacılık ölçüleri, aile `specs`, gerekli bağlam alanları, kategoriye bağlı menzil doğrulaması; gerekiyorsa annotation kolu. |
| **Yeni** `lib/measurement/groups.ts` | Aile/varyant ölçülerini tek ortak yoldan dolaşma. |
| `lib/format.ts`, `lib/measurement/divergence.ts` | Birim/boyut genişletmesi, bağlama duyarlı kıyas, mevcut aralık sözleşmesini koruma. |
| `lib/measurement/labels.ts`, `components/divergence-note/DivergenceNote.tsx` | Mevcut “belirsiz/farklı kapsam” diline uçuş koşulu gerekçeleri. |
| `lib/stats.ts`, `lib/hero.ts` | Aile ölçülerini sayma, üst sınırü değer anahtarına katma, hero'da doğru grup adı. |
| `components/spec-table/SpecTable.tsx` | Aile tablosu ve gerçekten verisi olan varyantlar; önemli bağlam notu tek ölçümde de görünür. |
| `components/hero-provenance/HeroProvenance.tsx`, `components/divergence-highlight/DivergenceHighlight.tsx` | Aile grubunu fiziksel varyant gibi göstermeden destekleme. |
| `lib/geometry/model.ts`, `selection.ts` | Füze/uçak ayrımı, bilinmeyen slug için yanlış fallback'i kaldırma; mevcut profil davranışlarını koruma. |
| **Yeni** `lib/geometry/measurements.ts`, `akinci.ts` | Ortak kaynaklı ölçü seçimi ve koşullu parametrik uçak üretimi. |
| **Yeni** `components/scale-silhouette/aircraft-geometry.ts` | Boyutlardan türeyen uçak/ölçü görünüşleri. |
| `components/scale-silhouette/ScaleSilhouette.tsx`, `geometry.ts`, `lib/og.tsx` | Tür bazlı yönlendirme; füze ölçeğini bozmadan uçak çıktısı. |
| `components/measure-gap/MeasureGap.tsx` | “Çap yok” yerine türün gerektirdiği ölçü/profil/kapsam boşluğunu açıklama. |
| `components/model-viewer/ModelSection.tsx`, `MissileViewer.tsx` | Tür bazlı model bilgisi, kamera ve uçak etiketleri. Ad değişimi yalnız gerekli ise; aynı PR'da gereksiz genel refactor yok. |
| `scripts/bake-glb.mjs` | Zod ile içerik, ortak gruplar/ölçü seçimi/model türü, doğru yönelim ve ölçek. |
| `components/range-envelope/rings.ts` | Uçak için halka üretmeme güvencesi. Diğer harita dosyalarında ihtiyaç yoksa değişiklik yok. |
| `app/[locale]/sistemler/[slug]/page.tsx` | Aile verisi, tür bazlı bölümler/model, kısa performans açıklaması. |
| `app/[locale]/sistemler/[slug]/opengraph-image.tsx` | Aynı ölçü/profil kaynağından uçak OG'si, güvenli metin fallback'i. |
| `lib/structured-data.ts` | Aile ölçüleri, yeni birimler, aralık/operatör/kapsam; görünür bilgiyle eşleşme. |
| `messages/tr.json`, `messages/en.json`, `lib/messages.test.ts` | Kategori, ölçü etiketleri, aile kapsamı, eksiklik ve terim açıklamaları. |
| `content/assets.json` | Yeni geometri ve gerçek görsel referans kayıtları. Mevcut `public/models/` generated kaydı yeniden kullanılır. |
| `README.md` | Üçüncü dosya, uçak ölçüleri ve menzil haritasının kategoriye bağlı olması. |

`lib/content.ts`, `lib/urls.ts`, `app/sitemap.ts` ve `i18n/routing.ts` otomatik içerik/rota yapısı için kontrol edilir; yeterli olan kod değiştirilmez. Yeni framework/paket sürümü, font veya analitik bağımlılığı eklenmez.

## 9. Uygulama sırası

| Adım | İş | Tamamlanma kapısı |
|---|---|---|
| **A — Kaynak ve karar** | Güncel kaynak defteri; aile/varyant kapsamı; terimler; §9 uçak uyarlaması | Yayınlanacak alanlar, ertelenecek alanlar ve görsel doğruluk sınırı yazılı. |
| **B — Veri ve ortak tüketiciler** | Yeni alanlar, aile grupları, birimler, bağlam ve menzil koşulu | AKINCI menzilsiz geçebilir; füze kuralları korunur; veri tablo/istatistik/JSON-LD'de aynı. |
| **C — Ölçek ve ölçü seçimi** | Ortak seçici, uçak boyut şeması, eksiklik görünürlüğü | Ölçü değişikliği tüm 2D/OG çıktılara doğru yansır; yanlış füze fallback'i yok. |
| **D — 3D/AR, koşullu** | Dış profil kanıtı yeterliyse model, kamera, etiket ve GLB | Web/AR aynı ölçü/yönelim; model kaynağı ve sınırı görünür. Yetersizse neden ve takip işi kaydedilir. |
| **E — İçerik ve entegrasyon** | `akinci.json`, TR/EN metinler, kaynaklı takvim, ana sayfa ve paylaşım | Kapsamı belli, bütünlüklü dosya; boş/sahte varyant sütunları yok. |
| **F — Kalite ve teslim** | Test/build, cihaz/SEO/performance kontrolleri, kaynak son kontrolü | Aşağıdaki kabul matrisi ve açık `_todo` raporu. |

PR önerisi: (1) hava aracı veri desteği ve ortak tüketiciler; (2) kaynaklı AKINCI içerik/ölçek/görsel entegrasyonu. Geçersiz taslak JSON, otomatik keşfedilen `content/systems/` altında bırakılmaz. Birinci PR'da kullanıcıya yararsız boş AKINCI sayfası yayımlanmaz.

Planlama tahmini: kaynak araştırması 1–2; veri/tüketiciler 2–3; ölçü/2D 1–2; koşullu 3D/AR 2–4; entegrasyon/QA 1–2 odaklanılmış iş günü. Toplam yaklaşık 7–13 gün; kaynak bekleme süresi hariç, teslim taahhüdü değil. 3D'yi ertelemek veri doğruluğunu ertelemek anlamına gelmez.

## 10. Doğrulama ve kabul kriterleri

Yeni testler mevcut `pnpm test` tarafından bulunan `lib/**/*.test.ts` altında, somut risklere yönelik yazılır. Test fixture'ları sentetik olabilir; üretim içerik dizinine konmaz.

| Alan | Kabul kriteri |
|---|---|
| Şema | Uçak `range_km` ve `diameter_mm` olmadan geçer; füze kategorilerinin eski menzil kuralı sürer. Boş sayı dizisi/kaynaksız sayı reddedilir. |
| Anlam | MTOW `mass_kg` veya faydalı yük `warhead_weight_kg` içine yazılamaz; uyumsuz uçak alanları kategori doğrulamasında yakalanır. |
| Aile/varyant | Aile verisi A/B/C'ye kopyalanmaz; aynı kayıt üç kez sayılmaz. Varyanta özgü kanıt yoksa varyant karşılaştırması sunulmaz. |
| Kıyas | Seyir/azami hız ve servis/operasyonel irtifa ayrı alanlardır. İki koşulu bilinmeyen performans kaydı kesin çelişki diye etiketlenmez. |
| Birim | Saat ve hız farklı boyutlar olarak korunur; ft–m çevrimi gerekiyorsa doğru, tek yerde ve türetilmiş gösterimdir. KTAS yer hızı değildir. |
| Aralık | Üst sınır tabloda, istatistik anahtarında ve JSON-LD'de korunur. Eski operatör testleri geçer. |
| 2D | Uzunluk ve kanat açıklığı aynı ölçekle çizilir. Kaynak profili yoksa uçak şekli uydurulmaz; boyut şeması doğru görünür. |
| 3D/AR | Aynı kaynaklı ölçü seti ve dünya birimi; kanat uçları mobilde kesilmez; AR uçak yönelimi doğru. |
| Eksiklik | Çap bulunmaması uçak için eksiklik değildir. Gerekli ölçü/profil yokluğu doğru gerekçeyle görünür; eksik GLB için AR linki yok. |
| Harita | AKINCI için halka ve harita chunk'ı yoktur; yayımlanmış menzil tabloyla sınırlıdır. Füze haritaları çalışmaya devam eder. |
| Kaynak | Tek kayıtta da önemli kapsam/koşul notu okunur; TR/EN kaynak farklılıkları gizlenmez. |
| SEO | TR ve EN sayfalar doğru canonical/hreflang/sitemap taşır; aile ölçüleri JSON-LD'ye girer, görünmeyen bilgi girmez. |
| OG | TR `/sistemler/akinci/opengraph-image`, EN `/en/systems/akinci/opengraph-image`; İngilizce görsel rotası çevrilmez. Yanlış füze silueti yok. |
| Ana sayfa | Üç gerçek kart; sayaçlar içerikten; AKINCI alfabetik sırada öne geldiğinde hero anlaşılır ve kaynaklıdır. |
| i18n/erişilebilirlik | AKINCI yazımındaki I/ı, Türkçe karakterler, iki dilde sayılar/tarihler; klavye, ekran okuyucu ve desenli rozetler korunur. |
| Hareket/bellek | Reduced-motion, WebGL fallback ve `dispose()` çalışır; modeli kapatıp açma/rota geçişi kaynak sızdırmaz. |
| Performans | LCP < 2,0 sn orta Android/4G; ilk JS < 180 KB gzip; GLB < 3 MB. Ölçüm koşulları rapora yazılır. |
| Analitik | Var olan olaylar merkezi sözlükten; yeni konum/query/tam kaynak URL'si gönderilmez. Model yüklenmesi döndürülme etkileşimi gibi raporlanmaz. |

Her uygulama adımında:

```bash
pnpm typecheck && pnpm lint
```

PR/yayın adayı için CI'ın Node sürümü ve kilit dosyası korunarak:

```bash
pnpm install --frozen-lockfile
pnpm validate:content
pnpm test
pnpm build
```

`prebuild` içerik doğrulama ve GLB üretimini zaten çalıştırır. Yeni testler gerekiyorsa örnek adlar: `lib/measurement/groups.test.ts`, `lib/geometry/measurements.test.ts`, `lib/geometry/model.test.ts`, `lib/structured-data.test.ts`. Bunlar önerilen dosyalardır, inceleme anında yoktur.

Gerçek cihaz/AR ve performans ölçümü yapılmadan “geçti” yazılmaz. Füze harita regresyonu gerçek yerel tile paketiyle doğrulanır; CI'ın tile olmadan build geçmesi harita testi sayılmaz. Kod yazılmadan önce `CLAUDE.md` gereği kurulu Next.js paketinin `node_modules/next/dist/docs/` rehberi okunur.

## 11. Yayına çıkış ve ertelenebilir işler

**Yayını durduranlar:** kaynaksız ölçü/durum; genel aile değerinin varyanta kesin atanması; uçuş menzilinin yarıçapa çevrilmesi; yanlış model/fallback; gizlenen alternatif kaynak; lisanssız görsel; bozuk TR/EN/SEO; gerekli kalite kapılarının başarısızlığı.

**Açık kalabilecekler:** kaynak bulunamayan opsiyonel alanlar, tam gün yerine ay/yıl bilinen olay, arşiv URL'si eksikliği, varyanta özgü performans açıklanmaması, yeterli dış biçim kanıtı olmadığı için 3D/AR'nin üretilmemesi. Her biri gerçek `_todo` ve görünür kapsamla anlatılır. İlk sürümde gerçek yayın düzeltmesi yoksa revizyon bölümü çizilmez.

Özellikle cevaplanacaklar:

1. Genel ürün sayfasındaki boyutlar belirli bir konfigürasyona mı, bütün aileye mi ait?
2. Toplam yükseklik hangi iniş takımı konumunu kapsıyor?
3. Performans değerlerinin yük/irtifa/konfigürasyon koşulları açıklanmış mı?
4. Operasyonel menzil teriminin üretici tarafından daha açık tanımı var mı?
5. Varyant isimlerini ve seçilecek durum/takvim tarihlerini destekleyen erişilebilir duyurular hangileri?
6. Şematik dış hat için kaynak ve lisans zinciri yeterli mi?

Bu sorular önce araştırmayla çözülür. Çözülemeyince alan uydurulmaz; yalnız gerçekten ürün kararı gerektiren nokta kullanıcıya sunulur. Planın hazırlanması bu sorular yüzünden yarım bırakılmaz.

## 12. İnceleme kanıtları ve çalışma durumu

- Plan, ATMACA öncesindeki `7cc6d84…` yerine ATMACA eklenmiş `cc5471f…` commit'ine dayanır. Önceki planda önerilmiş fakat uygulanmamış işleri var saymaz.
- GitHub eklentisiyle güncel `CLAUDE.md` okundu; Git ile alınan aynı commit'te şema, ölçü formatı, kıyas, istatistik, JSON-LD, ATMACA içeriği/araştırma notu, model seçici/üretici, viewer ve GLB akışı incelendi.
- Bu commit'in izlenen dosyalarında `AGENTS.md` bulunmadı. Uygulayıcı güncel checkout'ta tekrar kontrol etmelidir.
- Bu çalışma yalnız plan üretimidir. Uygulama bağımlılıkları kurulmadı; typecheck/lint/test/build veya tarayıcı/cihaz kontrolleri çalıştırılmadı.
- Depo kodu/içeriği, önceki ATMACA planı ve üretim ortamı değiştirilmedi; commit/PR/push/deploy yapılmadı.
- Kaynak ön incelemesi tamamlanmış AKINCI araştırması veya bütün sayısal değerlerin bağımsız doğrulaması değildir.

Başlıca depo referansları: [CLAUDE.md](https://github.com/acikdosya/acikdosya/blob/cc5471feabffbd8b7c4b8d1cf3aef8fd5e2e6178/CLAUDE.md), [şema](https://github.com/acikdosya/acikdosya/blob/cc5471feabffbd8b7c4b8d1cf3aef8fd5e2e6178/lib/schema.ts), [model arayüzü](https://github.com/acikdosya/acikdosya/blob/cc5471feabffbd8b7c4b8d1cf3aef8fd5e2e6178/lib/geometry/model.ts), [profil seçimi](https://github.com/acikdosya/acikdosya/blob/cc5471feabffbd8b7c4b8d1cf3aef8fd5e2e6178/lib/geometry/selection.ts), [AR üretimi](https://github.com/acikdosya/acikdosya/blob/cc5471feabffbd8b7c4b8d1cf3aef8fd5e2e6178/scripts/bake-glb.mjs), [ATMACA araştırma notu](https://github.com/acikdosya/acikdosya/blob/cc5471feabffbd8b7c4b8d1cf3aef8fd5e2e6178/docs/research/atmaca-sources.md).