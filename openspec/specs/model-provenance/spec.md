## Purpose

Modelin biçimini belirleyen her oranın kökenini taşımasını ve bu kökenin okuyucuya
gösterilmesini tanımlar. Sayfadaki her sayı güven seviyesiyle sunuluyorken biçimin
kökensiz kalması, modele sahip olmadığı bir yetki verir. Kapsam: ölçülen ile seçilen
ayrımı, sınanmamış okumanın kendi durumu, ölçüm yönteminin geçerlilik koşulu ve
kökenin sayfadaki görsel dili.

## Requirements

### Requirement: Her oran köken beyanı taşır

Modelin biçimini belirleyen her oran, kökenini belirten bir beyan taşımalıdır (MUST).
Beyan üç durumu ayırt etmelidir:

- **ölçülmüş**: yayımlanmış bir görselden okundu ve izdüşüm sınavı geçildi
- **okuma**: yayımlanmış bir görselden okundu, izdüşüm sınavı yapılmadı
- **seçilmiş**: görselden çıkarılamadı, okunabilir bir şema için seçildi

Köken beyanı olmayan oran modele girmemelidir (MUST NOT). Ortadaki durum kaynak
adresini ve görülme tarihini **ölçülmüş** ile aynı titizlikte taşımalıdır; bir
okumayı seçilmiş saymak kaynağı silerdi.

#### Scenario: Beyansız oran eklenir

- **WHEN** bir ürün tanımına köken beyanı olmayan bir oran yazılır
- **THEN** içerik doğrulaması bunu reddeder ve model üretilmez

#### Scenario: Üç durum bir arada

- **WHEN** bir üründe ölçülmüş, okunmuş ve seçilmiş oranlar birlikte bulunur
- **THEN** her oran kendi beyanını taşır ve üçü tek bir toplu ifadeye indirgenmez

### Requirement: Ölçülen oran yöntemini ve kaynağını kaydeder

Ölçülmüş ve okuma durumundaki her oran, hangi görselden ve hangi tarihte
çıkarıldığını kaydetmelidir (MUST). Kaynak görsel depoya alınmamalıdır (MUST NOT);
kaydedilen şey görüntü değil orandır.

#### Scenario: Oran kaydedilir

- **WHEN** bir oran üreticinin yayımladığı bir görselden ölçülür
- **THEN** kaynağın adresi ve görülme tarihi kayda geçer, görsel dosyası depoya
  eklenmez

#### Scenario: Kaynak erişilemez olur

- **WHEN** kaydedilen kaynak adresi çalışmaz hale gelir
- **THEN** oran ve kaydı olduğu gibi kalır; okuyucu değerin nereden geldiğini yine de
  görebilir

### Requirement: Perspektif kontrolü olmadan dikey oran ölçülmez

Bir okuma **ölçülmüş** sayılmadan önce iki ayrı koşul sınanmalıdır (MUST):

1. **İç tutarlılık** — görselin ortografik olduğu, bilinen bir ölçünün eksen
   boyunca sabit kaldığı gösterilerek sınanır.
2. **Dış uyum** — çizimin oranları, aynı nesnenin yayımlanmış ölçüleriyle
   karşılaştırılır. Çizilen incelik ile yayımlanan incelik uyuşmalıdır.

İkisi de geçilirse oran **ölçülmüş** sayılır. Sınav hiç yapılmadıysa değer
**okuma** olarak kaydedilir. Birinci koşul geçip ikincisi düşerse değer
**ölçülmüş sayılamaz** (MUST NOT) ve **okuma** olarak kalır: çizim kendi içinde
okunabilir, ama oranları yayımlanan ölçünün üzerine oturtulamaz. Birinci koşul
düşerse okuma **seçilmiş** olarak işaretlenir ve gerekçesi notunda durur.

Dış uyum düştüğünde uyuşmazlığın sayısal büyüklüğü kayda geçmelidir (MUST).
Çizimin neyi kapsadığı ile yayımlanan ölçünün neyi kapsadığı arasındaki fark,
çözülmeden bir yorumla kapatılmamalıdır (MUST NOT).

#### Scenario: Perspektif render

- **WHEN** bir görselde yakın ve uzak parçalar farklı ölçekle projeksiyona
  düşüyorsa
- **THEN** o görselden yalnızca kalibrasyon düzlemindeki oranlar ölçülmüş sayılır;
  başka derinlikteki okumalar seçilmiş olarak işaretlenir ve sınamanın sonucu kayda
  geçer

#### Scenario: Sınav hiç yapılmadı

- **WHEN** bir oran yayımlanmış bir görselden okunmuş ama izdüşüm sınavı hiç
  yapılmamışsa
- **THEN** kayıt okuma olarak durur; kaynak adresi ve görülme tarihi korunur,
  ölçülmüş rozeti verilmez

#### Scenario: Çizim ortografik ama yayımlanan ölçüyle uyuşmuyor

- **WHEN** bir çizimin gövde eni eksen boyunca sabit kalıyor ama çizilen
  uzunluk/çap oranı yayımlanan değerlerden belirgin biçimde ayrılıyorsa
- **THEN** oranlar ölçülmüş sayılmaz, okuma olarak kaydedilir ve uyuşmazlığın
  oranı hem oran notunda hem varlık kaydında yazılır

#### Scenario: Uyuşmazlık yorumla kapatılmak isteniyor

- **WHEN** çizimin yayımlanan ölçüden uzun görünmesi "çizim ayrılabilir bölümü de
  gösteriyor olmalı" diye açıklanır
- **THEN** bu açıklama doğrulanmadan oranlar ölçülmüş sayılmaz; olasılık içerik
  dosyasında açık soru olarak kaydedilir

#### Scenario: Aynı kameradan iki kare

- **WHEN** aynı çevrimsel gösterinin iki karesi birbiriyle tutarlı çıkar
- **THEN** bu tutarlılık ortografiklik kanıtı sayılmaz; iki kare aynı kamerayı
  paylaşır

### Requirement: Köken sayfada gösterilir

Modelin biçimini belirleyen oranların kökeni sayfada okuyucuya gösterilmelidir (MUST).
Gösterim, ölçü tablosunun görsel diliyle aynı aileden olmalı, ama güven rozetiyle
karıştırılmamalıdır.

#### Scenario: Okuyucu biçimin kaynağını sorar

- **WHEN** okuyucu model bölümünü açar
- **THEN** hangi oranların ölçüldüğü, hangilerinin sınanmamış okuma olduğu ve
  hangilerinin seçildiği sayfada görünür

#### Scenario: Köken rozeti güven rozeti değildir

- **WHEN** köken gösterimi çizilir
- **THEN** §4'teki üç güven durumuna dördüncü bir varyant eklenmez ve köken kendi
  ayrı görsel diliyle gösterilir

### Requirement: Köken beyanı renkten bağımsız okunur

Köken gösterimi yalnızca renkle ayrışmamalıdır (MUST NOT). Ayrım desen veya metinle de
taşınmalıdır.

#### Scenario: Siyah beyaz çıktı

- **WHEN** sayfa renksiz yazdırılır
- **THEN** ölçülen, okuma ve seçilen ayrımı hâlâ okunabilir
### Requirement: Sayım izdüşüm sınavından bağımsızdır

Bir yüzey grubundaki parça adedi, görselin ortografik olup olmadığından bağımsız
olarak okunabilmelidir (MUST). Sayımın gerekçesi oran gerekçesinden ayrı
yazılmalıdır; izdüşüm sınavı düşmüş bir çizimden de sayım alınabilir.

#### Scenario: Sınavı düşen çizimden sayım

- **WHEN** bir çizim dış uyum sınavını geçemiyor ama üzerinde dört yüzey açıkça
  sayılabiliyorsa
- **THEN** sayım kayda alınır ve kendi gerekçesini taşır; aynı çizimden alınan
  oranlar ölçülmüş sayılmaz
