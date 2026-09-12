## Purpose

Bir belgenin kaç yayında tekrarlandığının ve hepsinin tek bir kökene dayandığının
kayda geçmesini tanımlar. Çok sayıda haber çok sayıda bağımsız teyit demek değildir;
ayrım yazılı olmadan veri olduğundan sağlam görünür. Kapsam: kökenin tekrardan
ayrılması, sayının listeden türemesi, kaydın yokluğunun ne demek olduğu ve tekrar
cümlesinin nerede kurulabileceği.

## Requirements

### Requirement: Tekrar kaydı kökene bağlanır

Tekrar bilgisi bir ölçümün üzerine yazılmamalıdır (MUST NOT); tekrarlanan şey iddia
değil belgedir. Kayıt, iddianın çıktığı köken belgeye bağlanmalı (MUST) ve ölçümler
ile takvim olayları kökeni kimlikle göstermelidir.

Aynı köken birden çok değeri besliyorsa tek bir kayıt tutulmalıdır; her değerin
altında ayrı bir tekrar listesi bulunmamalıdır (MUST NOT).

#### Scenario: Bir köken birden çok değeri besliyor

- **WHEN** bir açıklama hem bir menzil değerinin hem bir takvim olayının kökeni
- **THEN** ikisi de aynı köken kaydını gösterir ve tekrar listesi tek yerde durur

#### Scenario: Tekrar ölçüme yazılmak isteniyor

- **WHEN** bir ölçüm kaydına doğrudan tekrar sayısı yazılır
- **THEN** içerik doğrulaması bunu reddeder

### Requirement: Alıntılanan yayın kökenin yerine geçmez

Bir ölçümün kaynağı olarak gösterilen yayın, o iddianın kökeni olduğu doğrulanmadıkça
köken sayılmamalıdır (MUST NOT). Köken doğrudan okunamıyorsa bu durum kayda
geçmelidir; alıntıladığımız yayın kökenin kendisiymiş gibi sunulmamalıdır.

#### Scenario: Köken doğrudan okunamıyor

- **WHEN** bir açıklamanın özgün metnine erişilemiyor ve iddia yalnızca onu aktaran
  bir haberden okunabiliyor
- **THEN** köken kaydı açıklamayı gösterir, erişilemediğini belirtir, ölçümün kaynağı
  ise okunabilen haber kalır

#### Scenario: Alıntıladığımız yayın da bir tekrar

- **WHEN** kaynak gösterdiğimiz yayın, aynı kökeni taşıyan yayınlardan biri
- **THEN** tekrar listesi onu kökenin yerine koymaz ve kendisini ayrıca sayar

### Requirement: Tekrar sayısı listeden türer

Ayrı bir sayaç alanı tutulmamalıdır (MUST NOT). Tekrar sayısı, adlandırılmış yayın
kayıtlarının listesinden türetilmelidir (MUST). Adı yazılmamış bir tekrar sayıya
girmemelidir.

#### Scenario: Sayı ile liste ayrışıyor

- **WHEN** bir köken kaydında yazılı sayı ile listelenen yayın adedi farklı olurdu
- **THEN** böyle bir durum oluşamaz, çünkü sayı yalnızca listeden hesaplanır

#### Scenario: Yayın adı olmadan tekrar

- **WHEN** bir tekrarın yayıncısı bilinmiyor
- **THEN** kayıt listeye girmez ve sayıyı artırmaz

### Requirement: Kayıt yokluğu tekrar yokluğu değildir

Köken kaydı bulunmayan bir iddia için "tekrarlanmadı" denmemelidir (MUST NOT).
Kaydın yokluğu yalnızca bu taramada tekrar aranmadığını ya da bulunamadığını gösterir.

Boş bir tekrar listesi yazılamamalıdır (MUST NOT): sıfır tekrar bir iddiadır ve
denetlenmeden kurulamaz.

#### Scenario: Denetlenmemiş iddia

- **WHEN** bir değerin başka yayınlarda tekrarlanıp tekrarlanmadığı bilinmiyor
- **THEN** köken kaydı hiç yazılmaz ve arayüz o değer için tekrar cümlesi kurmaz

#### Scenario: Boş liste yazılmak isteniyor

- **WHEN** bir köken kaydına boş bir tekrar listesi yazılır
- **THEN** içerik doğrulaması bunu reddeder

### Requirement: Aynı yayıncının tekrarı ayrı işaretlenir

Bir yayıncının kendi önceki yazısını tekrar etmesi, bağımsız bir yayın gibi
sunulmamalıdır (MUST NOT). Kayıt bu durumu işaretlemeli (MUST) ve arayüz iki durumu
ayırt etmelidir.

#### Scenario: Yayıncı kendi yazısını tekrar ediyor

- **WHEN** bir tahmin, aynı sitenin sonraki bir yazısında yeniden yer alıyor
- **THEN** tekrar kaydı aynı yayıncı olduğunu belirtir ve bağımsız dolaşım sayılmaz

#### Scenario: Aynı yayının ikinci kopyası

- **WHEN** bir haberin hızlandırılmış sayfa kopyası veya güncellenmiş sürümü bulunuyor
- **THEN** bu ayrı bir tekrar kaydı değildir ve sayıyı artırmaz

### Requirement: Tekrar cümlesi yalnız kayıttan kurulur

"N yayın tek kaynağı tekrarlıyor" biçiminde bir ifade, yalnızca içerikte karşılığı
olan bir köken kaydı varsa kurulmalıdır (MUST). Bu kısıt sayfa, paylaşım görseli ve
sosyal medya metni için aynı şekilde geçerlidir.

Sayı, bu taramada denetlenmiş yayın kayıtlarının sayısıdır; dünya çapındaki toplam
olarak sunulmamalıdır (MUST NOT).

#### Scenario: Gönderi metni tekrar iddiası taşıyor

- **WHEN** bir paylaşım metni belirli sayıda yayının aynı kaynağı tekrarladığını
  söylüyor
- **THEN** bu sayı içerikteki köken kaydından gelir; kayıt yoksa cümle yayımlanmaz

#### Scenario: Toplam gibi sunulmak isteniyor

- **WHEN** denetlenmiş sayı "bu iddiayı taşıyan tüm yayınlar" diye sunulur
- **THEN** bu ifade kullanılmaz; sayının denetim kapsamı okuyucuya birlikte verilir
