## Context

Gerekçe için bkz. `proposal.md` — Why.

Bu tasarımı kısıtlayan dört yerleşik karar:

**Kıyas ekseni mekanizması hazır.** `lib/measurement/divergence.ts` içindeki
`comparability()` iki eksen üzerinden çalışıyor (`scope`, `variant_id`) ve üç durumu
ayırt ediyor: iki taraf da dolu ve farklı → kapsam farkı; tek taraf dolu → belirsiz;
iki taraf da boş → eksen atlanır, aralık hesabı devam eder. Üçüncü bir eksen bu
listeye bir satır. Son durum yayındaki üç dosya için gerilemeyi imkânsız kılıyor.

**Halka ölçütü yazılı ama uygulanmamış.** `components/range-scale/geometry.ts` başı
halkayı yarıçap iddiası olarak tanımlıyor ve AKINCI'nın `operational_range_km`
alanının neden halka olmadığını anlatıyor. Ölçüt düzyazıda; kodda karşılığı
`rings.ts` içindeki tek kategori kontrolü. Yani kural var, uygulaması yok.

**Tekrar zinciri veri beklemiş.** `lib/cards/source-chain.ts` başı erteleme sebebini
yazıyor: tasarım şablonu "bir iddia, N yayın" istiyordu, veride o yakınsama hiç
oluşmuyordu. Ölçüm: üç dosyada 31 ölçüm, 10 kaynak, en büyük küme bir belgeden dokuz
değer. Ters yön zaten kart olarak çalışıyor.

**Ana sayfa işaretçisi tek dosyada.** `hero` bugün `tayfun.json` üzerinde ve
`scripts/validate-content.ts` ikinci bir işaretçiyi reddediyor. SİPER dosyası
işaretçi taşımaz.

## Goals / Non-Goals

**Goals:**

- Nesne ekseni yayındaki üç dosyanın ıraksama sonuçlarını bit düzeyinde değiştirmesin.
- Halka alanı seçimi kategori dalından çıkıp içerikteki bir kayda dayansın; yeni
  kategori eklemek sessizce halka çizdirmesin.
- Köken kaydı, ölçüm kayıtlarının biçimini değiştirmeden eklensin; üç dosya yalnız
  `manufacturer` için göç etsin.
- Raporun kodlama kuralları ile şemanın kuralları ayrıştığında, ayrılığın hangisinin
  kazandığı ve neden kazandığı yazılı olsun.

**Non-Goals:**

- Kanister ve diğer alt sistemler için nesne kaydı açmak. Eksen açılıyor, kanister
  değerleri girmiyor.
- "Bir iddia, N yayın" paylaşım kartını üretmek. Köken kaydı onu mümkün kılar,
  kart ayrı kapsam.
- Varyant başına `status`, ölçüm üstü düzeltme (supersession) ve `uncertainty`
  alanının ilk doldurulması.
- 3B modelin SİPER'e özgü biçim araştırması. Ürün tanımı ve oran tablosu mevcut parça
  kitiyle yazılır; oranların hepsi seçilmiş olacaktır, çünkü ortografik bir kaynak
  görsel yok.

## Decisions

### 1. Nesne ekseni üçüncü kıyas ekseni olur, ayrı bir katman değil

Raporun önerdiği yapı bir ağaç: aile → sistem konfigürasyonu → füze varyantı →
kanister → alt sistemler. Bu ağacı şemaya kurmak `variants` dizisinin yanına ikinci
bir kap açmak demek; tablo, istatistik, JSON-LD, hero ve kart tüketicilerinin hepsi
ikinci bir gezinme yolu öğrenirdi.

Seçilen: ölçümün üzerine `object` alanı. Nesne ayrımı, gruplama sorunu olarak değil
**kıyaslanabilirlik sorunu** olarak çözülür. Bu doğru indirgeme, çünkü ağacın
gerçekten işe yaradığı tek yer kıyas kararı: füze menzili ile sistem menzilini ayrı
tutmamızın sebebi ayrı kutularda durmaları değil, aynı cetvele konamamaları.

Alternatif — `variant_id`'yi nesne için de kullanmak: reddedildi. `variant_id` bir
kaydın BAŞKA bir varyantı tarif ettiğini işaretliyor; aynı varyantın füzesi ile
sistemi arasındaki farkı anlatamaz ve iki anlamı bir alana yüklemek ikisini de
okunamaz yapar.

Alternatif — alan adına gömmek (`system_intercept_range_km`): kısmen yapılıyor ve
gerekli, ama tek başına yetmiyor. Alan adı niceliği ayırır, nesneyi ayırmaz: aynı
nesnenin iki ayrı alanı da olabilir, iki nesnenin aynı adlı alanı da. İkisi birden
gerekiyor ve §3'ün "birim alan adının içinde taşınır" kuralıyla tutarlı.

### 2. Alan adı niceliği, `object` nesneyi söyler — ikisi birden

Sistem düzeyi ölçüler kendi alan adlarını alır; füze alanlarının içine `object` ile
ayrılmış ikinci bir anlam yüklenmez. Yani `range_km` füzede kalır, sistemin önleme
menzili ayrı bir alandır.

Sebep: `divergence.ts` birimi alan adından okuyor ve `SPEC_UNITS` tablosu tek kaynak.
Aynı alan adını iki nesne paylaşırsa birim aynı kalır ama etiket, JSON-LD adı ve
tablo başlığı nesneye göre değişmek zorunda kalırdı; o da üç tüketicide birer dal
açardı.

Böylece `object` eksen olarak KALIR ama tek başına ayırt edici olmak zorunda değildir:
alan adı zaten ayırıyorsa eksen sessiz durur. Eksenin asıl işi, aynı alan adının iki
nesne için doldurulduğu kalıntı durumları yakalamak.

### 3. Köken kaydı sistem düzeyinde, ölçüm kimlikle işaret eder

Rapor `repeated_by`'ı ölçümün içine koymuş. CLAUDE.md §3 kaynağa koy diyor. Üçüncü bir
gözlem ikisini de aşıyor: rapordaki örnekte bizim alıntıladığımız yayın (AA)
tekrarlardan biri; köken ise doğrudan okunamayan bir paylaşım. Yani kayıt ne ölçüme,
ne bizim kaynağımıza, **kökene** ait.

Yapı: sistem dosyasında kimlikli köken listesi, her kökende taşıyan yayınların adı,
adresi ve tarihi. Ölçüm ve takvim olayı yalnız kimliği taşır.

Bunun üç sonucu var:

- Üç yayındaki dosya değişmez. Köken alanı opsiyonel, onlarda yok.
- Aynı köken hem bir ölçümü hem bir takvim olayını besleyebilir; ikinci bir mekanizma
  gerekmiyor.
- Sayaç alanı yok. Rapor `count: null` ile "bilinmiyor" diyor, `count: 5` ile
  denetlenmiş sayıyı. Liste tutulduğunda ikisi de bedava gelir: kayıt yoksa
  bilinmiyor, kayıt varsa uzunluğu sayıdır. Sayaç tutmak ikisinin ayrışmasına izin
  verirdi.

### 4. Aynı yayıncı tekrarı ayrı bir alan, ayrı bir okuma

Rapordaki iki tekrar örüntüsü epistemik olarak aynı ağırlıkta değil. Bir açıklamanın
altı ayrı yayıncıda görünmesi dolaşımın genişliğini gösterir; bir yazarın tahmininin
aynı sitenin sonraki yazısında yeniden çıkması hiçbir şey göstermez. Rapor bunu
metinde not düşmüş, şema bir bayrakla taşır.

Alternatif — bağımsız olmayan tekrarı hiç kaydetmemek: reddedildi. Tahminin resmî
haber içine taşınması raporun en öğretici bulgusu; silmek onu kaybettirirdi.

### 5. Halka alanı kategori dalıyla değil, içerik kaydıyla seçilir

Bugün `rings.ts` "İHA değilse `range_km` çiz" diyor. Bu varsayılana düşen bir kural
ve §9'un yasakladığı "tanımsız kategori varsayılana düşer" kalıbının halka
karşılığı: yeni bir kategori eklendiğinde halka kendiliğinden çizilmeye başlıyor.

Seçilen: hangi alanın halka çizdiği açık kayıt. Kayıt yoksa halka yok. Bu, `hero`
işaretçisinde verilen kararın aynısı — editoryal seçim editoryal bir yerde durur —
ve aynı gerekçeyle: sitenin görünür bir bölümü bir sıralama ya da dal kuralının
çıktısı olmamalı.

Hava savunmasında doğru alan sistem önleme menzilidir. Gerekçe `range-scale/geometry.ts`
içindeki ölçütün doğrudan uygulanması: halka "buradan her yöne şu kadar" der ve
angajman yarıçapı tam olarak budur. Füze menzili tek yön uçuş erişimi, yani AKINCI'nın
`operational_range_km` alanıyla aynı kategori — ve o alan için halka çizmeyi zaten
reddetmişiz.

### 6. ASELSAN toleransı `uncertainty` değil `context_note`

Belge geneli ±%10 toleransı `uncertainty` alanının ilk müşterisi gibi duruyor ama iki
kez düşüyor:

- Şema `uncertainty`'yi açık uçlu operatörle reddediyor. Toleransın uygulanacağı
  değerlerin ikisi (`≥ 70`, `≥ 150`) açık uçlu. Bandın hangi uca uygulanacağı
  tanımsız — reddin gerekçesi tam olarak bu.
- Kalan kapalı değerlerde de mekanik uygulama saçmalıyor: `360° ± %10 = 396°`.

Rapor da "eşikler toleransla yeniden hesaplanmadı" diyor. Yani belge geneli bir not,
kayıt başına bir bant değil. `context_note` bunun için duruyor ve iki dilde yazılıyor.
`uncertainty` boş kalmaya devam eder.

### 7. `manufacturer` dizi olur, program yürütücüsü ayrı alan

SİPER'de dört kurum var ve üçü aynı türden değil: ASELSAN, ROKETSAN ve TÜBİTAK SAGE
ortak geliştirici; SSB programı yürüten kamu kurumu. Üçünü diziye koyup dördüncüyü
içine karıştırmak rol bilgisini siler.

Seçilen: `manufacturer` dizi (`min(1)`), ayrıca opsiyonel program yürütücüsü alanı.
Üç yayındaki dosyada göç tek satır: nesne diziye sarılır.

Alternatif — tekil alanı korunup "ASELSAN" seçmek: reddedildi, §5.7. Raporun Bölüm
1'i iş paketi dağılımının bilinmediğini açıkça söylüyor; birini üretici seçmek
kaynağın söylemediğini iddia etmek olur.

### 8. Takvim: `date_kind` açık, `announced_at` opsiyonel

Raporun kilometre taşı tablosunda iki sütun var ve çoğu satırda olay günü BİLİNMİYOR,
duyuru günü biliniyor. Bugünkü tek `date` alanı bu satırları ya duyuru gününü olay
günü yaparak ya da olayı hiç kaydetmeyerek karşılar; ikisi de kayıt hatası.

Seçilen: `date` neyi tarif ettiğini `date_kind` ile söyler (`event` varsayılan,
`announcement`). İkisi de biliniyorsa `date` olay günü, `announced_at` duyuru günü
olur.

Alternatif — `date`'i duyuru tarihi yapıp `occurred_at` eklemek: reddedildi. Yayındaki
üç dosyanın `date` alanları olay tarihi; anlamı değiştirmek sessiz bir göç olurdu.

### 9. SİPER-A ve SİPER-4 varyant değil, ad kaydı

İkisi için tek bilgi bir tören konuşmasında geçen ad. Varyant açmak, ölçü alanı boş
bir satır ve `_todo` üretir; okuyucuya "bu varyantın verisi eksik" der. Doğrusu
"böyle bir ad duyuruldu" — o da `attributes.variant_names` kaydı.

Ürün-3 farklı: iki menzil kaydı var (biri basın beyanı, biri bağımsız tahmin), yani
gerçek bir varyant girdisi hak ediyor.

### 10. Aşamalar

1. Şema ve kıyas ekseni. `object`, sistem düzeyi alanlar, birim boyutları. Testler
   yayındaki üç dosyada gerileme olmadığını gösterir.
2. `manufacturer` göçü ve takvim alanları. Üç dosya + şema, davranış değişmez.
3. Köken kaydı. Şema, doğrulama, sayfada gösterim.
4. Halka alan seçimi. `rings.ts` kategori dalından çıkar, kayıt okur; üç dosyanın
   halkaları aynı kalır.
5. Kategori, ürün tanımı ve içerik. `docs/research/siper-sources.md` ve
   `content/systems/siper.json`.

Sıra önemli: içerik en sonda, çünkü ondan önceki her adım yayındaki dosyalarda
gerileme olmadığını tek başına kanıtlayabilir.

## Risks / Trade-offs

**Nesne ekseni kullanılmadan kalır** → SİPER dışında bugün hiçbir dosya bileşik
değil. Eksen tek müşterili bir soyutlama olabilir. Karşı tartı: eksen bir satır ve
mekanizması zaten kurulu; alternatif olan ağaç yapısı beş tüketiciye dokunuyordu.

**Sistem alanları `specKeys` listesini büyütür** → Liste bugün 16 alan; yedi alan daha
girince tablo ve mesaj paketi uzuyor. Karşı tartı: alan adının birimi taşıması kuralı
korunuyor ve alanlar gerçekten farklı nicelikler. Kısaltmanın yolu nesneyi alan adına
gömmek olurdu, ki §2'de reddedildi.

**Köken kaydı doldurulmazsa görünmez bir alan olur** → SİPER dışındaki dosyalarda
tekrar denetimi yapılmadı, dolayısıyla kayıt boş. Karşı tartı: boşluk zaten doğru
cevap — kayıt yokluğu "tekrar yok" demek değil ve spec bunu zorluyor.

**Halka kaydı yeni dosyalarda unutulur** → Kayıt yoksa halka çizilmez, yani unutmanın
bedeli sessiz bir eksiklik. Azaltma: `scripts/validate-content.ts` menzil alanı taşıyıp
halka kaydı taşımayan dosyayı `_todo` benzeri bir uyarıyla raporlar; derlemeyi
düşürmez, çünkü halka çizmemek meşru bir karar.

**Koruma halkasının okunuşu** → Hava savunmasında halka "bu alan korunuyor" diye
okunabilir; bu, §5.1'in yasakladığı hedef dilinin aynadaki hali. Azaltma iki katlı:
§5.9 sınırı zaten üretilmiş görselde halkayı yasaklıyor, ve spec referans noktanın
hedef, koruma alanı veya ulaşılabilir yer olarak adlandırılmasını yasaklıyor.

**`manufacturer` göçü üç dosyaya dokunuyor** → Yayındaki içerikte değişiklik.
Azaltma: göç mekanik (nesne diziye sarılır), şema zorluyor ve aynı adımda başka
içerik değişikliği yapılmaz.

## Migration Plan

- Nesne ekseni ve köken kaydı geriye dönük uyumlu: alanlar opsiyonel, boşken davranış
  bugünküyle aynı.
- `manufacturer` dizisi **kırıcı**: şema eski biçimi reddeder. Üç dosya aynı taahhütte
  göç eder; ara sürüm tutulmaz, çünkü iki biçimi birlikte kabul eden bir şema
  hangisinin doğru olduğunu söylemekten vazgeçerdi.
- Geri dönüş: adımlar bağımsız. Halka değişikliği geri alınırsa `rings.ts` eski
  kategori dalına döner ve üç dosyanın halkaları etkilenmez.
- `content/systems/siper.json` en son eklenir; ondan önceki hiçbir adım yeni içerik
  gerektirmez.

## Open Questions

- Sistem düzeyi alanların JSON-LD karşılığı ne olmalı. `range_km` bugün
  `schema.org` alanlarına çevriliyor; önleme irtifası ve kapasiteler için doğrudan
  karşılık yok. §5.8 "sayfada görünmeyen alan konmaz" diyor, tersini yani "sayfada
  görünen her alan konur" demiyor — yapısal veriden çıkarmak meşru. Kararı JSON-LD
  adımında vermek specleri değiştirmez.
- Ürün-1 ve Ürün-2 için ürün tanımı tek dosyada iki oran tablosu mu, iki dosya mı
  olur. İki varyantın çapı ve uzunluğu farklı, biçim ailesi aynı. `lib/geometry`
  kayıt düzeni bunu her iki şekilde de alır; seçim içerik adımında yapılır.
