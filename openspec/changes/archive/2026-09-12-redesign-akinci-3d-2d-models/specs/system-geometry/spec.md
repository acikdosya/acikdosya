## Purpose

Bir savunma sisteminin üç boyutlu şematik biçiminin yayımlanmış ölçü verisinden ve
ürüne özgü bir dış profilden nasıl türetildiğini tanımlar. Kapsam: hangi sistem için
model çizilir, biçim hangi kaynaktan gelir, hangi parçalar çizilmez ve okuyucu bunu
nereden öğrenir.

## ADDED Requirements

### Requirement: Model yalnızca ölçü verisinden ölçeklenir

Modelin ölçeği SADECE içerik dosyasındaki yayımlanmış ölçü alanlarından türetilmelidir
(MUST). Ölçü değiştiğinde biçim de değişmelidir. Hiçbir ölçü varsayılan bir değerle
doldurulmamalıdır.

#### Scenario: Yayımlanmış ölçü güncellenir

- **WHEN** bir sistemin uzunluk değeri içerik dosyasında değiştirilir
- **THEN** üretilen modelin boyu yeni değere göre değişir ve profil dosyasında hiçbir
  düzenleme gerekmez

#### Scenario: Gerekli ölçü alanı eksik

- **WHEN** bir varyant modelin ölçeği için gereken alanlardan birini taşımıyor
- **THEN** o varyant için model üretilmez ve eksik alan varsayılan bir sayıyla
  doldurulmaz

### Requirement: Dış profili tanımsız sistem çizilmez

Bir sistem için model, ancak o sisteme ait bir dış profil tanımlıysa üretilmelidir
(MUST). Tanımsız bir sistem başka bir sistemin profiliyle veya kategori düzeyinde bir
varsayılanla çizilmemelidir (MUST NOT).

#### Scenario: Profili olmayan sistem

- **WHEN** içerik dosyasında ölçüleri tam olan ama dış profili tanımlanmamış bir
  sistem açılır
- **THEN** model bölümü sahne kurmaz, ölçek şemasına düşer ve sebebi kayda geçer

#### Scenario: Tanınmayan kategori

- **WHEN** içerik dosyası, geometri kaydında karşılığı bulunmayan bir kategori taşır
- **THEN** sistem herhangi bir varsayılan geometri tipine atanmaz ve model üretilmez

### Requirement: Biçim parça listesi ve oran tablosu olarak tanımlanır

Bir ürünün dış biçimi, sonlu bir parça kümesinden seçilmiş parçaların listesi ve bu
parçaların ölçüye göre oranları olarak tanımlanmalıdır (MUST). Parça listesi, tek bir
kuyruk veya kanat düzeniyle sınırlanmamalıdır (MUST NOT); çift kirişli, V kuyruklu ve
çok yüzeyli düzenler aynı tanımla ifade edilebilmelidir.

#### Scenario: Farklı kuyruk topolojisi

- **WHEN** çift kirişli ve V kuyruklu bir hava aracı için ürün tanımı yazılır
- **THEN** tanım mevcut parça kümesiyle ifade edilebilir ve geometri katmanında yeni
  bir tip dalı açılması gerekmez

#### Scenario: Yeni ürün eklenir

- **WHEN** yeni bir sistem için parça listesi ve oran tablosu yazılır
- **THEN** sistemin modellenmesi için tek bir ürün tanımı ve tek bir kayıt girdisi
  yeterlidir; kadraj, sınır ve etiket çerçevesi bu tanımdan türetilir

### Requirement: Sınır ve kadraj parça listesinden türetilir

Modelin sınır kutusu ve kamera kadrajı parça listesinden türetilmelidir (MUST). Sahne
kurulmadan hesaplanan sınırlar ile kurulmuş modelin sınırları aynı tanımdan gelmeli,
iki ayrı elle yazılmış hesap tutulmamalıdır (MUST NOT).

#### Scenario: Kanat açıklığı gövdeden uzun

- **WHEN** kanat açıklığı gövde uzunluğundan büyük bir sistem genel görünümde açılır
- **THEN** kadraj kanat uçlarını da çerçeve içinde tutar ve hiçbir parça kesilmez

#### Scenario: Oran güncellenir

- **WHEN** bir ürünün oran tablosunda bir parçanın uzanımı değiştirilir
- **THEN** kadraj ve gölge düzlemi yeni sınırlara göre kendiliğinden güncellenir

### Requirement: Etiket bir parçaya bağlanır

Model etiketinin konumu, mutlak koordinat yerine bir parçaya ve o parça üzerindeki
orana göre tanımlanmalıdır (MUST). Ölçü verisi güncellendiğinde etiket kendiliğinden
doğru yerde kalmalıdır.

#### Scenario: Gövde dışındaki parça etiketlenir

- **WHEN** kanat ucu, dikey stabilize veya motor gondolu için etiket tanımlanır
- **THEN** etiket o parçanın üzerinde konumlanır ve gövde eksenine göre bir açı
  vermek gerekmez

#### Scenario: Ölçü değişince etiket

- **WHEN** sistemin uzunluğu veya kanat açıklığı güncellenir
- **THEN** etiketler bağlı oldukları parçalarla birlikte taşınır ve elle düzeltme
  gerekmez

### Requirement: Eşli yüzeyler gerçek ayna görüntüsüdür

Bir üründe çift olarak bulunan yüzeyler (iki kanat yarısı, iki yatay stabilize)
merkez düzlemde YANSITILARAK üretilmelidir (MUST). Karşı yüzeyi eksen etrafında
DÖNDÜREREK üretmek yasaktır (MUST NOT): dönüş açıklığı doğru yöne taşır ama yüzeyin
"yukarı" yönünü de ters çevirir.

Bir yüzeyde yukarı bakan her özellik, eşinde de yukarı bakmalıdır.

#### Scenario: Kanat ucu kıvrımı olan kanat

- **WHEN** bir kanadın ucu yukarı kıvrılıyorsa
- **THEN** karşı kanadın ucu da yukarı kıvrılır ve iki yükseliş birbirine eşittir

#### Scenario: Simetrinin gizli kaldığı hal

- **WHEN** yüzey düz bir plaka ve kesiti kalınlık yönünde simetrikse
- **THEN** döndürme ile yansıtma aynı sonucu verir; hata görünmez kalır ve ancak
  yüzeye kıvrım ya da simetrik olmayan bir kesit eklenince ortaya çıkar

#### Scenario: Açıklık yönü

- **WHEN** eşli iki yüzey üretilir
- **THEN** açıklık yönleri zıttır ve kök noktaları merkez düzleme göre simetriktir

### Requirement: Kesit ve iç görünüm üretilmez

Patlatılmış görünüm, kesit ve iç bileşen yerleşimi üretilmemelidir (MUST NOT).
Etiketleme yalnızca dış parçalar üzerinde yapılmalıdır.

#### Scenario: İç geometri istenir

- **WHEN** bir ürün tanımı iç bileşen konumu veya kesit düzlemi tarif eder
- **THEN** tanım kabul edilmez; iç geometriye dair kaynaklı veri bulunmadığı için
  böyle bir parça kümesi tanımlanamaz

### Requirement: Taşınan mühimmat modellenmez

Yük istasyonları taşıyıcı yapı olarak modellenebilir, ancak taşınan mühimmatın biçimi
modellenmemelidir (MUST NOT). Gerekçe iki katlıdır: mühimmat için içerik dosyasında
kaynaklı ölçü kaydı bulunmaz, ve yüklü istasyon teknik dosya tonunu silahlı sistem
sunumuna çevirir.

#### Scenario: Yük istasyonu taşıyan hava aracı

- **WHEN** üreticinin yayımladığı görselde pilonlar üzerinde mühimmat görünür
- **THEN** model yalnızca çıplak pilonları çizer, mühimmat şekli çizilmez

#### Scenario: Mühimmat ölçüsü eklenmek istenir

- **WHEN** bir mühimmatın biçimi yalnız bir render'dan çıkarılabiliyorsa
- **THEN** parça tanımlanmaz ve eksik kaynak içerik dosyasında kayda geçer

### Requirement: Modellenmeyen parçalar açıkça yazılır

Bir sistemde modellenmeyen dış parçalar bulunuyorsa, bunlar sayfada okuyucuya açıkça
söylenmelidir (MUST). Modelin yayımlanmış bir tablo değeriyle örtüşmediği durumlar da
aynı yerde anlatılmalıdır.

#### Scenario: Model tablodaki değeri karşılamıyor

- **WHEN** modelin dikey uzanımı içerik dosyasındaki yükseklik değerinden farklı
- **THEN** sayfa bu farkın sebebini yazar ve tablo değerini modelin ölçüsü olarak
  sunmaz

#### Scenario: Parça kümesi değişir

- **WHEN** daha önce modellenmeyen bir parça modellenmeye başlanır
- **THEN** sayfadaki açıklama aynı adımda güncellenir ve eski liste bırakılmaz

### Requirement: Model dekoratiftir

Hiçbir bilgi yalnızca üç boyutlu sahnede bulunmamalıdır (MUST NOT). Ekran okuyucu
kullanıcısı ve WebGL desteği olmayan ziyaretçi aynı bilgiye metin ve tablo üzerinden
erişebilmelidir.

#### Scenario: WebGL yok

- **WHEN** tarayıcı WebGL2 desteklemiyor
- **THEN** sahne yerine ölçek şeması çizilir ve hiçbir ölçü, etiket veya kaynak bilgisi
  kaybolmaz

#### Scenario: Etiket bilgisi

- **WHEN** modelde bir dış parça etiketlenir
- **THEN** aynı adlandırma ve aynı güven seviyesi sayfanın metin katmanında da bulunur
