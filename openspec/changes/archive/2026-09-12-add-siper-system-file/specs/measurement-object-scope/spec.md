## Purpose

Bir ölçümün hangi nesneyi tarif ettiğinin kayda geçmesini ve iki değer kıyaslanmadan
önce bu eksenin sorulmasını tanımlar. Bileşik sistemlerde aynı ad farklı nesneleri
anlatır: füze menzili ile sistem önleme menzili, füze uzunluğu ile kanister boyutu.
Kapsam: nesne beyanının zorunluluğu, nesne ile kapsamın ayrılması, kıyas kararına
etkisi ve beyan bulunmayan kayıtlarda davranışın korunması.

## ADDED Requirements

### Requirement: Bileşik sistemde ölçüm tarif ettiği nesneyi beyan eder

Birden fazla fiziksel nesneyi bir arada anlatan bir dosyada, her sayısal kayıt hangi
nesneyi tarif ettiğini beyan etmelidir (MUST). Beyan bulunmayan bir kayıt varsayılan
olarak dosyanın ana nesnesine atanmamalıdır (MUST NOT); atama sessiz olurdu ve
okuyucu yanlış nesnenin ölçüsünü görürdü.

Nesne adları kapalı bir kümedir. Kümede karşılığı olmayan bir ad içerik doğrulamasını
düşürmelidir (MUST).

#### Scenario: Aynı alan adı iki nesneyi anlatıyor

- **WHEN** bir dosyada hem füzenin menzili hem sistemin önleme menzili kayıtlı
- **THEN** iki kayıt ayrı nesne beyanı taşır ve tabloda ayrı satır olarak okunur

#### Scenario: Tanımsız nesne adı

- **WHEN** bir kayıt kapalı kümede bulunmayan bir nesne adı taşır
- **THEN** içerik doğrulaması bunu reddeder ve dosya derlemeye girmez

### Requirement: Nesne ile kapsam dik eksenlerdir

Nesne beyanı ile kapsam beyanı birbirinin yerine geçmemelidir (MUST NOT). Kapsam
değerin NASIL elde edildiğini söyler (beyan, test, ölçüm, tahmin); nesne NEYİ
ölçtüğünü söyler. Bir değer aynı anda hem bir test kaydı hem de sisteme ait olabilir.

#### Scenario: Aynı kapsam, farklı nesne

- **WHEN** iki değer de üreticinin kendi beyanı, biri füzeyi öteki sistemi tarif
  ediyor
- **THEN** kapsamları aynı olduğu halde nesneleri ayrıştığı için kıyaslanmazlar

#### Scenario: Aynı nesne, farklı kapsam

- **WHEN** bir sistemin önleme menzili hem kataloğda beyan edilmiş hem bir testte
  bildirilmiş
- **THEN** nesneleri aynı olduğu halde kapsamları ayrıştığı için kıyaslanmazlar

### Requirement: Nesnesi ayrışan iki değer kıyaslanmaz

İki ölçümün nesne beyanı iki tarafta da dolu ve farklıysa, değerler aralık hesabına
hiç girmemelidir (MUST NOT). Sonuç bir çelişki ya da uyuşma değil, kapsam farkı
olarak gösterilmelidir.

#### Scenario: Füze menzili ile sistem önleme menzili

- **WHEN** bir varyantta füze menzili `≥ 100 km`, sistem önleme menzili `≥ 70 km`
  kayıtlı
- **THEN** bu ikisi için ıraksama hesabı çalışmaz ve arayüz "aynı alanda ayrışan
  değerler" demez

#### Scenario: Ana sayfa paneli

- **WHEN** ana sayfa işaretçisi yalnızca nesne farkından doğan bir ayrışmayı
  gösteriyor
- **THEN** derleme düşer, çünkü işaretlenen alan gerçekten ıraksamıyor

### Requirement: Beyan tek taraflıysa kıyas yapılmaz

Nesne beyanı bir ölçümde bulunup ötekinde bulunmuyorsa, sonuç kapsam farkı değil
belirsizlik olmalıdır (MUST). Tek taraflı bilgi bir fark değildir; kıyaslamaya
kalkmak çelişki uydurmak olurdu.

#### Scenario: Yeni kayıt eski kayıtla yan yana

- **WHEN** bir alanda biri nesne beyanı taşıyan, öteki taşımayan iki kayıt bulunuyor
- **THEN** çift belirsiz olarak işaretlenir ve aralık hesabına girmez

### Requirement: Beyansız dosyalarda davranış korunur

Hiçbir kaydında nesne beyanı bulunmayan bir dosyanın kıyas sonuçları, bu eksen
eklenmeden önceki sonuçlarla aynı kalmalıdır (MUST). Tek nesneli dosyalar için eksen
görünmez olmalıdır.

#### Scenario: Tek ürünlü dosya

- **WHEN** bir dosyadaki hiçbir kayıt nesne beyanı taşımıyor
- **THEN** her çiftte eksen iki tarafta da boştur, atlanır ve ıraksama sonuçları
  değişmez

### Requirement: Nesne düzeyi ölçü alanları kendi anlamını taşır

Bir nesnenin ölçü alanı, başka bir nesnenin alanıyla aynı adı taşımamalıdır
(MUST NOT). Alan adı hangi niceliği ölçtüğünü söylemeli; nesne beyanı hangi nesneye
ait olduğunu.

#### Scenario: Sistem kapasiteleri

- **WHEN** bir sistem için izleme, angajman ve güdülebilen füze kapasiteleri kayda
  giriyor
- **THEN** her biri kendi alan adını alır ve üçü tek bir "kapasite" alanında
  toplanmaz

#### Scenario: Ekseni bilinmeyen boyut

- **WHEN** bir kaynak üç boyut veriyor ama hangisinin uzunluk olduğunu söylemiyor
- **THEN** değerler uzunluk alanına yazılmaz; eksik bilgi açık kayda geçer ve alan
  boş kalır
