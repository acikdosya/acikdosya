## Purpose

Menzil halkasının hangi alandan çizildiğini, hangi durumda hiç çizilmediğini ve
çizilmeyen bileşenin nasıl kayda geçtiğini tanımlar. Halka bir yarıçap iddiasıdır:
"buradan her yöne şu kadar" der. Kapsam: alan seçimi ölçütü, hava savunmasında doğru
alan, dikey bileşenin kaydı, halkanın üretilmiş görsele girmemesi.

## Requirements

### Requirement: Halka yalnız yarıçap iddiası taşıyan alandan çizilir

Bir menzil değeri, ancak "bu noktadan her yöne bu mesafe" anlamına geliyorsa harita
üzerinde halka olarak çizilmelidir (MUST). Üreticinin kendi terimi bu anlama
geldiği ayrıca gösterilmedikçe halkaya çevrilmemelidir (MUST NOT).

Ölçütü karşılamayan değer gizlenmemeli, mesafe cetveli olarak çizilmelidir.

#### Scenario: Görev yarıçapı olduğu doğrulanmamış değer

- **WHEN** bir sistemin menzil alanı üreticinin kendi terimi ve yarıçap olarak
  yorumlandığına dair kayıt yok
- **THEN** harita üzerinde halka çizilmez, değer mesafe cetvelinde gösterilir

#### Scenario: Ölçütü karşılayan değer

- **WHEN** bir alan ateşleme veya konuşlanma noktasından her yöne geçerli bir mesafe
  beyan ediyor
- **THEN** halka bu alandan çizilir ve jeodezik yöntemle hesaplanır

### Requirement: Halkayı çizen alan içerikte belirlidir

Halkayı hangi alanın çizdiği kategori kontrolüne bırakılmamalıdır (MUST NOT). Yeni bir
kategori eklendiğinde halka varsayılan olarak çizilmeye başlamamalıdır; alan seçimi
açık bir kayıttan gelmelidir (MUST).

#### Scenario: Yeni kategori eklenir

- **WHEN** içerik şemasına yeni bir sistem kategorisi girer ve halka alanı
  belirtilmez
- **THEN** halka çizilmez ve eksik kayıt doğrulamada görünür

### Requirement: Hava savunma sisteminde halka sistem önleme menzilinden çizilir

Bir hava savunma sisteminde halka, sistemin önleme menzilinden çizilmelidir (MUST).
Füzenin kendi menzili halka olarak çizilmemelidir (MUST NOT): füze menzili tek yön
uçuş erişimidir, sistemin her yöne geçerli angajman yarıçapı değildir.

#### Scenario: İki menzil değeri bir arada

- **WHEN** bir varyantta hem füze menzili hem sistem önleme menzili kayıtlı
- **THEN** halka sistem önleme menzilinden çizilir ve füze menzili tabloda kalır

#### Scenario: Önleme menzili kayıtlı değil

- **WHEN** bir hava savunma sisteminde yalnız füze menzili kayıtlı
- **THEN** halka çizilmez ve sebebi okuyucuya yazılır

### Requirement: Zarfın çizilmeyen bileşeni yazılır

Çizilen halka zarfın tamamını göstermiyorsa, gösterilmeyen bileşen okuyucuya
söylenmelidir (MUST). Düz bir daire yalnız yatay uzanımı verir; irtifa bileşeni
kayıtlıysa halkanın onu taşımadığı belirtilmelidir.

#### Scenario: Önleme irtifası kayıtlı

- **WHEN** bir sistemin hem önleme menzili hem önleme irtifası kayıtlı
- **THEN** harita açıklaması halkanın irtifayı göstermediğini yazar ve irtifa değeri
  tabloda bulunur

### Requirement: Her halka kendi güven durumunu taşır

Halkalar, dayandıkları kaydın güven durumunu sayfanın geri kalanıyla aynı görsel
dille taşımalıdır (MUST). Resmî teyidi olmayan değerler gizlenmemeli, kapalı
başlamalıdır.

#### Scenario: Tahmin kaydından halka

- **WHEN** bir menzil değeri bağımsız bir değerlendirmeden geliyor
- **THEN** halkası tahmin durumunu gösterir ve varsayılan olarak kapalı başlar

#### Scenario: Ayrışan iki beyan

- **WHEN** aynı nesne için iki farklı menzil beyanı kayıtlı
- **THEN** iki halka da çizilir ve biri seçilip öteki gizlenmez

### Requirement: Halka üretilmiş görsele girmez

Menzil halkası ve altındaki yer adı taşıyan altlık, paylaşım görselleri ve kartlar
gibi üretilmiş görsellere konmamalıdır (MUST NOT). Etkileşimli harita yer adlarını
taşıyabilir; sınır üretilmiş görselde çizilir.

#### Scenario: Paylaşım görseli isteniyor

- **WHEN** bir sistemin paylaşım görseli üretiliyor ve dosyada menzil halkası var
- **THEN** görsele harita kesiti konmaz; gerekiyorsa siluete ya da veri satırına
  çevrilir

### Requirement: Referans nokta okuyucunun seçimidir ve kaydedilmez

Halkanın merkezi okuyucu tarafından taşınabilmelidir (MUST). Seçilen konum ölçüm
verisine, olay kaydına veya sunucu günlüğüne yazılmamalıdır (MUST NOT).

Hiçbir referans nokta hedef, koruma alanı veya ulaşılabilir yer olarak
adlandırılmamalıdır (MUST NOT).

#### Scenario: Okuyucu noktayı taşıyor

- **WHEN** okuyucu referans noktasını harita üzerinde sürükler
- **THEN** halkalar yeniden çizilir ve seçilen konum hiçbir yerde saklanmaz

#### Scenario: Halkanın geçtiği yer adlandırılıyor

- **WHEN** bir metin halkanın hangi yerleşimlerin üzerinden geçtiğini söylemek
  istiyor
- **THEN** böyle bir ifade yazılmaz; halka yalnız mesafe anlatır
