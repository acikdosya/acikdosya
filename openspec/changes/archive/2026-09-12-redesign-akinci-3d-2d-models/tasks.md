## 1. Oran tipi ve parça kiti

- [x] 1.1 `Ratio` tipini ve Zod şemasını tanımla (`value`, `basis`, `note`,
      `source_url`, `seen_at`, `projection_check`); `basis: 'measured'` iken
      `source_url` ve `seen_at` zorunlu, dikey oranda `projection_check` zorunlu
      olsun. Doğrulama: eksik alanlı bir örneğin şemayı düşürdüğünü gösteren birim
      testi geçer.
- [x] 1.2 Parça kiti ilkellerini işleyiciden bağımsız veri tipi olarak tanımla:
      `body`, `panel`, `pod`, `disc`, `strut`, `boom`. Doğrulama: `three` içe
      aktarımı olmadan derlenir; kit modülünün bağımlılık listesi testte sabitlenir.
- [x] 1.3 Ürün tanımı tipini yaz: parça listesi + oran tablosu + kategori bağı.
      Doğrulama: üç mevcut sistem bu tiple ifade edilebiliyor, tip testi geçer.
- [x] 1.4 Mevcut TAYFUN ve ATMACA geometrisi için altın değer testi ekle (köşe
      sayısı ve sınır kutusu). Doğrulama: taşımadan önce çalıştırılır ve yeşil,
      taşıma sonrası aynı değerleri beklemek için kullanılır.
- [x] 1.4a Kanatçık yönelimi düzeltildi (kullanıcı kararı, seçenek 1): şekil
      artık (açıklık, veçhe) sırasıyla kuruluyor ve mesh X etrafında
      çevrilmiyor. Eski hâlde kalınlık gövde ekseninde kalıyor, kanatçık
      gövdeye dik bir plaka oluyordu; mesh 1,82 m genişken `reach` 0,58 m
      bildirdiği için kadraj da kanatçıkları kesiyordu. Altın değerler
      düzeltilmiş geometriye göre yazıldı. Doğrulama: `missile.test.ts`
      içindeki "bildirilen reach gerçek yanal uzanımla aynı" sınavı geçer.
- [x] 1.5 Kitten `three` grubu üreten katmanı yaz; ortak malzeme, kontur, ölçü
      çizgisi ve `dispose` tek yerde toplansın. Doğrulama: 1.4 testi taşıma sonrası
      hâlâ aynı değerleri veriyor.
- [x] 1.6 TAYFUN ve ATMACA'yı ürün tanımına taşı, oranlarını `Ratio` tipine çevir
      ve her birine köken beyanı yaz. Doğrulama: 1.4 altın testi geçer, `pnpm
      typecheck && pnpm lint && pnpm test` yeşil.
- [x] 1.7 Sınır ve kadraj hesabını parça listesinden türet; `{L, R, reach}`
      sözleşmesini sınır kutusu ve tutamak çerçevesiyle değiştir. Doğrulama: üç
      sistemde kamera konumları taşıma öncesiyle karşılaştırılır, sapma kayda geçer.
      SONUÇ: dört durumda da sapma sıfır. Parite `LatheSpec.nominalRadius` ile
      sağlandı: gövdenin anma yarıçapı en geniş istasyondan ayrı tutuluyor, yoksa
      AKINCI'nın kanat kökündeki omuz şişmesi gölge düzlemini ve ölçü çizgisini
      %18 dışarı iterdi.

## 2. Uçak topolojisinin taşınması

- [x] 2.1 AKINCI için altın değer testi ekle (mevcut mesh sınırları ve panel
      sayıları). Doğrulama: taşımadan önce yeşil.
- [x] 2.2 `AircraftProfile` yirmi bir alanını parça listesi ve oran tablosuna çevir;
      görünüm değişmesin. Doğrulama: 2.1 altın testi geçer.
- [x] 2.3 AKINCI oranlarını `Ratio` tipine taşı; `lib/geometry/akinci.ts` içindeki
      OLCULEN/SECILEN düzyazı ayrımını `basis` alanına aktar, kaynak adresi ve
      görülme tarihini koru. Doğrulama: her oranın köken beyanı taşıdığını sınayan
      test geçer.
- [x] 2.4 Çift kirişli ters V kuyruk topolojisini yalnız test verisi olarak ifade et
      (içerik dosyası yazma). Doğrulama: kit yeni bir tip dalı açmadan bu tanımı
      üretebiliyor, test geçer.
- [x] 2.5 `systemKind` varsayılanını kaldır; kategori → ürün tanımı eşlemesini açık
      tablo yap. Doğrulama: tanınmayan kategori taşıyan bir örnek için model
      üretilmediğini gösteren test geçer.
- [x] 2.6 Şemadaki kategori listesi ile kayıt tablosu arasındaki boşluğu derleme
      zamanında sına. Doğrulama: karşılığı olmayan ve "henüz model yok" olarak
      işaretlenmemiş bir kategori eklendiğinde derleme düşer.

## 2A. ATMACA ölçülen geometri (kullanıcı kararı, seçenek 1)

Kullanıcının verdiği ROKETSAN 2024 deniz sistemleri kataloğu, projedeki ilk
ortografik kaynak. Bu grup onun sonucudur; TAYFUN Blok-4 bilerek ertelendi.

- [x] 2A.1 Kataloğun üst görünüş çizimini izdüşüm sınavından geçir. Doğrulama:
      gövde eni eksen boyunca 105,2 px ± 1,4 px (%1,4), gövde ekseni kaymıyor,
      üst ve alt yüzeyler 1 piksel içinde ayna simetrik. Sınav GEÇTİ.
- [x] 2A.2 Ölçek kontrolü: çizimde gövde uzunluğu gövde çapının 11,65 katı, yani
      370 mm çapta 4,31 m. Doğrulama: içerik dosyasındaki birincil değer 4,3 m ile
      örtüşüyor; kataloğun metnindeki 5,2 m zaten ikinci kayıt olarak duruyor.
- [x] 2A.3 Eksenel ürüne ikinci yüzey grubu ekle (gövde ortası kanat), grup
      isteğe bağlı olsun. Doğrulama: TAYFUN altın değerleri değişmeden geçer,
      ATMACA dokuz parça üretir (gövde + 4 kanatçık + 4 kanat).
- [x] 2A.4 Yüzeyi hücum kenarı ok açısı yerine FIRAR kenarı eğimiyle tanımla.
      Doğrulama: TAYFUN'un firar kenarı gövde eksenine tam dik kalıyor; ok açısı
      ayrı bir yuvarlanmış sayı olarak tutulduğunda mesh kuyruğu 59 µm aşıyordu,
      artık aşmıyor.
- [x] 2A.5 ATMACA oranlarını çizimden ölç ve `measured` olarak kaydet. Doğrulama:
      kalınlık dışındaki her oran `measured`, kaynak adresi ve izdüşüm sınavı dolu;
      model çizimin gövde yüzeyindeki veçhesini 3 piksel içinde yeniden üretiyor.
- [x] 2A.6 Ölçü çizgisi ofsetini ürün tanımına taşı. Doğrulama: ATMACA'nın gövde
      ortası kanadı 2,74 yarıçapta olduğu için çizgi 3,3'e çıktı ve yüzeyin içinden
      geçmiyor; TAYFUN ve AKINCI ofsetleri değişmedi.
- [x] 2A.7 Kaynak ve eksik kayıtlarını düş. Doğrulama: `content/assets.json`
      kataloğu ve BAYKAR render'larını "bakıldı, kopyalanmadı" olarak kaydediyor;
      `atmaca.json` kalınlık ve yuvarlanma açısı için `_todo` taşıyor; `tayfun.json`
      Blok-4'ün dönel olmayan gövdesi için `_todo` taşıyor.

## 3. İki boyutlu izdüşüm

- [x] 3.1 Her kit ilkeli için seçilen eksende SVG dış hat üreten izdüşüm işlevini
      yaz. Doğrulama: ön, yan ve üst eksende üretilen yolların sınır kutusu, üç
      boyutlu sınır kutusunun aynı eksendeki izdüşümüyle örtüşür.
- [x] 3.2 `ScaleSilhouette` çizimini izdüşümden türet; füze konturunu bugünkü
      görünüme yakın tutan altın test ekle. Doğrulama: test geçer ve `three`
      sunucu paketine girmez.
- [x] 3.3 Kesikli ölçü zarfını "oran tablosu yok" hâline bağla; uçak için özel
      olmaktan çıkar. Doğrulama: profili olmayan bir örnek için zarf, profili olan
      için kontur çizildiğini gösteren test geçer.
      NOT: Uçakta önce yalnız ÜST görünüş dış hatta döndü. Ön görünüş faz 5'te
      iniş takımı gelince döndü: takım boyu yayımlanan `height_m` değerinden
      türediği için modelin dikey uzanımı artık tam olarak o değer. Kontur ancak
      bu örtüşme sağlanırsa çizilir; sağlanmazsa zarf kalır, çünkü kısa bir
      kontur yükseklik braketini yalanlar.
- [x] 3.4 Tek ölçek çarpanı kuralını izdüşüm yolunda koru: varyantlar, görünüşler ve
      insan figürü aynı çarpanı paylaşsın. Doğrulama: mevcut ölçek testleri geçer,
      iki varyantlı bir örnekte çarpanın tek olduğu sınanır.
- [x] 3.5 Paylaşım görselini aynı izdüşümden besle. Doğrulama: `lib/og.tsx`
      çıktısındaki biçim sayfadaki şemayla aynı tanımdan geliyor, görsel testi geçer.
- [x] 3.6 Türkçe karakter sınaması: şema etiketleri ve ölçü metinlerinde İ, ı, ğ, ş
      doğru çiziliyor. Doğrulama: mevcut mesaj sözleşmesi testi genişletilir ve geçer.

## 4. Köken kaydı

- [x] 4.1 Model bölümünün altına "biçim kaydı" listesini ekle: hangi oran ölçüldü,
      hangisi seçildi, ölçülen hangi görselden ve ne zaman. Doğrulama: AKINCI
      sayfasında bölüm çiziliyor ve her oran için bir satır var.
- [x] 4.2 Üç durumu desenle ayır (düz / kesik / noktalı alt çizgi), güven rozetinin
      çerçeve dilini kullanma. Doğrulama: renk kaldırıldığında ayrımın okunduğunu
      gösteren görsel kontrol ve stil testi geçer.
- [x] 4.3 TR ve EN mesaj anahtarlarını ekle. Doğrulama: `lib/messages.test.ts`
      sözleşme testi iki pakette de anahtarları bulur ve geçer.
- [x] 4.4 Mevcut tüm `measured` oranları perspektif sınavından geçir; sınavı hiç
      yapılmamış olanı `reading`, yapılıp geçilmeyeni `chosen` yap. Sınav faz 2'de
      yapıldı, çünkü oran tablosu bir kez yazılıyor. Doğrulama: her `measured` oranın
      dolu bir `projection_check` alanı taşıdığını sınayan test geçer.
- [x] 4.5 4.4 bir yayımlanmış değeri değiştirdiyse `content/systems/akinci.json`
      içine düzeltme kaydı düş. SONUÇ: KAYIT DÜŞÜLMEDİ, çünkü koşul gerçekleşmedi.
      `revisions` yayımlanmış ÖLÇÜ değerleri içindir; değişen şey oranların köken
      beyanıydı ve oranlar içerik değil kod. Hiçbir `length_m`, `wingspan_m` veya
      `height_m` değeri değişmedi. Uydurulmuş kayıt yazılmaz (CLAUDE.md §3).
      Doğrulama: `revisions` dizisi dokunulmadan duruyor, düzeltme defteri bölümü
      yalnızca gerçek kaydı olan sistemde çiziliyor.

## 5. AKINCI'nın eksik parçaları

- [x] 5.1 `body` ilkeline kesit oranı alanını ekle; dönel gövde bu oranın 1 olduğu
      hâl olsun. Doğrulama: TAYFUN ve ATMACA altın testleri değişmeden geçer.
- [x] 5.2 AKINCI gövdesini eliptik kesite geçir (ölçülen 1,13 m en, ~1,45 m boy) ve
      yüzeye oturan parçaların kök yarıçapını açıya bağlı hale getir. Doğrulama:
      kanat kökü ile takım bağlantısının farklı yarıçap gördüğünü sınayan test geçer.
- [x] 5.3 Motor gondollarını ekle: merkez hattından ±2,20 m, 0,67 m en, kanadın
      0,81 m altına sarkan. Doğrulama: ön izdüşümde gondol konumları ölçülen
      değerlerle eşleşiyor, test geçer.
- [x] 5.4 Pervane diskini ekle (~1,95 m çap) ve kanat sayısını ölçülen değerle kaydet.
      Doğrulama: disk yarıçapı oran tablosundan türüyor ve segment sayısı gövdeden
      bağımsız, test geçer.
- [x] 5.5 İniş takımını ekle; takım uzanımını `height_m` değerinden türet
      (4,1 m − 2,50 m = gövde ekseni yerden 1,60 m). Doğrulama: modelin zeminden
      dikey stabilize ucuna ölçüsü yayımlanan 4,1 m ile örtüşüyor, test geçer.
- [x] 5.6 Yük istasyonlarını çıplak pilon olarak ekle (±3,70, ±4,50, ±4,89 m).
      Mühimmat geometrisi ekleme. Doğrulama: parça listesinde mühimmat ilkeli
      bulunmadığını sınayan test geçer.
- [x] 5.7 `content/systems/akinci.json` içine eksik mühimmat kaynak verisi için
      `_todo` kaydı ekle. Doğrulama: içerik şeması doğrulaması geçer.
- [x] 5.8 GLB boyutunu ölç. SONUÇ: AKINCI 41 KB, ATMACA 9,4 KB, TAYFUN 8,5 KB —
      3 MB sınırının çok altında. Pervane ve takım AR çıktısında KALDI; azaltmaya
      gerek olmadı. Parça sayısı 8'den 24'e çıkarken boyut kilobayt mertebesinde
      kaldı, çünkü parçalar düşük segmentli ve geometri paylaşımlı.
- [x] 5.9 `ModelViewer.noteAircraft` metnini TR ve EN'de yeniden yaz: gondol,
      pervane, takım ve pilon artık modelleniyor; modelin dikey ölçüsü ile tablodaki
      4,1 m arasındaki yeni ilişki anlatılıyor. Doğrulama: mesaj sözleşmesi testi
      geçer ve eski "modellenmez" listesi metinde kalmıyor.

## 5A. Kanat yüzeyi yeniden yazıldı (kullanıcı geri bildirimi)

Kullanıcı yayındaki modeli görüp kanadın gerçek AKINCI kanadına
benzemediğini söyledi. Ölçüm üç ayrı kusur gösterdi; üçü de düzeltildi.

- [x] 5A.1 Ölç: kalınlığın YEREL veçheye oranı açıklık boyunca sabit mi.
      SONUÇ: on istasyonda 0,152 ± 0,004. Model sabit kalınlıkta çiziyordu
      (kök veçhesinden hesaplanan tek sayı), yani kökte ince uçta kalın.
- [x] 5A.2 Ölç: kanat ucu kıvrımının biçimi. SONUÇ: kıvrım son 1,25 m’de
      (yarım açıklığın %12,5’i) ve orta çizgi 0,518 m yükseliyor; yükseliş
      profili u^2,5–2,9 arası bir eğri. Model %7’lik bir payda tek bir 30°
      köşe çiziyordu.
- [x] 5A.3 Kanat ucu ile ana panelin birleşme yerindeki dikey basamağı
      kaldır. Sebep: iki panel de `mount: 'high'` ile GÖVDE yarıçapına
      oturuyordu, oysa uç paneli gövdeden 9,3 m uzakta. Tek parçaya
      geçilince sorun kendiliğinden kalktı.
- [x] 5A.4 `panel` ilkelini istasyon tabanlı lofting'e çevir: her
      istasyonun kendi veçhesi, kalınlığı ve kıvrımı var. Doğrulama: t/c
      oranının açıklık boyunca sabit kaldığını ve hiçbir kıvrım adımının
      toplam yükselişin dörtte birinden fazlasını taşımadığını sınayan
      testler geçer.
- [x] 5A.5 Kesit dikdörtgen olmaktan çıktı: yuvarlak hücum kenarı, %30
      veçhede en kalın nokta, sivri firar kenarı. Belirli bir kanat profili
      DEĞİL ve öyle sunulmuyor; düz plaka hiçbir uçakta bulunmayan bir
      biçimdi. En kalın nokta örnek kümesine açıkça eklendi, yoksa çizilen
      kalınlık anma değerinin binde biri altında kalıyordu.
- [x] 5A.6 Kalınlık oranının TANIMI değişti: gövde yarıçapına göre değil,
      yerel veçheye göre. TAYFUN ve ATMACA'nın değerleri çizilen kalınlık
      aynı kalacak şekilde çevrildi (kanatçık 0,0273 m). Doğrulama: altın
      testte kanatçık kalınlığı değişmeden geçer.
- [x] 5A.7 Ana iniş takımı gövdeden değil GONDOLDAN insin ve tekerleğe
      doğru içe eğilsin. Fotoğraflarda açıkça böyle; önceki sürümde iki
      bacak da gövdeden dimdik iniyordu.
- [x] 5A.8 İzdüşüm kusurları: pervane dolu bir daire olarak çiziliyordu
      (dışbükey zarf), artık göbek ve beş kanat ayrı çokgen. Çubuklar
      eksen hizalı kutuların zarfıyla çiziliyordu ve eğik bir bacakta
      kalınlık kök iki katına çıkıyordu; kesit artık çubuğun kendi
      eksenine dik. Doğrulama: ön izdüşüm görsel olarak denetlendi.

- [x] 5A.9 Kanadın DİKEY konumunu ölç ve düzelt. Gerçek kusur buydu:
      kalınlık ve kıvrım düzeltildikten sonra yapılan üst üste bindirme,
      kanadın açıklığın TAMAMINDA 0,36 m yukarıda durduğunu gösterdi.
      Sebep: kanat gövde yüzeyine oturtuluyordu ve omuz şişmesi de hesaba
      katılıyordu. Gerçekte kanat gövdenin üzerine oturmuyor, kök
      fairing'inin içinden çıkıyor. Ölçülen: orta çizgi gövde ekseninin
      0,669 ± 0,008 m üstünde, sekiz istasyonda. Doğrulama: düzeltme
      sonrası 25 istasyonda ortalama fark +0,003 m, en büyüğü +0,043 m.
- [x] 5A.10 Tarayıcıda denetle. Doğrulama: `/sistemler/akinci` açıldı, üst
      ve ön görünüş dış hatları çiziliyor, ön görünüş ön ayarı kamerayı
      burun eksenine oturtuyor, konsolda hata yok. Bulunan kusur: şema
      açıklaması hâlâ "dış hat için kaynağımız olmadığından uçak konturu
      üretilmemiştir" diyordu; sayfa kendi çizdiği şeyi yalanlıyordu.
      Metin düzeltildi ve sözleşme testiyle kilitlendi.

- [x] 5A.11 Simetri hatası: sağ kanat ucu AŞAĞI bakıyordu. Karşı yüzey
      -90° DÖNDÜRÜLEREK yapılıyordu; dönüş açıklığı doğru yöne taşıyor ama
      "yukarı" yönünü de ters çeviriyor. Düz bir plakada görünmeyen, kanat
      ucu kıvrımı eklenince göze batan bir hata. Karşı yüzey artık merkez
      düzlemde YANSITILIYOR. Aynı hata yatay stabilizede de vardı; orada
      anhedral açıklık yönünden geldiği için sonuç doğru çıkıyordu, yine de
      aynı çözüme geçirildi. Doğrulama: iki kanat ucunun da yükseldiğini ve
      yükselişlerin birebir eşit olduğunu sınayan test geçer.
- [x] 5A.12 Gövde–kanat birleşimi: kanat gövdeye DÜZ girmiyor. Ölçülen:
      orta çizgi gövdenin yanında seyir yüksekliğinin 0,50 m altında
      başlıyor ve 2,6 m açıklığa kadar tırmanıp düzleşiyor (0,93 m’de
      0,40 m, 1,64 m’de 0,57 m, 2,85 m’de 0,71 m). Model kanadı kökten uca
      dümdüz çiziyordu. Yüzeye kök bağlantı eğrisi eklendi; uydurulan eğri
      ölçülen noktalardan en çok 0,03 m sapıyor. Doğrulama: 32 istasyonda
      gerçek ön görünüşle ortalama fark +0,022 m.

- [x] 5A.13 Ana iniş takımı YANLIŞ YÖNDE açılıyordu. 5A.7'de bacakları
      gondola bağlamıştım ve tekerleğe doğru İÇE eğmiştim; gerekçe olarak
      "fotoğraflarda açıkça gondoldan çıkıyor" yazmıştım. Yanlıştı.
      Ölçüm: ön görünüşte bacak yukarıda 0,73 m yanal, aşağıda 1,26 m —
      aşağı inerken DIŞA açılıyor; yukarı uzatıldığında gövde yanına,
      0,55 m'ye denk geliyor. Park halindeki uçağın burun fotoğrafı da
      aynısını gösteriyor. Bacak artık gövdeden çıkıp tekerleğe doğru
      dışa açılıyor. `mainGearSpanRatio` ayrıca `measured`'dan `reading`'e
      düşürüldü: takım kalibrasyon düzleminin önünde ve altında, sınavı
      geçmiyordu. `content/assets.json` içindeki yanlış not düzeltildi.
      Doğrulama: bacağın alt ucunun üst ucundan daha dışarıda olduğunu,
      üst ucun gondolun içinde kaldığını ve iki bacağın ayna simetrik
      olduğunu sınayan testler geçer.
- [x] 5A.14 Tekerleklerin bacak ucuna oturduğu sınandı. Simetri hatası
      ARANDI ve BULUNMADI: lathe her zaman +Z yönünde uzadığı için aynı
      çıkarma iki tekerleği de bacağının üzerine oturtuyor. Kontrol test
      olarak bırakıldı.

- [x] 5A.15 Gövde OVAL DEĞİL. `crossAspect` ile tek eksende ölçeklenen bir
      lathe her zaman elips verir. Ön görünüşte gövdenin iki kenarı kanadın
      altında kesintisiz görünüyor; on yedi satırda okundu ve çıkan şekil
      aynı uzanımdaki bir elipsten 0,26 yarım ene kadar dar — aşağı doğru
      daha hızlı daralan bir damla. `body` ilkeli artık isteğe bağlı bir
      kesit profili taşıyor ve profili olan gövde lofting ile kuruluyor;
      profili olmayan (füze) gövdeler eski yoldan geçtiği için altın
      değerleri değişmedi. Alt yarı ölçüldü, üst yarı seçildi: ön görünüşte
      gövdenin üstü kanat kökü fairing'i, sırt çıkıntısı ve dikey stabilize
      ile üst üste biniyor ve bu izdüşümden ayrılamıyor. Doğrulama: kesitin
      elips sınavından GEÇMEDİĞİNİ sınayan test geçer.
- [x] 5A.16 Ana takım bacağının gövdeye bağlandığı nokta düzeltildi. Bacağın
      üst ucu gövdenin en alt noktası kadar aşağıdaydı ama yanal olarak
      dışarıdaydı; yani gövdeye değmiyor, altında boşlukta duruyordu.
      Bağlantı artık kesit profilinin ÜZERİNE oturtuluyor. Doğrulama:
      üst üste bindirmede bacak uçları gerçek uçağın gövde yanındaki
      bağlantı elemanlarına denk geliyor; testte bağlantının gövdenin
      altında boşta olmadığı sınanıyor.

## 6. Ön görünüş ve etiket şeması

- [x] 6.1 `ModelViewer` ön görünüş ön ayarını ekle; kamera izdüşümle aynı ekseni
      kullansın. Doğrulama: ön ayar seçildiğinde kadraj bütün parçaları çerçevede
      tutuyor, kanat ucu kesilmiyor.
- [x] 6.2 `prefers-reduced-motion` açıkken ön ayara geçişin ani olduğunu koru.
      Doğrulama: mevcut hareket testi geçer, `autoRotate` kapalı kalıyor.
- [x] 6.3 Etiket şemasını `{part, t, angle?}` biçimine geçir; `angle` yalnız dönel
      `body` üzerinde anlamlı olsun. Doğrulama: eski biçimi taşıyan içeriğin şemayı
      düşürdüğünü gösteren test geçer.
- [x] 6.4 `content/systems/tayfun.json` üç etiketini aynı commit içinde yeni biçime
      taşı. ATMACA'nın üç etiketi de taşındı ve gövde ortası kanadı için dördüncü
      bir etiket eklendi. `scripts/validate-content.ts` artık etiketin gösterdiği
      parçanın gerçekten üretildiğini derleme zamanında sınıyor; şema yalnızca
      kimliğin biçimini doğrulayabiliyordu. Doğrulama: içerik doğrulaması geçer ve
      etiketler aynı yerde duruyor.
- [x] 6.5 AKINCI için dış parça etiketleri yaz (kanat ucu, dikey stabilize, motor
      gondolu), her biri kendi güven seviyesini taşısın. Doğrulama: `annotations`
      dizisi boş değil ve etiketler modelde doğru parçalar üzerinde konumlanıyor.
- [x] 6.6 Ekran okuyucu yolunu sına: modeldeki her etiket bilgisi metin katmanında da
      var. Doğrulama: erişilebilirlik kontrolü geçer, WebGL kapalıyken hiçbir bilgi
      kaybolmuyor.

## 7. Kapanış

- [x] 7.1 Üç sistemin sayfasını elden geçir: TAYFUN, ATMACA, AKINCI. Doğrulama:
      `pnpm build` üç sistemin TR ve EN sayfalarını da statik olarak üretiyor
      (6 yol), içerik doğrulaması ve 202 test yeşil. Model, silüet ve köken kaydı
      üçünde de kuruluyor; köken kaydı metni üretilen HTML'de görünüyor.
- [x] 7.2 Performans bütçesini ölç. SONUÇ — DİKKAT, BÜTÇE AŞILDI:

      | ölçüm | değer | bütçe |
      |---|---|---|
      | sistem sayfası ilk yükleme JS | 191,0 KB gzip (10 chunk) | 180 KB |
      | 3B yığını (three + R3F + drei) | 249,2 KB gzip, ilk yüklemede DEĞİL | dinamik |
      | GLB, AKINCI | 41 KB | 3 MB |
      | sayfa HTML | 28,8 KB gzip | — |

      Dinamik import doğru çalışıyor: 3B yığını ilk yüklemeye girmiyor. Ürün
      tanımları, oran notları ve köken metinleri hiçbir istemci chunk'ına
      girmiyor (sunucuda çiziliyor, HTML'de duruyor). En büyük üç chunk 63,0 +
      44,9 + 38,5 KB ve biri react-dom.

      Aşmanın bu değişiklikten mi geldiği DOĞRULANAMADI: çalışma ağacı bu iş
      başlamadan önce de commit edilmemiş değişiklikler taşıyordu, bu yüzden
      karşılaştırılabilir bir taban ölçüm alınamıyor. Ayrı bir iş olarak
      ölçülmeli.

      LCP ölçülmedi: gerçek cihaz ve ağ koşulu gerektiriyor, bu turda yapılamadı.
- [x] 7.3 CLAUDE.md §7 dizin ağacı, §9 "Modellenmeyenler" listesi ve annotation
      şeması bu değişiklikle çelişiyor. Düzenleme yapmadan önce onay al; CLAUDE.md
      kendi kuralıyla önce sormayı istiyor. ONAY ALINDI, güncellendi:

      - §7: `lib/geometry/` ağacı yazıldı (parça kiti, ürün tanımları, izdüşüm,
        kadraj); `model-provenance/` ve `range-scale/` bileşenleri eklendi;
        kaldırılan `missile.ts`, `aircraft.ts`, `selection.ts` çıkarıldı.
      - §9 model kaynağı: "gövde geometrisi missile.ts içinde" yerine parça listesi
        ve oran tablosu; kitin `three` içe aktarmadığı ve iki boyutlu şemanın aynı
        listeden türediği yazıldı.
      - §9 şematik: yüzeylerin düz plaka olmadığı, eşli yüzeylerin döndürülerek
        değil yansıtılarak üretildiği eklendi.
      - §9 yeni bölüm "Oranların kökeni": üç durum, izdüşüm sınavı, kökenin güven
        seviyesi OLMADIĞI ve §4'teki rozet dilini kullanmadığı.
      - §9 etiketleme: dış parça listesi güncellendi; mühimmatın modellenmediği
        §5.4 ve §5.7 gerekçeleriyle yazıldı.
      - §9 annotation şeması: `{id, part, t, angle?}` ve parça varlığının derleme
        zamanında sınandığı.
      - §9 teknik tablo: segment bütçesi parça sınıfı başına, fallback izdüşüm,
        görünüş ön ayarları.

      Doğrulama: `pnpm typecheck && pnpm lint && pnpm test` yeşil; CLAUDE.md
      içinde kaldırılan dosya adı kalmadı.
