## MODIFIED Requirements

### Requirement: Halka yalnız yarıçap iddiası taşıyan alandan çizilir

Bir menzil değeri, ancak "bu noktadan her yöne bu mesafe" anlamına geliyorsa harita
üzerinde halka olarak çizilmelidir (MUST). Üreticinin kendi terimi bu anlama
geldiği ayrıca gösterilmedikçe halkaya çevrilmemelidir (MUST NOT).

Yarıçap beyanı koşullarını yazmıyorsa — görev yarıçapının dayandığı yük, yedek yakıt
ve irtifa gibi — halkaya çevrilmemelidir (MUST NOT). Halka koşul taşıyamaz; koşullu
bir sayıyı her yöne koşulsuz geçerli bir mesafe olarak okutur.

Ölçütü karşılamayan değer gizlenmemeli, mesafe cetveli olarak çizilmelidir. Cetvel
değeri kaynağın yazdığı birimde ve sayıyla basmalıdır (MUST). Çubuk boyu ortak bir
uzunluk ölçeğine çevrilebilir, ama çevrilmiş sayı sayfaya basılmamalıdır (MUST NOT).

#### Scenario: Görev yarıçapı olduğu doğrulanmamış değer

- **WHEN** bir sistemin menzil alanı üreticinin kendi terimi ve yarıçap olarak
  yorumlandığına dair kayıt yok
- **THEN** harita üzerinde halka çizilmez, değer mesafe cetvelinde gösterilir

#### Scenario: Ölçütü karşılayan değer

- **WHEN** bir alan ateşleme veya konuşlanma noktasından her yöne geçerli bir mesafe
  beyan ediyor
- **THEN** halka bu alandan çizilir ve jeodezik yöntemle hesaplanır

#### Scenario: Görev profili yazılmamış görev yarıçapı

- **WHEN** KIZILELMA dosyasında 500 nm görev yarıçapı kayıtlı ve kaynak yük, yedek
  yakıt veya irtifa koşulunu yazmıyor
- **THEN** harita üzerinde halka çizilmez, değer mesafe cetvelinde gösterilir ve
  cetvelin altyazısı halkanın neden çizilmediğini görev profilinin yazılmamış
  olmasıyla açıklar

#### Scenario: Kaynak birimi kilometre değil

- **WHEN** cetvele giren bir değer deniz mili cinsinden kayıtlı (500 nm)
- **THEN** cetvel değeri "500 NM" olarak basar; çubuk boyu kilometre ölçeğinde
  çizilir ve sayfada kilometreye çevrilmiş bir sayı görünmez

#### Scenario: Halka kaydı yazılmamış

- **WHEN** bir dosyada kilometre ya da deniz mili cinsinden bir menzil veya yarıçap
  beyanı var ve dosya halka kaydı taşımıyor
- **THEN** içerik doğrulaması uyarı verir, hata vermez; halka çizilmez
