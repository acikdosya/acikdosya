## Purpose

İki boyutlu ölçek şemasının, üç boyutlu modelle aynı biçim tanımından ortografik
izdüşümle üretilmesini tanımlar. Kapsam: hangi durumda kontur çizilir, hangi durumda
yalnız ölçü zarfı çizilir, izdüşüm ekseni nasıl seçilir ve ölçek nasıl paylaşılır.

## Requirements

### Requirement: Silüet ile model tek kaynaktan türer

İki boyutlu şema ve üç boyutlu model aynı parça listesinden ve aynı oran tablosundan
türetilmelidir (MUST). İki katman için ayrı biçim tanımı tutulmamalıdır (MUST NOT).

#### Scenario: Oran tablosu değişir

- **WHEN** bir ürünün oran tablosunda bir değer güncellenir
- **THEN** hem üç boyutlu model hem iki boyutlu şema aynı anda değişir ve ikisi
  arasında elle eşitleme gerekmez

#### Scenario: Parça eklenir

- **WHEN** ürün tanımına yeni bir dış parça eklenir
- **THEN** parça iki boyutlu şemada da ilgili izdüşümde görünür

### Requirement: İzdüşüm ekseni seçilebilir

İki boyutlu şema, biçim tanımının seçilen bir eksene ortografik izdüşümü olmalıdır
(MUST). Ön, yan ve üst görünüş aynı tanımdan, eksen değiştirilerek elde
edilebilmelidir. İzdüşüm perspektif içermemelidir (MUST NOT).

#### Scenario: Ön görünüş istenir

- **WHEN** ön görünüş ekseni seçilir
- **THEN** çizim kanat açıklığını ve dikey uzanımı gerçek oranlarıyla verir, uzunluk
  yönünde kısalma uygulanmaz

#### Scenario: Üç boyutlu sahnede ön görünüş

- **WHEN** okuyucu sahnede ön görünüş ön ayarını seçer
- **THEN** kamera aynı ekseni kullanır ve iki katman aynı siluete bakar

### Requirement: Profili olmayan sistem kontur almaz

Kontur, yalnızca köken kaydı taşıyan bir oran tablosu bulunan ürünler için
çizilmelidir (MUST). Böyle bir tablosu olmayan sistemde kontur çizilmemeli (MUST NOT),
bunun yerine kesikli ölçü zarfı çizilmelidir.

#### Scenario: Oran tablosu yok

- **WHEN** yalnızca uzunluk ve çap gibi toplam ölçüleri bilinen, dış profili
  tanımlanmamış bir sistem açılır
- **THEN** şema kesikli sınır kutusu çizer ve bunun bir dış hat olmadığını söyler

#### Scenario: Ölçü zarfı bir biçim iddiası değildir

- **WHEN** kesikli zarf çizilir
- **THEN** zarfın kenarları ölçü çizgileriyle adlandırılır ve hiçbir kenar gövde
  konturu olarak sunulmaz

### Requirement: Tüm çizim tek ölçek çarpanı paylaşır

Bir şemadaki bütün varyantlar, bütün görünüşler ve insan figürü tek bir ölçek
çarpanıyla çizilmelidir (MUST). Eksen başına ayrı ölçek uygulanmamalıdır (MUST NOT).

#### Scenario: Birden fazla varyant

- **WHEN** bir sistemin iki varyantı aynı şemada gösterilir
- **THEN** ikisi aynı çarpanla çizilir ve aralarındaki boyut farkı gözle okunabilir

#### Scenario: İnsan figürü

- **WHEN** şema çizilir
- **THEN** 1,8 m insan figürü aynı çarpanla çizilir ve ölçek referansı olarak durur

### Requirement: Şema paylaşım görselini de besler

Paylaşım görselleri ve ikonlar aynı biçim tanımından üretilmelidir (MUST). Paylaşım
için ayrı, elle çizilmiş bir varlık tutulmamalıdır (MUST NOT).

#### Scenario: Paylaşım görseli üretilir

- **WHEN** bir sistem sayfası için paylaşım görseli oluşturulur
- **THEN** görseldeki biçim sayfadaki şemayla aynı tanımdan gelir ve ölçek çarpanını
  onunla paylaşır
