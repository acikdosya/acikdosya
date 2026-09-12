## Why

SİPER için kaynak kökeni izlenen bir araştırma raporu hazır: 37 kaynak, ~42 sayısal
kayıt, köken ile tekrarın ayrıldığı bir denetim. Bugünkü `lib/schema.ts` bu kayıtların
**11'ini** olduğu gibi alıyor, **28'ini** alamıyor. Alamadıklarının tamamı ASELSAN'ın
birincil belgesinden geliyor, yani dosyanın en sağlam yarısı.

Sebep alan eksikliği değil, nesne sınırı. TAYFUN, ATMACA ve AKINCI tek fiziksel ürün;
SİPER bir aile ve aynı adla dört ayrı nesne anlatılıyor: füze, sistem, kanister,
atıcı. Raporun Bölüm 1'i tam olarak bunu uyarıyor — füze menzili ile sistem önleme
menzili, füze uzunluğu ile kanister boyutu aynı nesnede toplanamaz.

Zorlanırsa iki somut hata çıkıyor:

**Sahte ıraksama.** Ürün-1'in `range_km` alanına ROKETSAN'ın `≥ 100` (füze menzili),
ASELSAN'ın `≥ 70` (sistem önleme menzili) ve MSB'nin `100` (sistem menzili) kayıtları
birlikte girerse, üçü de `scope: beyan` taşıdığı için `comparability()` bunları
kıyaslanabilir sayar ve tablo "aynı alanda ayrışan değerler" der. Ayrışan şey değer
değil, nesne. Bu, projenin düzeltmek için kurulduğu hatanın arayüzümüzde üretilmiş
hali.

**Yanlış halka.** `components/range-scale/geometry.ts` kuralı yazmış: halka bir
yarıçap iddiasıdır, "buradan her yöne şu kadar" der. Hava savunma sisteminde bu
cümleyi karşılayan sayı `sistem_azami_onleme_menzili`; füze menzili ise AKINCI'nın
`operational_range_km`'i ile aynı kategori. Bugünkü `components/range-envelope/rings.ts`
yalnız `insansiz-hava-araci` kategorisini eliyor ve `variant.specs.range_km` okuyor,
yani nesne ekseni olmadan halkayı füze menzilinden çizer.

Üçüncü gerekçe tekrar zinciri. Erteleme sebebi `lib/cards/source-chain.ts` başında
yazılı: şema eksikliği değil, **veri eksikliği**. Yayındaki üç dosyada 31 ölçüm ve 10
kaynak var; en büyük küme bir belgeden dokuz değer, yani zincir hep ters yönde. Hiçbir
iddia birden fazla yayıncı tarafından taşınmıyor. Rapor yakınsamayı ilk kez getiriyor:
bir paylaşım, altı yayıncı, denetlenmiş. CLAUDE.md §3'ün "geldiğinde ölçüme değil
kaynağa eklenecek" notu artık yazılabilir.

## What Changes

**Nesne ekseni**

- Ölçüme `object` alanı eklenir: değerin hangi nesneyi tarif ettiği. SİPER'de `fuze`,
  `sistem`, `atici`; ileride `kanister`.
- `COMPARISON_AXES` üçüncü ekseni alır. Yayındaki üç dosyada alan hiç dolmayacağı
  için gerileme yok: `comparability()` iki taraf da boşsa ekseni atlar, davranış
  birebir aynı kalır.
- `object` ile `scope` dik eksenlerdir ve birbirinin yerine geçmez: `scope` değerin
  NASIL elde edildiğini, `object` NEYİ ölçtüğünü söyler.
- Sistem düzeyi ölçü alanları eklenir: önleme menzili, önleme irtifası, yanca
  kapsama, izleme/angajman/güdüm kapasiteleri, atıcı taşıma kapasitesi.
- `divergence.ts` birim tablosuna `adet` ve `derece` boyutları girer. Kapasiteler
  gerçekten ıraksayabilir (K23'ün kaynaksız tablosu aynı sayıları veriyor) ve
  kıyaslanabilir olmalı.

**Köken kaydı**

- Sistem dosyasına köken kaydı eklenir: bir belgenin kimliği ve o belgeyi taşıyan
  yayınların listesi. Ölçüm ve takvim olayı kökeni kimlikle işaret eder.
- Sayaç alanı yok; sayı listeden türer. Kayıt yoksa "bilinmiyor" demektir. Boş liste
  "tekrar bulunmadı" iddiası olurdu ve rapor bunu açıkça reddediyor.
- Aynı yayıncının kendi ikinci yazısı ayrı işaretlenir. K22 → K23 tekrarı DefenceTurk'ün
  kendi devam yazısı; bağımsız dolaşım değil.
- Kayıt, bizim alıntıladığımız yayına değil **kökene** bağlanır. Örnekte alıntıladığımız
  AA haberi altı tekrardan biri; orijinal paylaşım doğrudan okunamadığı için onu
  gösteriyoruz.

**Menzil halkası**

- Halkayı hangi alanın çizdiği açık kurala bağlanır. Yarıçap iddiası taşımayan alan
  halka çizmez; mesafe cetveline düşer.
- Hava savunma sisteminde halka sistem önleme menzilinden çizilir, füze menzilinden
  çizilmez.
- Zarfın dikey bileşeni (önleme irtifası) düz dairede kaybolduğu için lejant bunu
  söyler.
- §5.9 sınırı değişmez: yer adı taşıyan altlık etkileşimli haritada kalır, üretilmiş
  görsele girmez.

**Şema ve içerik**

- Kategori enumuna `hava-savunma-sistemi` eklenir. `CATEGORY_COVERAGE` ve
  `CATEGORY_KIND` exhaustive olduğu için ikisi derlemede zorlanır; `rings.ts` tek
  sessiz yol olduğundan açık kurala bağlanır.
- **BREAKING** — `manufacturer` tekil nesne olmaktan çıkar, diziye döner. SİPER
  ASELSAN, ROKETSAN ve TÜBİTAK SAGE ortaklığı; birini seçmek uydurma olurdu. Üç
  yayındaki dosya birer satır göç eder.
- Takvim olayına `date_kind` (`event` | `announcement`) ve opsiyonel `announced_at`
  eklenir. Raporun her satırında olay tarihi ile duyuru tarihi ayrık; bugünkü tek
  `date` alanı bu ayrımı taşıyamıyor. Varsayılan `event`, yayındaki dosyalar değişmez.
- ASELSAN'ın belge geneli ±%10 toleransı `uncertainty` alanına YAZILMAZ. İki sebep:
  şema `uncertainty`'yi açık uçlu operatörle reddediyor, yani `≥ 70 ± %10` yazılamaz;
  ve `360° ± %10` anlamsız bir sonuç verir. Rapor da "eşikler toleransla yeniden
  hesaplanmadı" diyor. Not `context_note` alanına düşer.

**Kapsam dışı bırakılanlar**

- Kanister ölçüleri bu turda girmez. Rapor eksen adlarını bilmiyor; `6450` sayısını
  `length_m` yazmak kaynağın söylemediğini iddia etmek olurdu. `_todo` kaydı düşer.
- SİPER-A ve SİPER-4 varyant değil, `attributes.variant_names` kaydıdır. Tek bilgi ad.
- Varyant başına `status` bu turda eklenmez. Aile `seri-uretim` taşır.
- "Bir iddia, N yayın" paylaşım kartı bu turda üretilmez. Köken kaydı onu mümkün
  kılar; kart ayrı kapsam.
- `content/systems/siper.json` ve `docs/research/siper-sources.md` bu değişikliğin
  uygulama adımında yazılır, planlama adımında değil.

## Capabilities

### New Capabilities

- `measurement-object-scope`: Bir ölçümün hangi nesneyi tarif ettiğinin kayda
  geçmesi ve iki değer kıyaslanmadan önce bu eksenin sorulması. Nesne ile kapsamın
  ayrılması, bileşik sistemlerde alan çakışmasının önlenmesi, eksen boşken gerileme
  üretmemesi.
- `source-repeat-chain`: Bir belgenin kaç yayında tekrarlandığının ve hepsinin tek
  kökene dayandığının kayda geçmesi. Kökenin tekrardan ayrılması, sayacın listeden
  türemesi, aynı yayıncı tekrarının işaretlenmesi, uydurulmuş sayının imkânsızlığı.
- `range-envelope`: Menzil halkasının hangi alandan çizildiği ve hangi durumda hiç
  çizilmediği. Yarıçap iddiası ölçütü, hava savunmasında alan seçimi, dikey bileşenin
  kaydı, üretilmiş görsel sınırı.

### Modified Capabilities

Yok. `openspec/specs/` altındaki üç yetenek (`system-geometry`, `system-silhouette`,
`model-provenance`) gereksinim düzeyinde değişmiyor. SİPER'in füze varyantları
mevcut "yeni ürün eklenir" senaryosunun içinde kalıyor: bir ürün tanımı ve bir kayıt
satırı.

## Impact

**Şema**

- `lib/schema.ts` — `object` ekseni, sistem düzeyi ölçü alanları, köken kaydı,
  `manufacturer` dizisi, `date_kind` ve `announced_at`, kategori enumu
- `lib/measurement/divergence.ts` — `COMPARISON_AXES` üçüncü eksen, `UNITS` tablosuna
  `adet` ve `derece` boyutları
- `lib/format.ts` — `SPEC_UNITS` yeni alanlar, etiket tablosu

**Geometri**

- `lib/geometry/coverage.ts`, `lib/geometry/measurements.ts` — yeni kategori satırı
  (ikisi de exhaustive, satır yazılmazsa derleme düşer)
- `lib/geometry/siper.ts`, `lib/geometry/registry.ts` — füze varyantları için ürün
  tanımı ve kayıt satırı

**Halka**

- `components/range-envelope/rings.ts` — alan seçimi kurala bağlanır, kategori
  kontrolü yerine yarıçap iddiası ölçütü
- `messages/tr.json`, `messages/en.json` — lejantta dikey bileşen notu

**İçerik**

- `content/systems/tayfun.json`, `atmaca.json`, `akinci.json` — yalnız `manufacturer`
  göçü
- `content/assets.json` — raporun Bölüm 7'si `rejected` dizisine düşer; açık lisanslı
  SİPER görseli bulunamadı ve bu bir kayıt

**Doğrulama**

- `scripts/validate-content.ts` — köken kimliği gerçekten tanımlı mı, halka çizen
  alan yarıçap iddiası taşıyor mu
- `lib/measurement/divergence.test.ts`, `lib/messages.test.ts` — sözleşme testleri
