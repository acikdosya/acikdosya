## Why

3B katmanı iki ürün tipiyle kuruldu: eksenel gövde (füze) ve tek kuyruklu uçak. Üçüncü
bir tip eklemek bugün dokuz ayrı yere dokunmayı gerektiriyor ve iki kadraj hesabının
elle tutarlı kalmasına bel bağlıyor. Asıl sınır ürün sayısı değil **topoloji**:
oranlar ölçekleniyor, parça listesi ölçeklenmiyor. `AircraftProfile` yirmi bir alanla
tek bir kuyruk düzenini anlatıyor; TB2'nin çift kirişli ters V kuyruğu, ANKA'nın V
kuyruğu ya da bir jetin çift kanat ucu dikey yüzeyi bu alanlarla ifade edilemiyor.

İkinci gerekçe AKINCI'nın kendisi. Üreticinin yayımladığı ön görünüş 11.09.2026'da
ölçüldüğünde kanat, kanat ucu kıvrımı ve yatay stabilize mevcut profili doğruladı,
ama gövde kesitinin dairesel olmadığı ve modelde hiç bulunmayan dört parça olduğu
görüldü. Aynı ölçüm, yöntemde bir açık da gösterdi: render perspektif, dolayısıyla
dikey oranlar piksel cetveliyle doğrudan okunamıyor.

Üçüncüsü tutarsızlık. `components/scale-silhouette/aircraft-geometry.ts` uçak konturu
çizmeyi açıkça reddediyor, `lib/geometry/aircraft.ts` ise tam kontur çiziyor. İkisi
de savunulabilir, ama fark yazılı değil ve ayrımın tek gerçek sebebi 3B'nin köken
kaydı olan bir profil dosyası alması, 2B'nin hiç almaması.

Dördüncüsü §3 ile çelişki. Sayfadaki her sayı güven rozeti taşıyor; modelin biçimini
belirleyen yirmi dört oranın hiçbiri taşımıyor. Model, verinin kendisi kadar
yetkili görünüyor ama kökenini söylemiyor.

## What Changes

**Geometri katmanı**

- Parça kiti eklenir: `lathe-body`, `panel`, `pod`, `disc`, `strut`, `wheel`, `boom`.
  Her ürün bir **parça listesi** ve bir **oran tablosu** olarak tanımlanır.
- Ürün kaydı tek dosyaya iner. Yeni sistem eklemek dokuz dosya yerine bir dosya ve
  bir kayıt satırı olur.
- **BREAKING** — `systemKind()` bilinmeyen kategori için artık `'missile'` dönmez.
  Tanımsız kategori model üretmez; bu §9'un "varsayılan geometriyle çizme" kuralının
  tip düzeyindeki karşılığıdır.
- **BREAKING** — `ModelDimensions` sözleşmesi `{L, R, reach}` olmaktan çıkar. `R`
  gövde yarıçapı demek ve eksensiz bir üründe anlamı yok. Yerine sınır kutusu ve
  adlandırılmış tutamak çerçevesi gelir.
- **BREAKING** — Etiket konumu `{t, angle}` silindirik kutupsal olmaktan çıkar,
  `{part, t}` olur. Bugün AKINCI `annotations: []` taşıyor çünkü kutupsal çerçeve
  kanat ucunu gösteremiyor. `content/systems/tayfun.json` etiketleri taşınır.
- `buildModel` ve `modelBounds` ikili dağıtımı tek kayıt tablosuna iner; sınırlar
  parça listesinden türetilir, elle yazılmaz.

**2B ve 3B birleşimi**

- Silüet, aynı parça listesinin ortografik izdüşümü olur. Tek kaynak, iki çıktı;
  ayrışma imkânsızlaşır.
- **BREAKING** — Uçak silüeti kesikli sınır kutusu olmaktan çıkıp gerçek kontura
  döner. `aircraft-geometry.ts` başındaki ret gerekçesi geçerliliğini yitirir,
  çünkü artık köken kaydı taşıyan bir profilden türüyor.
- İzdüşüm ekseni bir parametre olur; ön, yan ve üst görünüş aynı işlevden çıkar.

**Köken kaydı**

- Oran tipi `{value, basis: 'measured' | 'chosen', note, source_url?}` olur.
  `lib/geometry/akinci.ts` içindeki OLCULEN/SECILEN düzyazı ayrımı tipe taşınır.
- Model bölümü, biçimin nereden geldiğini `spec-table`'ın sayıları gösterdiği
  görsel dille gösterir. Rozet desenleri §4'teki üç durumu tekrar etmez; bu bir
  güven seviyesi değil, köken beyanıdır ve kendi iki durumu vardır.
- Perspektif kontrolü yöntemin parçası olur: bir render'dan oran okunmadan önce
  izdüşümün ortografik olduğu bilinen bir ölçüyle sınanır. AKINCI'da dikey
  ölçüler yan görünüşten gelmeye devam eder.

**AKINCI modeli**

- Gövde kesiti eliptik olur. Ölçülen 1,13 m en ve ~1,45 m boy dairesel bir lathe ile
  ifade edilemiyor.
- Motor gondolu ve pervane modellenir.
- İniş takımı modellenir.
- Yük istasyonları **çıplak pilon** olarak modellenir; taşınan mühimmat
  modellenmez. Gerekçe kayda geçer: `content/systems/akinci.json` hiçbir mühimmat
  için ölçü kaydı taşımıyor, dolayısıyla şekil yalnız render'dan gelirdi (§5.7) ve
  yüklü pilon teknik dosya değil silahlı sistem okunuşu verir (§5.4).
- `ModelViewer` ön görünüş ön ayarı kazanır.
- **BREAKING** — `ModelViewer.noteAircraft` yeniden yazılır. Mevcut metin motor,
  pervane, iniş takımı ve yük istasyonlarının modellenmediğini söylüyor; üçü artık
  modelleniyor. İniş takımı geldiği için modelin dikey ölçüsü ile tablodaki 4,1 m
  arasındaki ilişki de yeniden anlatılır.

## Capabilities

### New Capabilities

- `system-geometry`: Bir sistemin 3B biçiminin içerik verisinden ve ürün
  profilinden nasıl türetildiği. Parça kiti, topoloji kaydı, varsayılan geometri
  yasağı, sınır ve tutamak çerçevesi, etiket konumlandırma.
- `system-silhouette`: 2B ölçek şemasının aynı parça listesinden ortografik
  izdüşümle üretilmesi. İzdüşüm ekseni, ölçek paylaşımı, insan figürü, ölçü
  çizgileri.
- `model-provenance`: Modelin biçimini belirleyen her oranın kökenini taşıması ve
  okuyucuya gösterilmesi. Ölçülen ile seçilen ayrımı, perspektif kontrolü, köken
  rozetinin güven rozetinden ayrı olması.

### Modified Capabilities

Yok. `openspec/specs/` altında henüz yayımlanmış yetenek bulunmuyor.

## Impact

**Yeniden yazılan**

- `lib/geometry/result.ts` — sözleşme değişiyor
- `lib/geometry/model.ts` — ikili dağıtım kayda iner
- `lib/geometry/selection.ts` — profil kaydı parça listesi kaydına dönüşür
- `lib/geometry/measurements.ts` — `systemKind` varsayılanı kalkar
- `lib/geometry/aircraft.ts`, `lib/geometry/missile.ts` — parça kitine taşınır
- `lib/geometry/akinci.ts`, `lib/geometry/atmaca.ts` — oran tablosu tipi değişir
- `components/scale-silhouette/geometry.ts`, `aircraft-geometry.ts` — izdüşüme iner

**Etkilenen**

- `lib/schema.ts` — `annotationSchema` alan değişimi, kategori kaydı
- `content/systems/tayfun.json` — etiket taşıması
- `content/systems/akinci.json` — pilon ölçüleri ve mühimmat verisi için `_todo`
- `components/model-viewer/ModelViewer.tsx` — kadraj, ön görünüş ön ayarı
- `components/model-viewer/ModelSection.tsx` — köken kaydı bölümü
- `messages/tr.json`, `messages/en.json` — `noteAircraft` yeniden yazımı, köken
  metinleri
- `scripts/bake-glb.mjs` — parça listesinden pişirme
- `lib/geometry/aircraft.test.ts`, `measurements.test.ts`,
  `components/scale-silhouette/aircraft-geometry.test.ts` — sözleşme testleri

**Bütçe**

Parça sayısı AKINCI'da yaklaşık ikiye katlanıyor. §6'daki 3 MB GLB sınırı ve
mobil 48 segment kuralı korunur; pervane diski ve tekerlek segment sayıları ayrı
tutulur ki gövde çözünürlüğü onları taşımak zorunda kalmasın.
