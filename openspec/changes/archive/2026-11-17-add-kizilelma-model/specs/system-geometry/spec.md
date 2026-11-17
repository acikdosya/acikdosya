## MODIFIED Requirements

### Requirement: Biçim parça listesi ve oran tablosu olarak tanımlanır

Bir ürünün dış biçimi, sonlu bir parça kümesinden seçilmiş parçaların listesi ve bu
parçaların ölçüye göre oranları olarak tanımlanmalıdır (MUST). Parça listesi, tek bir
kuyruk veya kanat düzeniyle sınırlanmamalıdır (MUST NOT); çift kirişli, V kuyruklu ve
çok yüzeyli düzenler aynı tanımla ifade edilebilmelidir.

Tanım, eksen boyunca **birden fazla yüzey grubu** taşıyabilmelidir (MUST): arka
kanat, kontrol yüzeyi ve gövde ortası kanat aynı üründe birlikte bulunabilir ve
grup sayısı sabit bir üst sınıra bağlanmamalıdır (MUST NOT).

Gövde **tek çapla sınırlanmamalıdır** (MUST NOT). Bir bölümü ötekinden kalın olan
gövdeler — ayrılabilir itici taşıyan füzeler gibi — kademe ve geçiş bölgesiyle
birlikte aynı tanımla ifade edilebilmelidir.

Gövde **tek kesit biçimiyle de sınırlanmamalıdır** (MUST NOT). Kesiti eksen boyunca
biçim değiştiren gövde — köşeli bir burundan yuvarlak bir lüleye geçen gibi — anahtar
kesitler ve aralarındaki geçişle aynı tanımdan türetilmelidir (MUST). Geçiş, kesitin
köşesini yuvarlamamalıdır (MUST NOT): köşe, kesitin taşıdığı bilgidir. Üç boyutlu
model, iki boyutlu şema ve sınır kutusu aynı geçişi okumalıdır (MUST).

#### Scenario: Farklı kuyruk topolojisi

- **WHEN** çift kirişli ve V kuyruklu bir hava aracı için ürün tanımı yazılır
- **THEN** tanım mevcut parça kümesiyle ifade edilebilir ve geometri katmanında yeni
  bir tip dalı açılması gerekmez

#### Scenario: Yeni ürün eklenir

- **WHEN** yeni bir sistem için parça listesi ve oran tablosu yazılır
- **THEN** sistemin modellenmesi için tek bir ürün tanımı ve tek bir kayıt girdisi
  yeterlidir; kadraj, sınır ve etiket çerçevesi bu tanımdan türetilir

#### Scenario: Üç yüzey grubu

- **WHEN** bir üründe arka kanat, kontrol yüzeyi ve gövde ortası kanat birlikte
  bulunur
- **THEN** üçü de aynı oran tablosunda tanımlanır ve her biri kendi adedi, veçhesi
  ve açıklığıyla çizilir

#### Scenario: Kademeli gövde

- **WHEN** bir ürünün arka bölümü ana gövdesinden kalınsa
- **THEN** iki çap ve aralarındaki geçiş aynı gövde tanımından türetilir; iki ayrı
  parça olarak elle birleştirilmez

#### Scenario: Bölümlü burun

- **WHEN** burun, ayrı bir radom bölümü taşıyorsa
- **THEN** bölüm sınırı oran tablosunda bir istasyon olarak durur ve ortografik
  izdüşümde de görünür

#### Scenario: Kesiti biçim değiştiren gövde

- **WHEN** bir gövdenin burnu köşeli, arka ucu yuvarlak kesit taşıyor
- **THEN** iki kesit anahtar olarak tanımlanır, aradaki istasyonlar onların geçişidir;
  köşe geçiş boyunca köşe olarak kalır ve model ile şema aynı kesitleri çizer

#### Scenario: Geçersiz anahtar kesit

- **WHEN** anahtar kesitler farklı nokta sayısı taşıyor ya da gövde hem tek profil
  hem anahtar kesit tanımlıyor
- **THEN** parça listesi kurulmaz ve hata hangi kuralın bozulduğunu söyler
