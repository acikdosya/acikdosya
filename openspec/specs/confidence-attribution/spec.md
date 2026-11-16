# confidence-attribution Specification

## Purpose

Güven rozeti taşıyan her kaydın (ölçüm, özellik, takvim olayı) okuyucuya hangi
yayından okunduğunu söylemesini tanımlar. Rozet bir iddianın sahibini gösterir;
sahibi yazılmamış rozet, sahip olmadığımız bir kesinlik iddia eder. Kapsam: asgari
atıf alanları, "veri yok" durumunun rozetsiz çizilmesi, atfı düşen kaydın defterde
iz bırakması ve tarihin kaynağın hassasiyetini aşmaması.

## Requirements

### Requirement: Rozet taşıyan her kayıt kaynak adı taşır

Güven seviyesi taşıyan her kayıt — ölçüm, metinsel özellik ve takvim olayı —
okunan yayının iki dilli adını taşımalıdır (MUST). Kaynak adı olmayan kayıt
içerik doğrulamasından geçmemeli (MUST NOT) ve sayfaya çıkmamalıdır. Köken kimliği
(`origin_id`) kaynak adının yerine geçmez: köken aktarılan belgeyi, kaynak adı
bizim okuduğumuz yayını gösterir.

#### Scenario: Kaynaksız özellik

- **WHEN** bir sistem dosyasında TAYFUN `propellant` özelliği "Katı yakıt" değeri ve
  `official` güveniyle, kaynak adı olmadan yazılmış
- **THEN** içerik doğrulaması kaydı reddeder ve derleme düşer

#### Scenario: Kaynaksız takvim olayı

- **WHEN** bir takvim olayı güven seviyesi taşıyor ama kaynak adı taşımıyor
- **THEN** içerik doğrulaması olayı reddeder

#### Scenario: Yalnız köken kimliği yazılmış

- **WHEN** bir takvim olayı `origin_id` taşıyor ama kaynak adı taşımıyor
- **THEN** içerik doğrulaması olayı reddeder

#### Scenario: Kaynaklı dosyalar etkilenmez

- **WHEN** ATMACA, AKINCI ve SİPER dosyaları kuraldan sonra doğrulanır
- **THEN** üçü de değişiklik yapılmadan doğrulamadan geçer

### Requirement: Özellik kaydı kontrol tarihi taşır

Metinsel özellik, ölçüm gibi, kaynağın en son kontrol edildiği günü (`verified_at`)
taşımalıdır (MUST). Tarih yalnızca kaynak gerçekten açılıp okunduğu gün
yazılmalıdır; kaynağa bakılmadan yazılan tarih uydurma sayılır (MUST NOT).

#### Scenario: Kontrol tarihi olmayan özellik

- **WHEN** bir özellik kaynak adı taşıyor ama `verified_at` taşımıyor
- **THEN** içerik doğrulaması kaydı reddeder

### Requirement: Veri yokluğu rozetle çizilmez

Bir alan için değer bulunmadığında ya da kaynak değerin açıklanmadığını
söylediğinde alan dosyaya yazılmamalıdır (MUST NOT). "Açıklanmadı", "bilinmiyor"
gibi bir yokluk ifadesi değer olarak, güven rozetiyle birlikte çizilmemelidir.
Tablo o hücreyi rozetsiz, soluk bir tire ve ekran okuyucu metniyle çizmelidir
(MUST).

#### Scenario: Değeri açıklanmamış varyant özelliği

- **WHEN** TAYFUN BLOK-4 için güdüm özelliği dosyada yazılı değil, TAYFUN için yazılı
- **THEN** tablonun güdüm satırında BLOK-4 hücresi tire ve "veri yok" ekran okuyucu
  metniyle çizilir, güven rozeti çizilmez

#### Scenario: Hiçbir varyantta bulunmayan özellik

- **WHEN** bir özellik dosyanın hiçbir varyantında yazılı değil
- **THEN** tabloda o özelliğin satırı çizilmez

### Requirement: Atfı değişen yayımlanmış kayıt defterde iz bırakır

Yayımlanmış bir özellik ya da takvim olayı kaldırıldığında, güven seviyesi
değiştiğinde ya da tarihi değiştiğinde düzeltme defterine bir kayıt düşülmelidir
(MUST). Kayıt eski ve yeni hali güven niteleyicisiyle birlikte yazmalıdır. Yeni
düzeltme kayıtları defterin sonuna eklenmelidir (MUST); mevcut kayıtların sırası
değişmemelidir, çünkü dolaşımdaki düzeltme kartlarının adresi o sıradır.

#### Scenario: Güveni düşürülen özellik

- **WHEN** TAYFUN `propellant` kaydı kaynağı bulunduğu için `official` yerine
  `press` güveniyle yazılıyor
- **THEN** düzeltme defterinde alanı "propellant", eski hali "Katı yakıt (resmî)",
  yeni hali "Katı yakıt (basın)" olan bir kayıt bulunur

#### Scenario: Kaldırılan özellik

- **WHEN** kaynağı bulunamayan bir özellik dosyadan çıkarılıyor
- **THEN** düzeltme defterinde o alan için yeni hali "kaldırıldı" olan bir kayıt
  bulunur ve gerekçesi kaynağın bulunamadığını söyler

#### Scenario: Mevcut kart adresleri korunur

- **WHEN** TAYFUN defterine yeni düzeltme kayıtları eklenmeden önce birinci sıradaki
  düzeltme kartı paylaşılmış
- **THEN** ekleme sonrasında aynı kart adresi aynı düzeltmeyi gösterir

### Requirement: Defter alan adı okuyucunun dilinde çizilir

Düzeltme defteri ve düzeltme kartı, düzeltilen alanın adını okuyucunun dilinde
çizmelidir (MUST). Ölçüm ve özellik anahtarlarının yanında takvim (`timeline`) ve
kaynak (`source`) bölüm anahtarları da çeviri paketinden okunmalıdır; bilinmeyen
serbest metin alan adı kaydın yazdığı gibi kalır.

#### Scenario: Takvim düzeltmesi

- **WHEN** alanı `timeline` olan bir düzeltme kaydı Türkçe sayfada çiziliyor
- **THEN** alan adı ham anahtar yerine çeviri paketindeki Türkçe bölüm adıyla yazılır

#### Scenario: Mevcut kaynak düzeltmesi

- **WHEN** TAYFUN'un 2026-09-11 tarihli, alanı `source` olan kaydı İngilizce sayfada
  çiziliyor
- **THEN** alan adı İngilizce çeviri paketinden okunur

### Requirement: Takvim tarihi kaynağın hassasiyetini aşmaz

Takvim olayının tarihi, kaynağın verdiği hassasiyetten daha ince yazılmamalıdır
(MUST NOT). Kaynak yalnız ayı veriyorsa tarih ay hassasiyetinde yazılmalı ve sayfada
gün çizilmemelidir.

#### Scenario: Ay hassasiyetinde kaynak

- **WHEN** bir takvim olayının kaynağı yalnız ayı ve yılı veriyor
- **THEN** olay tarihi yıl-ay biçiminde yazılır ve takvimde gün olmadan çizilir

#### Scenario: Kaynağa dayanmayan gün

- **WHEN** bir olayın günü hiçbir kaynakta geçmiyor ama dosyada gün hassasiyetiyle
  yazılmış (TAYFUN'un "1 Temmuz 2025" tarihli BLOK-4 duyurusu gibi)
- **THEN** gün ya kaynağı bulunarak doğrulanır ya da tarih kaynağın hassasiyetine
  indirilir; her iki durumda da düzeltme defterine kayıt düşülür
