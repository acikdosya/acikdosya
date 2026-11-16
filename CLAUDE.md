# CLAUDE.md — Savunma Sanayii İnteraktif Dosya Projesi

Bu dosya projenin kalıcı bağlamıdır. Her oturumda geçerlidir. Bir karar bu dosyayla
çelişiyorsa, önce bana sor; kendi başına değiştirme.

---

## 1. Ürün ne, ne değil

**Ne:** Az sayıda Türk savunma sanayii sistemini derinlemesine anlatan,
animasyonlu ve interaktif bir dijital dosya. "İnteraktif müze vitrini."
Yayında dört dosya var: TAYFUN, ATMACA, AKINCI, SİPER.

**Ne değil:**
- Ansiklopedi/veri tabanı değil. 300 ürünlük katalog kurmuyoruz — bu alanda
  envantermedya.com zaten var ve genişlikte yarışmayacağız. Bizim ayrışmamız
  **derinlik, 3D ve animasyon.**
- Haber sitesi değil. Günlük içerik akışı yok.
- Forum / kullanıcı içeriği yok. Moderasyon yükü ve hukuki risk kabul edilemez.

**Hedef kitle:** Türk savunma meraklısı (birincil), yabancı gazeteci/araştırmacı
(ikincil), fuar ziyaretçisi (kiosk modu, ileride).

**Ton:** Soğukkanlı teknik dosya. Propaganda değil. Sayı verilir, kaynağı gösterilir,
çelişki gizlenmez. Bu ton ticari bir karar: ancak bu şekilde üreticiye portföy olarak
sunulabilir ve yabancı basında bağlamından koparılamaz.

---

## 2. Teknoloji kararları

| Katman | Seçim | Neden |
|---|---|---|
| Framework | Next.js (App Router) + TypeScript | SSG/ISR, SEO kritik |
| Stil | Tailwind + CSS custom properties | tokenlar CSS değişkeninde, bkz. §4 |
| Harita | MapLibre GL JS + PMTiles (Protomaps) | Mapbox lisans/maliyet yok, self-host |
| Geo hesap | Kendi jeodezik fonksiyonumuz | Turf tüm bundle'ı getirmesin |
| 3D | three.js + React Three Fiber + drei | |
| 3D varlık | GLB, Draco geometri + KTX2 doku | model başına **< 3 MB**, sıkı |
| Animasyon | GSAP + ScrollTrigger; Rive (ileride) | |
| İçerik | `content/**.json` (+ MDX uzun metin) | git'te versiyonlu, CMS sonra |
| i18n | `next-intl`, TR varsayılan, EN zorunlu | AR ileride, RTL'i baştan kırma |
| Deploy | Docker, nginx + certbot | sunucu paylaşımlı, bkz. §11 |

**Yapma:**
- Mapbox GL JS kullanma (lisans).
- Turf.js'i sırf daire çizmek için ekleme.
- Font'u Google CDN'den çekme — self-host et (`next/font/local`).
- `localStorage`/`sessionStorage`'a kritik state koyma; URL state tercih et
  (paylaşılabilir link = ürünün yayılma mekanizması).

---

## 3. Veri sözleşmesi — projenin en önemli kısmı

Her sayısal alan bir **dizi**dir, çünkü açık kaynak veriler birbiriyle çelişir.
Tek değer seçip diğerini gizlemek bu projede hata sayılır.

Ölçümün alanları `lib/schema.ts` içindeki `measurementSchema`'dadır; burada
kopyası tutulmaz. Güven seviyesi üç değerden biridir: `official`, `press`,
`estimate`. `verified_at` zorunludur — 6 ay sonra "bu nereden geldi"
sorusunun cevabı.

Kurallar:
- `confidence` alanı olmayan sayı UI'a **çıkmaz**. İstisnası yok.
- Aynı alanda birden fazla değer varsa UI çelişkiyi görünür kılar (rozet + alt satır).
- `official` = kurumun/bakanlığın kendi açıklaması. Haber sitesinin "resmî kaynaklara
  göre" demesi `press`'tir.
- `estimate` = bağımsız değerlendirme, resmî teyit yok. Rozeti kırmızı.
- Ürün kartındaki siluet/çizimler bu veriden **türetilir**, elle çizilmez. Veri
  değişince görsel değişmeli.

### Hassasiyet — iki sayı ne zaman çelişir

Ondalık yazılmış bir değer, yazıldığı hassasiyetin bandını taşır: bant, son
ondalık basamağın yarısıdır. `12,3` → `[12,25 – 12,35]`, kapalı; uç noktada
değme kesişme sayılır. Gerekçesi bir yayın hatası: üreticinin iki belgesi
uzunluğu 12,3 ve 12,2 m veriyordu ve hesap buna "çelişki" diyordu — elimizdeki
en sert kelime, on santim için.

**Tam sayıda bant yoktur.** `2300` ve `610` nokta değer kalır: sondaki
sıfırlardan anlamlı basamak çıkarılamaz. 2300 kg yazan kaynak yüze mi ona mı
yuvarladı bilinmiyor, bir bant uydurmak kaynağın söylemediği bir şey iddia
etmek olur. Aynı sebeple `12,30` ile `12,3` ayırt edilemez; JSON ikisini de
aynı sayıya çözer.

`~` işaretinin %10'luk bandı korunur, örtük kurala düşmez.

Kaynak belirsizliği kendisi yazıyorsa ölçüme `uncertainty` alanı eklenir
(± ve alan birimiyle). Bu alan hem örtük bandı hem de `~` oranını **geçersiz
kılar**; açık uçlu operatörle ya da aralıklı kayıtla birlikte yazılamaz, şema
orada reddeder. Bugün hiçbir kayıtta dolu değil.

### Kıyas eksenleri — iki sayı ne zaman kıyaslanmaz

Hassasiyet bandı "bu iki sayı ayrışıyor mu" sorusunu cevaplar. Ondan önce
sorulan soru: bu ikisi aynı cetvele konabilir mi? Üç eksen var ve üçü de
aynı değilse aralık hesabı hiç çalışmaz (`lib/measurement/divergence.ts`):

- `scope` — değer **nasıl** elde edildi: `beyan`, `test`, `olcum`, `tahmin`.
- `object` — **neyi** ölçüyor: `fuze`, `sistem`, `atici`. Bileşik sistemler
  için. SİPER'de ROKETSAN'ın "100+ km" füze menzili ile ASELSAN'ın "70+ km"
  sistem önleme menzili aynı sayı ailesinde görünür ama aynı şeyi ölçmez.
- `variant_id` — hangi varyantı tarif ediyor.

Bir eksen iki tarafta dolu ve farklıysa çift "farklı kapsam" olarak
gösterilir, "çelişki" denmez. Eksen yalnız bir tarafta doluysa çift
`belirsiz` işaretlenir: tek taraflı bilgi bir fark değildir. İkisi bir
aradaysa bilinen fark önce gelir. Hiçbir kaydında `object` bulunmayan
dosyada eksen görünmez; sonuçlar eksen eklenmeden öncekiyle aynıdır.

Bileşik dosyada her sayısal kayıt nesnesini beyan eder; beyansız kayıt
dosyanın ana nesnesine sessizce atanmaz. Hangi boyutun uzunluk olduğunu
söylemeyen bir kaynak uzunluk alanına yazılmaz — SİPER kanisterinin
ölçüleri bu yüzden dosyada yok.

`stated_at` kıyas ekseni değildir: aynı kapsamdaki iki beyan farklı
tarihlerde de çelişebilir ve o çelişki görünmelidir. Daha yeni bir
beyanın eskisini geçersiz kılması (supersession) henüz tasarlanmadı.

Kurallar: `openspec/specs/measurement-object-scope/spec.md`.

### Tekrar zinciri — köken kaydı

Bir iddianın kaç yayında tekrarlandığı ve hepsinin tek bir kökene
dayandığı sistem dosyasındaki `origins` dizisinde durur. Kayıt **ölçüme
değil kökene** bağlıdır: tekrarlanan şey iddia değil, belgedir. Ölçümler
ve takvim olayları kökeni `origin_id` ile gösterir; aynı köken birden çok
değeri besliyorsa tek kayıt tutulur.

- Sayaç alanı yoktur; tekrar sayısı adlandırılmış yayın listesinden türer.
- Boş tekrar listesi yazılamaz: sıfır tekrar denetlenmemiş bir iddiadır.
- Kaydın yokluğu tekrarın yokluğu değildir. Köken kaydı olmayan değer
  için "tekrarlanmadı" denmez.
- Yayıncının kendi yazısını tekrarı bağımsız dolaşım sayılmaz.

"N yayın tek kaynağı tekrarlıyor" cümlesi yalnız bir köken kaydından
kurulur — sayfada, kartta, gönderide (§5.10) aynı. Bugün kayıt yalnız
SİPER'de. Sayfada `components/origin-chain` çizer: tek belge, onu
aktaran N yayın. Paylaşım kartı (`kaynak-zinciri`) ters yönü anlatıyor:
tek belge, ona dayanan N değer.

Kurallar: `openspec/specs/source-repeat-chain/spec.md`.

### Ana sayfa panelinin konusu

Hangi dosyanın hangi alanının anlatıldığı **içerikte** yazar:

```jsonc
"hero": {"field": "range_km", "variant": "tayfun"}
```

Önceki sürümde paneli kod seçiyordu — bütün dosyalar taranır, en ağır ıraksama
kazanırdı. Sitenin en görünür bölümü bir sıralama kuralının çıktısıydı ve bir
kaynak eklemek konuyu sessizce değiştirebiliyordu. Editoryal karar artık
editoryal bir yerde duruyor.

- İşaretçi en fazla **bir** dosyada bulunur. İkisi birden işaretlenirse derleme
  düşer: ana sayfa tek konu anlatır.
- İşaretlenen alan gerçekten ıraksıyor olmalı. Panelin birinci katmanı ıraksama
  anlatır; gösterecek bir şey yoksa işaretçi yanıltır, derleme düşer.
- İşaretçi yoksa `lib/hero.ts`'teki sıralı geri çekilme devreye girer.

### Menzil halkasının alanı

Halkayı hangi alanın çizdiği de **içerikte** yazar:

```jsonc
"range_ring": {"field": "intercept_range_km", "object": "sistem"}
```

Önceki kural "İHA değilse `range_km` çiz" idi; yeni bir kategori halkayı
kendiliğinden açıyordu. Halka bir yarıçap iddiasıdır — "buradan her yöne
şu kadar" — ve o iddia kategoriden çıkarılamaz.

- Kayıt yoksa halka çizilmez. Menzil taşıyıp kaydı olmayan dosya derlemede
  uyarı verir, hata değil: yarıçap iddiası taşımayan değer için doğru
  karar budur (AKINCI'nın operasyonel menzili). Değer gizlenmez, mesafe
  cetvelinde (`range-scale`) gösterilir.
- Hava savunma sisteminde halka sistem önleme menzilinden çizilir. Füze
  menzili tek yön erişimdir; `range_km` seçilirse derleme düşer.
- Aynı alanda iki nesnenin kaydı varsa `object` gerekir; yazılmazsa
  alandaki bütün kayıtlar çizilir.

Kurallar: `openspec/specs/range-envelope/spec.md`.

### Düzeltme kaydı

Yayımlanmış bir değer değişince `revisions` dizisine kayıt düşülür:
`{date, field, from, to, reason, source?, source_url?}`. Sessiz düzeltme
bu projede veri hatasıyla aynı ağırlıkta bir hatadır — okuyucu dün gördüğü
sayının nereye gittiğini sorabilmeli.

`from` ve `to` serbest metin **değildir**, ayrımlı birliktir:

```ts
type RevisionValue =
  | {kind: 'measurement'; value: number; operator?: Operator; unit: string}
  | {kind: 'removed'}
  | {kind: 'text'; tr: string; en: string};
```

- `measurement` dile göre çizilir (`lib/format.ts`), yani İngilizce sayfada
  `12.3 m`, Türkçe sayfada `12,3 m`. Serbest metin bunu yapamıyordu: dize
  dosyaya tek dilde yazılıyor ve iki dile de aynı çıkıyordu.
- `removed` bir değer değil, değerin yokluğudur. "kayıt yok" diye bir metin
  yazmak o dizeyi her dile ayrı ayrı çevirmek demekti.
- `text` sayıya sığmayan her şey: iki değerli bir kayıt, varyant ya da güven
  niteleyicisi taşıyan bir satır, özellik metni. **Sayıya zorlanmaz** —
  `> 280 km (resmî)` ifadesinin parantezi hangi kaydın ayakta kaldığını
  söylüyor ve sayıya çevrildiğinde o bilgi kaybolur.

- Kayıt uydurulmaz. Gerçekten yapılmış bir düzeltme yoksa dizi de yoktur.
- Kayıt yoksa sayfada bölüm hiç çizilmez. Boş bölüm, defterin tutulmadığı
  izlenimini verir.
- Düzeltme kaydı bir ölçüm değildir: güven rozeti taşımaz.
- Program takvimi (`timeline`) sistemin tarihidir, `revisions` dosyanın
  tarihi. İkisi birbirinin yerine kullanılmaz.
- **Defter ile tablo tutmak zorunda.** Bir alanın en son düzeltmesindeki
  `to` bir ölçümse, o değer dosyada duruyor olmalı; uyuşmazsa derleme
  düşer (`lib/revisions.ts`, `scripts/validate-content.ts`). Kaldırma
  kayıtları ve metin kolu kıyaslanmaz — kıyaslanamazlar. Ayrışmış bir
  defter, tutulmayan defterden daha kötüdür: okuyucuya iki ayrı şey söyler.

Şemanın tek kaynağı `lib/schema.ts`, doldurulmuş örneği
`content/systems/tayfun.json`. İkinci bir şema kopyası tutulmaz —
iki kaynak drift üretir.

---

## 4. Tasarım tokenları

Ana sayfa ve bileşen tasarımları: reference/design/*.html
Layout ve etkileşim için oraya bak. Kopyalama, yeniden yapılandır.

Prototipte oturmuş palet — koru:

```css
--ground:#E4E5E1;  --paper:#F3F4F1;
--ink:#1C2124;     --ink-2:#5C6367;   --rule:#C6C9C3;
--signal:#B3131B;  --signal-soft:rgba(179,19,27,.09);
```

- Tipografi: **Archivo** (başlık, sayı, UI — tabular figürler açık),
  **Source Serif 4** (gövde metni, 18px, satır yüksekliği 1.62).
- Archivo ve Source Serif 4, VARIABLE sürüm, next/font/local ile self-host.
  Statik ağırlık dosyası seçilmez. Google Fonts CDN kullanılmaz — her
  ziyaretçinin IP'sini üçüncü tarafa gönderir (KVKK/GDPR).
- Subset latin + latin-ext. Sadece latin YETERSİZDİR: ğ ş ı İ ç ö ü
  latin-ext'te. Özellikle İ (U+0130) ve ı (U+0131) kontrol edilir.
- Güven rozetleri üç durum: resmî (düz çerçeve), basın (kesikli çerçeve),
  tahmin (kırmızı çerçeve + soft dolgu). Çerçeve rengi en az 3:1 kontrast
  taşır (--ink-2 veya --signal) çünkü çerçeve bilgi taşıyan bir öğedir
  (WCAG 1.4.11).
  Üç durum yalnızca renkle değil DESENLE ayrışır: düz / kesikli / düz+dolgu.
  Renk körlüğü ve siyah-beyaz çıktı için bu zorunlu; sadeleştirme adına
  kaldırılamaz.
- "Veri yok" bir güven durumu DEĞİLDİR. Dördüncü rozet varyantı yoktur.
  Eksik veri `data-state="absent"` ile gösterilir: çerçevesiz, tire, soluk.
- Sol kenardaki ölçü cetveli motifi projenin imzası. Dekorasyon değil; sayfa
  ölçüm hakkında olduğu için var.

**Ölçek:**
- Çakışan iki değer arasında 4'ün katı olan kazanır. Tek sayı minimum
  değerleri (31px, 18px) kullanılmaz.
- Bileşen içi optik boşluklar (buton, rozet dolgusu) genel boşluk
  ölçeğinden türemez. Bileşen tokeni olarak literal tanımlanır ve
  "düzeltilmez". Çerçeve payı içeren değerler calc() ile yazılır ki
  gerekçesi görünür kalsın: --btn-py: calc(12px - 1px).
- Referans belgeleri (reference/ altındaki tasarım ve kimlik sayfaları)
  ürün token'larına uymak zorunda değildir. Bunlar shipped sayfa değil.

**Hareket:**
- Sayfa başına TEK orkestre edilmiş hareket anı. Ana sayfada bu an, hero
  panelinin rozetiyle belirmesidir — yöntemi gösteren hareket odur. Panelin
  konusu içerikteki `hero` işaretçisinden gelir (§3); işaretçi yoksa üç
  katmanlı geri çekilme devreye girer (ıraksama, son düzeltme kaydı, tek
  değerin tam kaydı; `lib/hero.ts`) ve hangisi çizilirse hareket ona bağlanır. Kareler `globals.css` içinde
  tek yerde (`hero-panel`, `hero-reveal`, `hero-lead`); panel başına
  animasyon yazılmaz, yoksa kural sessizce ikiye çıkar. Kademeli giriş
  kaskadları (n öğe, artan gecikme) scroll'da da sayfa yüklemesinde de
  kullanılmaz.
- prefers-reduced-motion globals.css'te küresel ağ olarak uygulanır,
  dosya başına değil. Hareketin anlam taşıdığı yerlerde (3D autoRotate)
  ayrıca JS kontrolü bulunur.

**Yapma:**
- Her şeyi eşit köşe yarıçaplı karta bölme.
- Etiketleri ALL CAPS yapma.

---

## 5. Editoryal ve hukuki kurallar — pazarlık dışı

1. **Hedef dili yok.** Menzil halkası çizilir; hedef şehir/ülke etiketlenmez,
   vurgulanmaz, "ulaşabilir" denmez. Terim: "menzil zarfı", "referans nokta".
2. **Hedef tipi listesi yayımlanmaz.** Sistemin hangi hedef sınıflarına karşı
   geliştirildiği açık kaynakta var, biz koymuyoruz.
3. **Üretim, güdüm iç yapısı, harp başlığı tasarımı, isabet optimizasyonu**
   konularında teknik detay yok. Boyut, kütle, program takvimi, yayımlanmış
   performans beyanı — sınır bu.
4. **Çatışma/patlama görseli yok.** Play Store yaş derecelendirmesi ve tonu korumak için.
5. **Marka:** ASELSAN/ROKETSAN/TUSAŞ logoları kullanılmaz. Hiçbir yerde "resmî"
   izlenimi verilmez. Her sayfada bağımsızlık ibaresi (footer) bulunur.
6. **Görsel lisansı:** repoya giren her görselin lisansı `content/assets.json`
   içinde kayıtlı olmalı (`{file, license, source_url, attribution}`). Lisansı
   bilinmeyen görsel commit edilmez. Wikimedia'daki her dosya serbest değildir.
7. **Uydurma yok.** Bir sayının kaynağını bulamıyorsan alanı boş bırak ve bana
   söyle. Placeholder sayı üretme — bu projede en tehlikeli hata bu.
8. **Yapısal veri sayfayı tekrar eder, aşmaz.** JSON-LD'ye sayfada görünmeyen
   alan konmaz; makineye söylediğimizle okuyucuya söylediğimiz aynı olmalı.
   Operatör değerin parçasıdır: `> 280` schema.org'da `minValue`'dur,
   `value` değil.
9. **Üretilmiş görselde etiketli harita kesiti yok.** Etkileşimli harita yer
   adlarını taşır ve bu §5.1'in ihlali değildir: kural *bizim* hedef
   etiketlememizi yasaklar, genel amaçlı bir altlığın şehir adı basması
   harita olmasının gereğidir. Çizgi üretilmiş görselde: paylaşım görselleri
   ve kartlar ekran görüntüsü olarak dolaşır ve bağlamından kopar. Menzil
   halkasının Halep ya da Tebriz üzerinden geçtiği tek bir kare, sekiz aydır
   korunan sınırı deler. Harita gerekiyorsa siluete veya veri satırına
   çevrilir.
10. **Sosyal medya metinleri de bu kurallara tabidir.** Bir gönderinin olgu
    olarak söylediği her şey `content/` altında kayıtlı olmalı: kaynak adı,
    tarih, bağlantı, güven seviyesi. Kayıtlı değilse ya önce kaydedilir ya
    gönderiden çıkar.

    Bu madde bir olaydan sonra yazıldı. İlk paylaşım taslağı "beş büyük
    yayın" ve iki ayrı uçuş süresi iddia ediyordu; ikisi de dosyada yoktu,
    bir sohbetin arama sonuçlarından gelmişti. Gönderinin kendi konusu
    doğrulanmamış tekrarın tehlikesiydi.

    Tehlike yapısal: gönderi metni koddan geçmez, hiçbir doğrulayıcı ona
    bakmaz, şema onu reddedemez. Tek savunma hattı yayından önce her cümleyi
    `content/` ile karşılaştırmak.

---

## 6. Performans bütçesi

- LCP < 2.0 s (4G, orta seviye Android)
- İlk yüklemede JS < 180 KB gzip; 3D ve harita **dinamik import**, kullanıcı o
  bölüme gelmeden yüklenmez
- GLB < 3 MB, doku KTX2
- Harita tile'ları kendi origin'imizden

---

## 7. Dizin yapısı

Ağaç burada tutulmuyor: dizin `ls` ile, her dosyanın işi ve sınırı kendi
başlık yorumunda okunur (örneğin `lib/geometry/ratio.ts` neyi içe aktarmadığını
kendisi yazar). Elle tutulan ağaç koddan geri kalıyordu. `reference/`
altındakiler dondurulmuş prototip ve tasarım çıktısıdır, shipped kod değil.

---

## 8. Çalışma şeklim

- Büyük değişiklikten önce plan çıkar, onay al.
- Her PR/adım sonunda `pnpm typecheck && pnpm lint` çalışsın.
- Zod şeması içerik dosyalarını build zamanında doğrulasın — bozuk veri deploy'a gitmesin.
- Türkçe karakterler her yerde test edilsin (İ/ı/ğ/ş sıralama ve font desteği).
- Emin olmadığın yerde tahmin etme, sor.

## 9. 3D katmanı

### Model kaynağı: parametrik, satın alınmış değil

Hazır model kullanılmaz. Sketchfab/TurboSquid/CGTrader dahil hiçbir pazar yerinden
model satın alınmaz veya indirilmez. Gerekçe: bu sitelerdeki savunma modellerinin
lisans zinciri ve doğruluğu doğrulanamaz; kaynak takibi üzerine kurulmuş bir projede
kaynağı bilinmeyen geometri tüm iddiayı çürütür.

Bir ürünün biçimi iki şeyden ibarettir: hangi **ölçülere** dayandığı ve hangi
**oranları** taşıdığı. Parça listesi bu ikisinden türer (`lib/geometry/product.ts`).
Ölçü verisi değişirse mesh değişir. Ölçü verisi ya da ürün tanımı yoksa model
üretilmez — varsayılan bir geometriye düşülmez. İki boyutlu şema ile üç boyutlu
model aynı parça listesinden türer, ayrışamazlar. Parça kitinin kuruluşu ve yüzey
üretimi `lib/geometry/CLAUDE.md` içinde; görüntüleyici kararları
`components/model-viewer/CLAUDE.md` içinde.

Blender yalnızca yayımlanmış fotoğraflardan çıkarılabilen dış detaylar için kullanılır
(kanatçık profili, taşıyıcı araç). Bu tür varlıklar `content/assets.json`'a kaydedilir.

### Şematik, fotogerçekçi değil

Mat gri yüzey, ince kontur çizgileri, ölçü çizgileri. Fotogerçekçi doku ve render
yapılmaz — sahip olmadığımız bir doğruluk iddiası anlamına gelir. Şematik olmak
"kabaca" demek değildir ve belirli bir kanat profili İDDİA EDİLMEZ.

### Kesit ve iç görünüm yasak

Patlatılmış görünüm, kesit, iç bileşen yerleşimi üretilmez. İç geometriye dair
kaynaklı verimiz yok. Etiketleme yalnızca dış bölümler üzerinde yapılır (burun
bölümü, gövde, kanat, kanat ucu, kuyruk yüzeyleri, motor gondolu) ve her etiket
kendi `confidence` değerini taşır.

**Taşınan mühimmat modellenmez.** Yük istasyonları çıplak pilon olarak çizilebilir —
konumları ölçülebiliyor — ama mühimmatın biçimi çizilmez. Gerekçe iki katlı: hiçbir
mühimmat için kaynaklı ölçü kaydımız yok, yani biçim yalnız bir render'dan gelirdi
(§5.7); ve yüklü istasyon teknik dosya tonunu silahlı sistem sunumuna çevirir
(§5.4). Mühimmat ölçüleri kaynaklanırsa kendi sistem dosyası olarak eklenir,
taşıyıcının modeline iliştirilmez.

**Modellenmeyen parçalar sayfada açıkça yazılır.** Modelin dikey ölçüsü tablodaki
yükseklik değeriyle örtüşmüyorsa bunun sebebi de aynı yerde anlatılır.

### Oranların kökeni — §3'ün modele uygulanması

Modelin ölçeği yayımlanmış ölçülerden gelir. Biçimini belirleyen **oranlar
yayımlanmış sayı değildir** ve her biri kökenini taşır (`lib/geometry/ratio.ts`):

| durum | anlamı |
|---|---|
| `measured` | yayımlanmış bir görselden okundu **ve** izdüşüm sınavı geçildi |
| `reading` | okundu, izdüşüm sınavı yapılmadı; kaynak ve tarih yine kayıtlı |
| `chosen` | görselden çıkarılamadı, okunabilir bir şema için seçildi |

Köken beyanı olmayan oran modele girmez. Köken **güven seviyesi değildir**: güven
"bu sayıyı kim söyledi", köken "bu oranı kim çıkardı" sorusuna cevap verir. Bu
yüzden köken gösterimi §4'teki rozet çerçevesi dilini kullanmaz ve dördüncü bir
güven varyantı üretmez; üç durum alt çizgi deseniyle ayrışır.

**İzdüşüm sınavı.** Bir okuma `measured` sayılmadan önce görselin ortografik olduğu
bilinen bir ölçüyle sınanır. Aynı çevrimsel gösterinin iki karesinin birbirini
tutması kanıt DEĞİLDİR — iki kare aynı kamerayı paylaşır. Perspektif bir görselde
yalnızca kalibrasyon düzlemindeki okumalar geçerlidir; başka derinlikteki okuma
`chosen`'a düşer. Sayım bu kuralın dışındadır: perspektif bir görüntüde de dört
yüzey dörttür.

Kaynak görsel depoya GİRMEZ. Alınan şey görüntü değil, orandır; kaydı
`content/assets.json` içinde durur.

### Annotation şeması

Konum mutlak koordinat değil, bir **parça üzerinde** orandır — ölçüler güncellenince
etiket yerinde kalır. Tip `lib/schema.ts` içinde: `part` parça kimliği, `t`
parça üzerinde 0–1 oran, `angle` yalnız dönel gövdede, etiket kendi
`confidence` değerini taşır.

Parça kimliği zorunludur: varsayılan olarak gövdeye düşmek, etiketi sessizce yanlış
yere koymak olurdu. Etiketin gösterdiği parçanın gerçekten üretildiği derleme
zamanında sınanır (`scripts/validate-content.ts`) — şema yalnızca kimliğin biçimini
doğrulayabilir, var olup olmadığını doğrulayamaz.

### Teknik

Model dekoratiftir; hiçbir bilgi yalnızca 3D içinde bulunmaz. Ekran okuyucu
kullanıcısı aynı bilgiye spec tablosundan erişir.

---

## 10. Marka

Marka adı: **Açık Dosya**. Varlıklar `public/brand/` altında, lisans kayıtları
`content/assets.json` içinde.

§4 ürünün içindeki tasarım sistemidir. §10 markanın ürün dışında da geçerli
kurallarıdır: uygulama mağazası, sosyal medya, basılı materyal, üçüncü taraf
kullanımı.

### Kilit (sembol + kelime markası)

| Kural | Değer |
|---|---|
| Boşluk payı | Sembol gövde eni × 1, dört yönde |
| Sembol–yazı aralığı | Sembol gövde eni × 1,3 |
| En küçük kilit | 96 px ekran / 26 mm basılı |
| En küçük sembol | 16 px ekran / 5 mm basılı |

### Uygulama ikonu

| Hedef | Kural |
|---|---|
| Play Store 512 px | Sembol tuvalin %60'ı, ortalanmış |
| Android adaptive | 108 dp tuval, 66 dp güvenli alan, sembol 46 dp |
| Favicon | 16 ve 32 px, tek renk, ince detay yok |

### Renk

Marka yalnızca palet içindeki renkleri kullanır (§4). Sembolün tek renk siyah
ve tek renk beyaz varyantları vardır; gradyan, gölge, kontur eklenmez.

### Yasaklar

- Sembolü döndürme, esnetme, yeniden renklendirme
- Kilidin parçalarını ayrı ayrı yeniden düzenleme
- Boşluk payının içine başka öğe sokma
- Fotoğraf veya desenli zemin üzerine tek renk varyant dışında yerleştirme
- Markayı bir kurum, üretici veya kamu kuruluşunun logosuyla yan yana,
  ortaklık ima edecek şekilde kullanma

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

## 11. Dağıtım

**Yayında:** https://acikdosya.org — 10.09.2026'dan beri.

| | |
|---|---|
| Sunucu | Adres, dizin ve portlar `.env.deploy` içinde; bağlam `deploy/RUNBOOK.md` defterinde |
| Konteyner | `acikdosya-app`, yalnızca loopback, bellek sınırı 512 MB |
| Sertifika | Let's Encrypt, `acikdosya.org` + `www`, certbot otomatik yeniler |

Dağıtım, geri dönüş, harita paketi ve ölçüm yığınının işletimi
`.claude/skills/deploy/SKILL.md` içinde. Bu bölümde kalanlar her oturumda
geçerli kısıtlardır.

### Defter ayrı dosyada — depo public

Port numarası, kurulum dizini ve makinenin kimlerle paylaşıldığı depoda
yazmaz. Tek tek zafiyet değiller ama bir arada bedava keşif bilgisi ve
komşu üretim servislerini de işaret ediyorlar.

Depoda yapının **şekli** durur: konteyner loopback'e yayın yapar,
system-nginx vekillik eder, ölçüm aynı origin altında `/veri` yolundan
servis edilir. Sayılar `deploy/RUNBOOK.md` içinde (git'te yok, iskeleti
`deploy/RUNBOOK.example.md`) ve `.env.deploy` üzerinden geçer. Vhost dosyası
`__APP_PORT__` yer tutucusu taşır; `compose.yaml` portu sunucudaki `.env`
dosyasından okur.

Bu bir sır rotasyonu değil, bilgi azaltma. Yeni sır üretilmedi, eskisi
iptal edilmedi.

### Sunucu paylaşımlı — en önemli kısıt

Makine bize ait değil; 80 ve 443 bize ait olmayan bir system-nginx'te,
arkasında başka siteler duruyor.

Bu yüzden §2'deki Caddy kararı burada uygulanmadı. Caddy o portları
isteyecekti; koymak bütün sitelerin önündeki vekili devirmek olurdu.
Yerleşik düzene girildi: konteyner loopback'e yayın yapar, nginx vhost'u ona
vekillik eder, sertifikayı `certbot --nginx` alır. Makinedeki her site aynı
deseni kullanıyor.

Yeni ve tek başına bir sunucuya taşınırsa §2'deki Caddy kararı yeniden
geçerlidir.

**Yapma:**
- `scripts/deploy.sh` içinden nginx'e dokunma. Kenar vekil bize ait olmayan
  siteleri de taşıyor; yapılandırması bir kereliktir ve elle yapılır.
- nginx'i `nginx -t` geçmeden yeniden yükleme. Düşerse makinedeki bütün
  siteler birden düşer.
- Sunucuda genel `docker image prune -a` veya `docker system prune`
  çalıştırma. Bizim olmayan imajları siler.
- `/etc/letsencrypt` altındaki verileri silme. Sertifikalar oradan yenileniyor
  ve Let's Encrypt haftalık oran sınırı uyguluyor.

### Harita paketi

Altlık kendi sunucumuzdan geliyor; paket imajın dışında durur. Üretimi ve
gönderimi deploy becerisinde.

**Yapma:**
- Üçüncü taraf tile servisine dönme. Ziyaretçinin IP adresi dışarı gitmez.
- `attributionControl`'ü kapatma veya atfı stilden çıkarma. OSM verisi ODbL
  gereği atıf ister; atıf stil dosyasının kaynak tanımında durur ki paketle
  birlikte taşınsın.
- Kapsama alanını (`maxBounds`) ikinci bir yerde tanımlama. Tek kaynak
  `scripts/build-tiles.mjs` içindeki bbox; harita onu stilin metadata
  alanından okur.
- Paketi imaja koyma. 66 MB her dağıtımda ssh üzerinden yeniden giderdi.

### Ölçüm

Kendi sunucumuzda Umami + Postgres; yığının düzeni ve kurulumu deploy
becerisinde.

Ziyaretçinin gördüğü tek adres `acikdosya.org/veri`: `next.config.ts`
içindeki yeniden yazım orayı konteyner ağındaki Umami'ye vekilliyor.
Üçüncü taraf script yok, çerez yok, çerez bandı yok. Sorgu dizesi
kaydedilmez — menzil zarfı referans noktası URL'de taşınıyor ve o nokta
ziyaretçinin seçtiği bir konumdur.

Olay sözlüğü `lib/analytics.ts` içinde tek yerde durur. Yeni olay
eklerken oraya yazılır; bileşenlere serpiştirilmiş dize kullanılmaz.

**Yapma:**
- Üçüncü taraf ölçüm (GA, Plausible bulut, Vercel Analytics) ekleme.
- Ziyaretçinin girdiği konumu, sorgu dizesini veya tam kaynak adresini
  olay verisine koyma. Kaynak bağında yalnızca alan adı taşınır.
- Umami portunu dışarı açma. Panel ssh tüneliyle açılır.
- Port numarasını, kurulum dizinini veya makinenin paylaşım bağlamını
  depoya geri yazma. Yerleri `deploy/RUNBOOK.md` ve `.env.deploy`.

### Yayındaki eksikler

1. **Düzeltme defteri tutuluyor ama iki dosyada.** TAYFUN'da on, AKINCI'da
   üç kayıt var; ATMACA ve SİPER'de henüz düzeltme yapılmadı ve sayfada
   bölüm çizilmiyor. Kayıtların çoğu `text` kolunda duruyor: eski
   değerler varyant ya da güven niteleyicisi taşıyor ve sayıya çevrilemez.
   Yalnız ölçüm koluna düşen kayıtlar dosyayla karşılaştırılıyor (§3).
2. **Harita kapsaması bölgesel.** Referans nokta paketin dışına taşınamaz
   (bbox 22,30 – 50,47). Dünyanın herhangi bir yerinden halka çizmek
   isteyen okuyucu bunu yapamaz. Bedel bilinerek kabul edildi: alternatifi
   66 MB yerine gigabaytlarca tile taşımaktı.
