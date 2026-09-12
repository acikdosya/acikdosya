## MODIFIED Requirements

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

## ADDED Requirements

### Requirement: Sayım izdüşüm sınavından bağımsızdır

Bir yüzey grubundaki parça adedi, görselin ortografik olup olmadığından bağımsız
olarak okunabilmelidir (MUST). Sayımın gerekçesi oran gerekçesinden ayrı
yazılmalıdır; izdüşüm sınavı düşmüş bir çizimden de sayım alınabilir.

#### Scenario: Sınavı düşen çizimden sayım

- **WHEN** bir çizim dış uyum sınavını geçemiyor ama üzerinde dört yüzey açıkça
  sayılabiliyorsa
- **THEN** sayım kayda alınır ve kendi gerekçesini taşır; aynı çizimden alınan
  oranlar ölçülmüş sayılmaz
