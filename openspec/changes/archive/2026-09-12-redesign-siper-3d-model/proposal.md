## Why

SİPER dosyası yayına girdiğinde modelin bütün oranları `chosen` idi: elimizde
ortografik bir kaynak yok sayılmıştı. **Bu yanlıştı.** ROKETSAN'ın ürün broşürü
her iki varyant için ayrı ayrı çizgi görünüşü taşıyor ve bu görünüşler ölçülebilir.

Çizimler 12.09.2026'da incelendi ve iki şey ortaya çıktı.

**Birincisi, iki varyant aynı biçimde değil.** Model bugün ikisini tek bir oran
tablosuyla çiziyor ve bu, elimizdeki kanıtla çelişiyor:

```
URUN-1   [ayrilabilir itici + 4 buyuk arka kanat] -> gecis konisi
         -> 4 kucuk kontrol yuzeyi -> govde -> 4 orta kanat -> ogive burun

URUN-2   4 buyuk ok acili arka kanat -> govde boyunca uzanan 4 strake
         -> silindirik govde -> ayri radom bolumu

BUGUN    tek oran tablosu; iki varyant da ayni cizilyor, burun orani 0,16
```

Burun oranı çizimlerde 0,29 ve 0,09 ölçüldü. Yani tek tablo ikisinden de uzak ve
Ürün-1'in ayrılabilir iticisi modelde hiç yok.

**İkincisi, izdüşüm sınavı iki varyantta farklı sonuç veriyor.** Gövde eni eksen
boyunca ölçüldü ve her iki çizim de kendi içinde ortografik çıktı; sonra çizilen
incelik yayımlanan ölçülerle karşılaştırıldı:

| | gövde eni sapması | çizilen L/D | yayımlanan L/D | uyum |
|---|---|---|---|---|
| Ürün-2 | %0,5 | 15,58 | 15,00 | %3,9 — **geçer** |
| Ürün-1 | %0,0 | 20,30 | 14,59 | %39 — **geçmez** |

Ürün-2'nin çizimi yayımlanan uzunluk ve çapla uyuşuyor; oranları `measured`
olabilir. Ürün-1'in çizimi kendi içinde tutarlı ama katalog uzunluğuyla
uyuşmuyor. En olası açıklama çizimin ayrılabilir iticiyi de göstermesi, 5,4 m'nin
ise onu saymaması — ama bunu kaynaktan doğrulayamıyoruz. Doğrulanmadan çizimin
oranlarını 5,4 m üzerine oturtmak her parçayı yanlış yere koyar. Ürün-1 bu yüzden
`reading` kalır ve fark açık kayda geçer.

Üçüncü gerekçe mimari. Ürün kaydı bugün **sistem slug'ına** bağlı
(`productFor(system.slug)`), yani bir sistemin bütün varyantları tek bir dış
biçimi paylaşmak zorunda. TAYFUN'da bu doğruydu; SİPER'de değil.

## What Changes

**Ürün kaydı varyant düzeyine iner**

- **BREAKING** — `productFor` sistem slug'ı yerine sistem + varyant çifti alır.
  Varyantı olmayan bir kayıt sisteme düşebilir, ama düşüş SESSİZ olmaz: kayıt
  hangi anahtarla bulunduğunu söyler.
- `partsForSystem` aynı çifti taşır; siluet, GLB pişirici ve içerik doğrulaması
  aynı seçimi görür.
- Varyantı tanımsız bir sistem için model üretilmez. Varsayılana düşme yasağı
  (§9) varyant düzeyinde de geçerlidir.

**Parça kiti ve eksenel ürün**

- Eksenel ürün **ikiden fazla yüzey grubu** alır. Bugün kuyruk kanatçığı ve tek
  bir gövde ortası grup var; Ürün-1'de üç grup gerekiyor (arka kanat, kontrol
  yüzeyi, orta kanat).
- Gövde **kademeli çap** alır: itici bölümü ana gövdeden kalın ve aralarında bir
  geçiş konisi var. Bugünkü gövde tek çaplı.
- Burun **bölümlenebilir** olur: Ürün-2'de radom ayrı bir bölüm olarak çiziliyor.

**SİPER ürün tanımları**

- `lib/geometry/siper-urun-1.ts` ve `lib/geometry/siper-urun-2.ts` yazılır.
  Bugünkü `lib/geometry/siper.ts` kaldırılır.
- Ürün-2 oranları `measured`: izdüşüm sınavı sonucu her oranın yanında durur.
- Ürün-1 oranları `reading`: kaynak ve tarih `measured` ile aynı titizlikte
  tutulur, eksik olan tek şey sınavın geçilmesi.
- Yarıçap oranları Ürün-1'de `chosen` kalır — uzunluk tanımı çözülmeden
  açıklık/yarıçap oranı çizimden alınamaz.
- Sayımlar (kanat adedi) izdüşümden bağımsızdır ve kendi gerekçesini taşır.

**Kayıt**

- `content/assets.json` iki referans kaydı alır: çizimler görüldü, repoya
  girmedi, izdüşüm sınavının sayısal sonucu notta yazılı.
- `content/systems/siper.json` `_todo` kaydı alır: 5,4 m'nin iticiyi kapsayıp
  kapsamadığı bilinmiyor.
- Broşürdeki hedef tipi ve harp başlığı alanları alınmaz (§5.2, §5.3); bu da
  varlık kaydında yazılı olur.

**Kapsam dışı**

- Atıcı araç, kanister, radar ve komuta unsurları modellenmez. Ölçü kaydımız yok.
- Model etiketleri (annotations) bu turda yazılmaz; ayrı karar.
- Ürün-1'in uzunluk belirsizliği çözülmeye çalışılmaz — yeni kaynak arama işi
  bu değişikliğin konusu değil, kaydı tutulur.

## Capabilities

### New Capabilities

- `variant-geometry`: Bir sistemin varyantlarının ayrı dış biçim taşıyabilmesi.
  Ürün kaydının varyant düzeyinde çözülmesi, varyant tanımsızken davranış,
  sisteme düşüşün görünür olması.

### Modified Capabilities

- `system-geometry`: Biçim tanımının tek bir gövde çapı ve en fazla iki yüzey
  grubuyla sınırlı olmaması; kademeli gövde ve ikiden fazla grup aynı kitle
  ifade edilebilmeli.
- `model-provenance`: İzdüşüm sınavının iki ayrı koşulu ayrı ayrı kaydetmesi —
  çizimin kendi içinde ortografik olması ile çizimin yayımlanan ölçülerle
  uyuşması. Birincisi geçip ikincisi düşerse oran `measured` sayılamaz.

## Impact

**Geometri**

- `lib/geometry/registry.ts` — anahtar sistem+varyant çiftine döner
- `lib/geometry/parts-for.ts`, `lib/geometry/measurements.ts` — çifti taşır
- `lib/geometry/axial.ts` — çoklu yüzey grubu, kademeli gövde, bölümlü burun
- `lib/geometry/siper.ts` — kaldırılır
- `lib/geometry/siper-urun-1.ts`, `lib/geometry/siper-urun-2.ts` — yeni
- `lib/geometry/coverage.ts` — değişmez, kategori zaten `modelled`

**Tüketiciler**

- `components/scale-silhouette/`, `components/model-viewer/` — ürün çözümü
- `scripts/bake-glb.mjs` — varyant başına GLB adı zaten varyant taşıyor
- `scripts/validate-content.ts` — etiket parça kontrolü çifti kullanır

**İçerik**

- `content/assets.json` — iki referans kaydı
- `content/systems/siper.json` — `_todo` kaydı

**Sınama**

- `lib/geometry/registry.test.ts` — kayıt sözleşmesi
- `components/model-provenance/ModelProvenance.test.ts` — oran etiketleri
- Yeni: varyant başına parça listesi üretilebiliyor mu
