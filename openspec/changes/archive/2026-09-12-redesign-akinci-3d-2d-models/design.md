## Context

Gerekçe için bkz. `proposal.md` — Why. Davranış sözleşmesi için bkz. `specs/`.

Bugünkü durum üç cümlede: geometri iki tipe sabit (`missile`, `aircraft`), tip seçimi
kategori dizesine bakan bir `if` zinciri ve tanınmayan kategori sessizce füze oluyor;
biçim sözleşmesi `{L, R, reach}` ile eksenel bir gövde varsayıyor; iki boyutlu şema
üç boyutlu modelden bağımsız ikinci bir çizim kodu tutuyor.

Üç dış kısıt tasarımı belirliyor. §6 ilk yüklemede 180 KB gzip ve GLB başına 3 MB
sınırı koyuyor, yani iki boyutlu yol `three` paketine dokunamaz. §9 hazır model ve
varsayılan geometri yasağı koyuyor, yani kayıt tablosunda "bulunamadı" hâli bir
varsayılana düşemez. §4 dördüncü bir güven rozeti varyantını yasaklıyor, yani köken
gösterimi güven rozetinin görsel dilini ödünç alamaz.

Ölçüm tarafında yeni bir bulgu var: üreticinin ön görünüş render'ı perspektif. Aynı
görselde burun iniş takımı ana tekerleklerden daha aşağıda projeksiyona düşüyor, ki
gerçek uçakta böyle değil. Kanat açıklığına göre ölçeklendiğinde dikey stabilize
gövde ekseninin 3,71 m üstünde çıkıyor; yan görünüşten okunan değer 2,50 m ve
yayımlanan 4,1 m toplam yükseklikle bu değer tutuyor. Yatay oranlar kanat düzleminde
kalibre edildiği için geçerli, dikey oranlar değil.

## Goals / Non-Goals

**Goals**

- Yeni ürün eklemenin maliyetini dokuz dosyadan bir ürün tanımı ve bir kayıt
  satırına indirmek.
- Topolojiyi oranlardan ayırmak, böylece çift kiriş, V kuyruk ve çok yüzeyli
  düzenler yeni bir tip dalı açmadan ifade edilebilsin.
- İki ve üç boyutlu çizimi tek tanımdan türetmek, ayrışmayı imkânsız kılmak.
- Biçimin kökenini veriye taşımak ve sayfada göstermek.
- AKINCI'yı üreticinin yayımladığı ön görünüşle örtüşecek kadar tamamlamak.

**Non-Goals**

- Fotogerçekçilik. Yüzey mat, kontur ince, ölçü çizgileri görünür kalır.
- Yeni bir 3B kütüphanesi veya sahne grafiği soyutlaması. `three` doğrudan
  kullanılmaya devam eder.
- İçerik şemasındaki ölçü sözleşmesini değiştirmek. §3 olduğu gibi kalır.
- Mühimmat geometrisi. Bkz. `specs/system-geometry` — taşınan mühimmat modellenmez.
- Yeni sistem dosyası eklemek. TB2, ANKA ve KAAN yalnızca topoloji sınavı olarak
  anılır, bu değişiklikte içerikleri yazılmaz.

## Decisions

### 1. Parça kiti işleyiciden bağımsız tanımlanır

Kit, `three` nesnesi üretmez. Her parça, ölçü ve orandan türeyen **saf bir biçim
tanımı**dır; iki ayrı tüketici onu okur.

```
        urun tanimi = parca listesi + oran tablosu
                          |
                          v
                  +---------------+
                  |  parca kiti   |   saf veri, renderer yok
                  +---------------+
                     |         |
        build3D <----+         +----> project2D(eksen)
           |                              |
     THREE.Group                     SVG path dizisi
     + tutamaklar                    + olcu cizgileri
```

Alternatif olarak `SVGRenderer` ile sahneyi çizip SVG almak vardı. Reddedildi: iki
boyutlu yol sunucuda çalışıyor ve `three` bağımlılığını oraya sokmak §6 bütçesini
riske atardı, ayrıca çıktı kontrol edilemeyen bir çizim yığını olurdu. İkinci
alternatif, köşe noktalarını izdüşürüp dışbükey zarf almaktı. Reddedildi: içbükey
siluetleri yanlış çizer ve kanat ucu kıvrımını yutar.

**Kit ilkelleri.** Altı ilkel bugünkü üç sistemi ve sınav olarak tutulan üç
topolojiyi karşılıyor:

| İlkel | Ne | Kullanan |
|---|---|---|
| `body` | eksen etrafında dönel ya da eliptik kesitli gövde | hepsi |
| `panel` | trapez yüzey; ok açısı, incelme, kalınlık, kök filetosu | kanat, kanatçık, stabilize, V kuyruk |
| `pod` | eksen dışı küçük gövde | motor gondolu |
| `disc` | dönel yüzey izi | pervane |
| `strut` | çubuk | iniş takımı bacağı, pilon |
| `boom` | gövdeye paralel ikincil kiriş | TB2 ve ANKA sınavı |

`wheel` ayrı ilkel değil; eksen dışı `body`. Tekerleği ayrı ilkel yapmak kiti
ürün listesine göre büyütmeye başlar, ki kaçındığımız şey tam olarak bu.

### 2. Kesit `body` ilkelinin alanı olur, ayrı tip değil

AKINCI gövdesi ölçülen 1,13 m en ve ~1,45 m boy ile dönel değil. `body` bir kesit
oranı alanı kazanır; dönel gövde bu oranın 1 olduğu özel hâldir. Üretimde lathe
kurulur ve tek eksende ölçeklenir.

Bunun görünür sonucu: yüzeye oturan parçaların kök yarıçapı artık tek sayı değil,
açıya bağlı. `panel` ve `pod` kök oturma noktasını gövdenin o açıdaki yarıçapından
alır. Eliptik gövdede kanat kökü ile iniş takımı bağlantısı farklı yarıçap görür,
ki gerçekte de öyle.

Alternatif, gövdeyi serbest kesitli bir süpürme yüzeyi yapmaktı. Reddedildi: füze
gövdeleri için gereksiz karmaşa ve her kesit istasyonu yeni bir "seçilmiş" oran
demek, yani köken kaydını gereksiz yere kalabalıklaştırır.

### 3. Oran tipi köken taşır

```ts
type RatioBasis = 'measured' | 'reading' | 'chosen';

// measured  okundu VE izdusum sinavi gecildi
//   value, note, source_url, seen_at, axis, projection_check  (hepsi zorunlu)
// reading   okundu, sinav YAPILMADI
//   value, note, source_url, seen_at, axis      (projection_check ALANI YOK)
// chosen    gorselden cikarilamadi, secildi
//   value, note                                  (kaynak alanlari YASAK)
```

`lib/geometry/akinci.ts` içindeki OLCULEN/SECILEN düzyazı ayrımı bu tipe taşınır.
Düzyazı yirmi ürüne kadar yaşamaz; tip yaşar ve Zod ile sınanabilir.

Üçüncü durum boş bir ayrım değil, uygulama sırasında zorunlu çıktı. AKINCI'nın
oranlarının çoğu üreticinin yan görünüş ve 360° karelerinden okunmuş ama o
karelerin ortografik olduğu hiç sınanmamış. İkisini `measured` saymak okumayı
kendinden yetkili gösterirdi; `chosen` saymak ise ters yönde yanlış olurdu, çünkü
şema `chosen` üzerinde kaynak alanı taşımıyor ve okumanın kaynağı silinirdi.
`reading`, kaynağı `measured` ile aynı titizlikte tutar, yalnız sınavı eksiktir.

Güven seviyesi (`official` / `press` / `estimate`) buraya **girmez**. Köken ile güven
farklı sorulara cevap: güven "bu sayıyı kim söyledi", köken "bu oranı kim çıkardı".
Birleştirmek §4'ün yasakladığı dördüncü rozet varyantını arka kapıdan getirirdi.

### 4. İniş takımı uydurulmaz, yayımlanan yükseklikten türetilir

İniş takımı için kaynaklı ölçü yok. Uydurmak §5.7'ye çarpar. Bunun yerine takım
boyu, zaten içerik dosyasında duran `height_m` değerinden türetilir:

```
yayimlanan toplam yukseklik            4,1 m   (official, urun sayfasi)
- dikey stabilize ucu, govde ekseninden  2,50 m (measured, yan gorunus)
= govde ekseni yerden                    1,60 m
- govde kesit yari yuksekligi
= takim uzanimi
```

Böylece `height_m`, bugüne kadar hiçbir çizime girmeyen bir alan olmaktan çıkıp
modelin bir parçasını belirleyen kaynaklı sayı oluyor. Takımın biçimi seçilmiş
kalır, boyu türetilmiş olur. Model artık tabloyla çelişmediği için sayfadaki
"modelin yüksekliği tablodaki değer değildir" uyarısı da anlamını yitirir ve
yeniden yazılır.

Alternatif, takımı hiç çizmemekti. Bu, kullanıcının kararıyla kapandı.

### 5. Pilon evet, mühimmat hayır

Yük istasyonları çıplak `strut` olarak çizilir. Yatay konumları ön görünüşten
ölçülebiliyor — merkez hattından 3,70, 4,50 ve 4,89 m — ve bu ölçüler kanat
düzleminde kalibre edildiği için perspektiften etkilenmiyor. Mühimmat biçimi
çizilmez; gerekçe `specs/system-geometry` içinde sözleşme olarak duruyor.

### 6. Etiket çerçevesi kutupsaldan parçaya geçer

`{t, angle}` yerine `{part, t, angle?}`. `angle` yalnızca dönel `body` üzerinde
anlamlı kalır ve isteğe bağlıdır. Bugün AKINCI `annotations: []` taşıyor; bunun
sebebi etiketlenecek bir şey olmaması değil, kutupsal çerçevenin kanat ucunu
gösterememesi.

Taşıma: `content/systems/tayfun.json` içindeki üç etiket `part: "body"` ve
`part: "fin"` alır, `t` ve `angle` korunur. Şema geçişi tek yönlü; eski biçim
kabul edilmez, çünkü iki biçimi birden desteklemek §3'ün "iki kaynak drift üretir"
kuralının aynısıdır.

### 7. Kategori kaydı açık tablo olur

`systemKind` kalkar. Yerine kategori → ürün tanımı eşlemesi gelir ve eşlemede
karşılığı olmayan kategori model üretmez. Şemadaki kategori listesi ile kayıt
tablosu arasındaki boşluk derleme zamanında sınanır: her kategori ya bir ürün
tanımına bağlıdır ya da "henüz model yok" olarak açıkça işaretlidir. Sessiz
varsayılan kalmaz.

### 8. Köken sayfada iki durumlu, desenle ayrışan bir liste

Model bölümünün altında "biçim kaydı": hangi oran ölçüldü, hangisi sınanmamış
okuma, hangisi seçildi; ölçülen ve okunan hangi görselden ve ne zaman. Üç durum
desenle ayrışır (düz / kesik / noktalı alt çizgi), renkle değil — siyah beyaz çıktı
ve renk körlüğü için, §4'teki aynı gerekçe.

Güven rozetinin çerçeve dili kullanılmaz. Aynı görünen iki şey farklı anlamlara
gelirse okuyucu ikisini de yanlış okur.

### 9. Segment bütçesi parça başına ayrılır

Bugün tek bir `radialSegments` bütün lathe'leri besliyor. Pervane diski ve tekerlek,
gövdeyle aynı çözünürlüğü almak zorunda kalmamalı. Kit, parça sınıfı başına segment
sayısı alır; mobil ve masaüstü ayrımı korunur. Hedef, AKINCI'nın parça sayısı yaklaşık
ikiye katlanırken GLB'nin 3 MB altında kalması.

### 10. Fazlara bölünmüş geçiş

Her faz sonunda `pnpm typecheck && pnpm lint && pnpm test` yeşil ve site çalışır
durumda. Faz sırası:

```
1  Ratio tipi + kit        TAYFUN/ATMACA tasinir, gorsel degisiklik yok
2  aircraft tasinir        AKINCI mevcut goruntusunu korur
3  project2D               siluet kitten turer, zarf 'profil yok' hali olur
4  kok kaydi bolumu        sayfada bolum acilir, uc durum desenle ayrisir
5  AKINCI yeni parcalar    eliptik kesit, gondol, pervane, takim, pilon
6  on gorunus + etiket     kamera/izdusum ayni eksen, etiket semasi gocer
```

Oran tipi faza 4'e bırakılmaz, faz 1'de tanımlanır. Kit önce düz sayıyla kurulup
sonra tipe çevrilseydi üç ürün dosyası iki kez elden geçerdi. Faz 4 yalnızca
sayfadaki bölümü ve mevcut oranların perspektif sınavını taşır.

Faz 1 ve 2 için görsel regresyon kilidi: mevcut geometri testleri taşımadan önce
üretilen köşe sayıları ve sınır kutularını sabitler, taşıma sonrası aynı değerleri
bekler.

## Risks / Trade-offs

- **Uçak silüeti kontura dönüyor** → `aircraft-geometry.ts` başındaki ret gerekçesi
  bilerek geçersiz kılınıyor. Yeni gerekçe sözleşmede duruyor: kontur ancak köken
  kaydı taşıyan bir oran tablosundan türerse çizilir. Profili olmayan sistem hâlâ
  kesikli zarf alır, yani ret ortadan kalkmıyor, koşullu hâle geliyor.
- **Perspektif yöntemi geç fark edildi** → sınav faz 2'de yapıldı, çünkü oran
  tablosu bir kez yazılıyor. Sonuç: AKINCI'nın 21 oranından yalnızca üçü (gövde eni,
  kanat ucu açıklığı, kanat ucu yükselişi) kalibrasyon düzleminde olduğu için
  `measured` kaldı. On üçü `reading`e, beşi `chosen`a düştü. Bu bir düzeltme kaydı
  DOĞURMAZ: `revisions` yayımlanmış ölçü değerleri içindir, oranlar içerik değil kod.
  Sayfadaki köken bölümü farkı okuyucuya anlatır.
- **GLB 3 MB sınırı** → AKINCI parça sayısı ikiye katlanıyor. Azaltma: pervane diski
  düşük segmentli, tekerlek düşük segmentli, kontur çizgileri GLB'ye girmez. Faz 5
  sonunda ölçülür; aşarsa pervane ve takım AR çıktısından çıkarılır, web sahnesinde
  kalır.
- **`{L, R, reach}` kaldırılıyor** → kadraj, gölge düzlemi ve zoom sınırları bu üç
  sayıya bağlı. Sınır kutusuna geçiş kadrajı bozabilir. Azaltma: faz 1'de kadraj
  hesabı sınır kutusundan türetilir ve mevcut üç sistemde kamera konumları
  karşılaştırılır.
- **Etiket şeması tek yönlü göç** → `content/systems/*.json` elle düzeltilir. Bugün
  yalnızca TAYFUN'da üç etiket var, maliyet küçük. Sonra büyür, bu yüzden şimdi
  yapılıyor.
- **CLAUDE.md güncellenmeli** → §7 dizin ağacı, §9'daki "Modellenmeyenler" listesi
  ve `{t, angle}` annotation şeması bu değişiklikle çelişecek. CLAUDE.md kendi
  kuralıyla "önce sor" diyor; düzenleme yapılmadan önce onay alınacak, tek başına
  değiştirilmeyecek.
- **`measured` etiketi fazla güven verebilir** → bir render'dan piksel ölçümü,
  üreticinin yayımladığı bir sayı değil. Sayfa metni bu farkı açıkça söyler: ölçülen
  oran bir ölçüm beyanı değil, bir okuma.

## Migration Plan

Geri dönüş fazlar üzerinden. Her faz tek başına dağıtılabilir ve `scripts/deploy.sh`
sürüm etiketleri §11'deki yordamla geri alınabilir. İçerik göçü yalnız faz 6'da
kalıcıdır (etiket şeması); ondan önceki fazlar içerik dosyalarına dokunmaz, bu yüzden
kod geri alındığında veri uyumsuzluğu doğmaz.

Etiket şeması göçü tek adımda yapılır: Zod şeması yeni biçimi zorunlu kılar,
`content/systems/tayfun.json` aynı commit içinde güncellenir. Bozuk veri derlemeyi
düşürür, dağıtıma gitmez (§8).

## Open Questions

- Köken kaydı bölümü varsayılan olarak açık mı kapalı mı görünsün? Sayfa uzunluğunu
  etkiler, sözleşmeyi etkilemez.
- Pervane kanat sayısı ölçülebiliyor ama motor varyantına göre değişiyor olabilir.
  Ölçülen değer kayda geçer; varyant farkı bulunursa `_todo` olarak açılır.
