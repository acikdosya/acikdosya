## Context

Gerekçe için bkz. `proposal.md` — Why.

### Ölçümün kendisi

Kaynak: ROKETSAN SİPER ürün broşürü, 300 dpi'a çevrilip beyaz çizgi maskesiyle
ayrıştırıldı. 12.09.2026'da görüldü; dosya depoya alınmadı.

Ürün-1 çizimi 1015 × 119 px, Ürün-2 çizimi 1075 × 174 px. Eksen soldan sağa:
sol uç arka, sağ uç burun.

```
URUN-1  (x = eksen boyunca oran, 0 = arka, 1 = burun ucu)
 0.00 ---- 0.13   4 buyuk arka kanat, zarf 118 px, govde 50 px
 0.13 ---- 0.18   gecis konisi (itici -> ana govde)
 0.19 ---- 0.23   4 kucuk kontrol yuzeyi, zarf 87 px
 0.25 ---- 0.40   duz govde
 0.41 ---- 0.52   4 orta kanat, zarf 86 px
 0.54 ---- 0.855  duz govde
 0.855 --- 1.00   ogive burun

URUN-2
 0.00 ---- 0.06   4 buyuk ok acili arka kanat, zarf 158 px, govde 69 px
 0.08 ---- 0.14   duz govde
 0.16 ---- 0.52   4 strake, zarf 95 px
 0.54 ---- 0.81   duz govde
 0.836 --- 1.00   radom bolumu + burun
```

### İzdüşüm sınavının iki ayrı sonucu

Gövde eni kanatsız bölgelerde eksen boyunca ölçüldü:

| | gövde eni | sapma | çizilen L/D | yayımlanan L/D | oran |
|---|---|---|---|---|---|
| Ürün-1 | 50,0 px | %0,0 | 20,30 | 14,59 | 1,391 |
| Ürün-2 | 69,0 px | %0,5 | 15,58 | 15,00 | 1,039 |

İki çizim de **kendi içinde** ortografik: gövde eni eksen boyunca sabit, ATMACA'da
kabul edilen %1,4 ölçütünün çok altında. Ayrım dış uyumda: Ürün-2 yayımlanan
ölçülerle %3,9 içinde uyuşuyor, Ürün-1 %39 sapıyor.

%39 bir çizim hatası olamayacak kadar büyük. En olası açıklama, çizimin
ayrılabilir iticiyi de göstermesi ve katalogdaki 5,4 m'nin onu saymaması —
çizimdeki itici bölümü kabaca bu farkı kapatacak uzunlukta. **Ama bu bir yorum.**
Doğrulanmadan kabul edilirse bütün istasyonlar yanlış yere oturur.

### Kod tarafındaki sınırlar

- `productFor(slug)` sistem slug'ı alıyor; bir sistemin bütün varyantları aynı
  biçimi paylaşmak zorunda.
- `axialProduct` bir kuyruk kanatçığı grubu ve **en fazla bir** gövde ortası grup
  alıyor (`ratios` + `wings`). Ürün-1 üç grup istiyor.
- Gövde tek çaplı kuruluyor: burun, omuz, boattail. Kademe yok.

## Goals / Non-Goals

**Goals:**

- İki varyant kendi çizimine benzesin; hangisinin hangi oranı nereden aldığı
  sayfada tek tek okunabilsin.
- Ürün-2'nin oranları `measured` olsun ve sınavın sayısal sonucu her oranın
  yanında dursun.
- Ürün-1'in oranları `reading` kalsın; %39'luk uyuşmazlık hem oran notunda hem
  varlık kaydında hem içerik `_todo`'sunda yazılı olsun.
- Yayındaki üç sistemin modelleri bit düzeyinde değişmesin.

**Non-Goals:**

- Fotogerçekçilik. Şematik dil korunur: mat yüzey, ince kontur, ölçü çizgisi.
- Ürün-1'in uzunluk belirsizliğini çözmek. Yeni kaynak aranmaz, kayıt tutulur.
- Atıcı araç, kanister, radar, komuta unsuru. Ölçü kaydı yok.
- Model etiketleri. Ayrı karar, ayrı tur.
- Oranları "daha iyi görünsün" diye ayarlamak. Okunabilirlik gerekçesi yalnız
  `chosen` oranlarda geçerli ve o zaman da notunda yazar.

## Decisions

### 1. Ürün kaydı sistem+varyant çifti alır, düşüş görünür kalır

Kayıt anahtarı `"<sistem>/<varyant>"` olur; çözüm önce bu anahtarı, bulamazsa
sistem slug'ını dener. Fonksiyon **hangi anahtarla bulduğunu da döndürür**, yani
sisteme düşmek mümkün ama sessiz değil.

Alternatif — kaydı tamamen varyant düzeyine indirmek: reddedildi. TAYFUN'un iki
varyantı gerçekten aynı biçimi paylaşıyor ve aynı tabloyu iki kez yazmak, iki
kopyanın ayrışmasına izin verirdi.

Alternatif — ürün tanımına "hangi varyantlar" listesi koymak: reddedildi. Kayıt
iki yönlü olurdu ve bir varyantın iki tanım tarafından sahiplenilmesi mümkün
hale gelirdi.

### 2. Yüzey grupları sabit yuva değil, liste olur

`ratios` + `wings` ikilisi yerine adlandırılmış grupların listesi gelir. Her grup
kendi adedini, kök/uç veçhesini, açıklığını, kalınlığını, firar kenarı
istasyonunu ve ok açısını taşır.

Sebep sadece Ürün-1 değil: ikili yapı zaten "gövde ortası" ve "kuyruk" diye iki
role bağlıydı ve bir kontrol yüzeyi hangisine yazılacağı belirsizdi. Liste bu
soruyu ortadan kaldırıyor — grup nerede duruyorsa odur.

Parça kimlikleri grup adından türer (`fin-aft-1`, `fin-control-1`,
`strake-1`). Kimlikler etiket çerçevesinin adresi olduğu için grup adı oran
tablosunda yazılı durur, koddan üretilmez.

### 3. Gövde istasyon listesine döner

Tek çap yerine eksen boyunca `{t, radiusRatio}` istasyonları. Burun ve boattail
bu listenin uçları olur; kademe, aradaki iki istasyondur.

Bu, `parts.ts` içindeki `LatheSpec`'in zaten yapabildiği şey — eksik olan
`axialProduct`'ın onu tek çapla kurması. Yani parça kiti değişmiyor, eksenel
ürünün gövdeyi kurma biçimi değişiyor.

Ürün-2'nin radom bölümü de aynı mekanizma: burun eğrisi üzerinde bir istasyon
sınırı, ayrı parça değil.

### 4. Ürün-2 `measured`, Ürün-1 `reading`

Sınavın iki koşulu ayrı ayrı kaydedilir (specs/model-provenance). Ürün-2'de
ikisi de geçiyor, oranlar `measured` ve `projection_check` metni iki sayıyı
birlikte yazar: gövde eni sapması %0,5 ve L/D uyumu %3,9.

Ürün-1'de birinci koşul geçiyor, ikincisi düşüyor. Oranlar `reading`; kaynak
adresi ve görülme tarihi `measured` ile aynı titizlikte tutulur.

Alternatif — Ürün-1 oranlarını `chosen` yapmak: reddedildi. `chosen` "görselden
çıkarılamadı" demek; oysa çıkarıldı, yalnızca yayımlanan ölçüye oturtulamıyor.
Kaynağı silmek okumayı okunabilirlik tercihi gibi gösterirdi.

Alternatif — %39'u iticiyle açıklayıp Ürün-1'i de `measured` yapmak: reddedildi.
Açıklama makul ama doğrulanmamış; spec bunu açıkça yasaklıyor.

### 5. Ürün-1'in bütün oranları `reading` — `chosen` ayrımı yok

Bu karar ölçüm sırasında **düzeltildi**. İlk hâli yarıçap oranlarının `chosen`
kalmasını istiyordu; gerekçesi "açıklık oranı uzunluk ölçeğiyle çap ölçeğinin
aynı olduğunu varsayar" idi ve bu yanlıştı.

Çizim anizotropik ölçekliyse, yani gerçeği `(sx·X, sy·Y)` diye çiziyorsa,
kullandığımız oranların hepsi **aynı eksende** iki uzunluğun oranıdır ve ölçek
sadeleşir:

```
chordRatio = (sx*veche)/(sx*L)    = veche/L
trailingT  = (sx*yer)/(sx*L)      = yer/L
spanRatio  = (sy*aciklik)/(sy*R)  = aciklik/R
```

Açıklık oranı tamamen radyal bir okumadır; uzunluk ölçeğiyle ilgisi yoktur.
`chosen` "görselden çıkarılamadı" demek, oysa çıkarıldı: Ürün-1'in üç grubunda
açıklık 2,36R, 1,74R ve 1,72R olarak ölçülüyor. Onu `chosen` yazmak kaynağı
silmek olurdu.

Gerçek belirsizlik başka yerde ve iki açıklaması var. Ya çizim düzgün biçimde
ince çizilmiş bir tanıtım illüstrasyonu — o zaman bütün oranlar geçerli. Ya da
çizim yayımlanan 5,4 m'den farklı bir uzanımı gösteriyor — o zaman boyuna
oranlar 5,4 m üzerine oturmaz. İkisi veriden ayırt edilemiyor ve itici
hipotezi sayıyla da tutmuyor:

| 5,4 m neyi ölçüyor sayılırsa | çizilen L/D | yayımlanan 14,59'a sapma |
|---|---|---|
| çizimin tamamı | 20,30 | %39 |
| geçiş konisinin önü | 16,71 | %14 |
| arka kanadın önü | 17,11 | %17 |

Hiçbiri oturmuyor. Bu yüzden Ürün-1'in **bütün** oranları `reading`: hepsi
gerçekten okundu, hiçbiri sınavın ikinci koşulunu geçemedi. İkisini ayrı kola
koymak okuyucuya olmayan bir ayrım anlatırdı. Not metni belirsizliğin ne
olduğunu ve iki açıklamanın da doğrulanmadığını yazar.

### 6. Sayım ayrı gerekçe taşır

Kanat adedi izdüşümden bağımsızdır ve Ürün-1'de de okunur: çizimde arka, kontrol
ve orta gruplarda dörder yüzey sayılıyor. Sayımın gerekçesi oran gerekçesinden
ayrı bir metin olur (ATMACA'daki `COUNT_CHECK` deseni).

### 7. Modellenmeyen parçalar sayfada yazılır

Ürün-1'in iticisi modellenir — çizimde var ve boyuna oranı okunabiliyor. Ama
iticinin ayrılabilir olduğu bilgisi modelin kendisinden anlaşılmaz; sayfadaki
açıklama bunu söyler. Atıcı, kanister ve radar modellenmez ve bu da aynı yerde
yazar.

### 8. Aşamalar

1. Kayıt anahtarı sistem+varyant çiftine döner. Yayındaki üç sistem sisteme
   düşer ve modelleri değişmez; düşüşün görünür olduğunu test sabitler.
2. Yüzey grupları listeye döner. TAYFUN, ATMACA ve AKINCI aynı parçaları
   üretmeye devam eder — dönüşüm mekanik.
3. Gövde istasyon listesine döner. Yine üç üründe çıktı değişmez.
4. Ürün-1 ve Ürün-2 tanımları yazılır, oranlar çizimden çıkarılır.
5. Varlık kaydı ve `_todo` yazılır; eski `lib/geometry/siper.ts` kaldırılır.

Sıra önemli: ilk üç adımın her biri "yayındaki modeller değişmedi" testiyle tek
başına doğrulanabilir. Yeni ürün tanımları en sonda gelir ki bir gerileme
çıkarsa hangi adımdan geldiği belli olsun.

## Risks / Trade-offs

**Ürün-1'in %39'u başka bir sebepten olabilir** → İtici yorumu doğrulanmadı;
çizim başka bir konfigürasyonu gösteriyor da olabilir. Azaltma: yorum hiçbir
sayıya çevrilmiyor, oranlar `reading` kalıyor ve belirsizlik üç yerde birden
yazılı.

**Yüzey grubu listesi üç ürünü de yeniden yazdırıyor** → TAYFUN, ATMACA ve
AKINCI'nın oran tabloları yapı değiştiriyor. Azaltma: dönüşüm mekanik ve her
adımda "üretilen parça listesi aynı" testi koşuyor.

**Kademeli gövde kadrajı bozabilir** → Sınır kutusu parça listesinden türüyor,
ama en geniş yer artık gövde ortası değil arka bölüm olabilir. Azaltma: kadraj
zaten sınırlardan hesaplanıyor; test en geniş parçanın çerçevede kaldığını
sınar.

**Model daha ayrıntılı, bütçe artıyor** → Ürün-1'de üç yüzey grubu ve kademeli
gövde, bugünkü 11 KB GLB'yi büyütür. Azaltma: §6'daki 3 MB sınırı çok uzak;
segment bütçesi parça sınıfı başına ayrı kalır.

**Ürün-2'nin strake'leri uzun ve ince** → Açıklığı küçük, veçhesi gövdenin
yarısı kadar bir yüzey, düşük çözünürlükte kırpılabilir. Azaltma: panel parçası
veçhe boyunca istasyon alıyor; strake ayrı bir grup, kendi segment sayısıyla.

## Migration Plan

- Adım 1–3 geriye dönük uyumlu: üç yayındaki ürünün ürettiği parça listesi
  değişmez ve testler bunu sabitler.
- `lib/geometry/siper.ts` adım 5'te kaldırılır; yerine iki varyant tanımı gelir.
  Ara sürüm tutulmaz — iki tanım birlikte bulunursa hangisinin çizdiği belirsiz
  kalırdı.
- Geri dönüş: adımlar bağımsız. Ürün tanımları geri alınırsa SİPER modelsiz
  kalır ve sayfa ölçek şemasına düşer; bu zaten tanımlı davranış.
- GLB dosyaları `pnpm bake:models` ile yeniden pişirilir. Ad şeması değişmiyor.

## Open Questions

- Ürün-1'in yayımlanan 5,4 m uzunluğu ayrılabilir iticiyi kapsıyor mu. Bu
  değişiklikte çözülmüyor; içerik dosyasında açık soru olarak duruyor ve
  çözülürse oranlar `reading`'den `measured`'a geçebilir.
- ASELSAN broşüründe de kullanılabilir bir görünüş var mı. Bu turda yalnız
  ROKETSAN çizimleri incelendi; ASELSAN belgesi sistem bileşenlerini gösteriyor
  ve füze dış hattı için ayrıca taranmadı.
- Ürün-2'nin radom bölüm sınırı bir malzeme/bölüm ayrımı mı yoksa yalnız çizim
  detayı mı. İstasyon olarak çiziliyor; anlamı iddia edilmiyor.
