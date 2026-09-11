# Savunma Sanayii İnteraktif Dosya

[![CI](https://github.com/acikdosya/acikdosya/actions/workflows/ci.yml/badge.svg)](https://github.com/acikdosya/acikdosya/actions/workflows/ci.yml)

Türk savunma sanayii sistemlerini derinlemesine anlatan, animasyonlu ve interaktif
dijital dosya. Yayında: https://acikdosya.org — şu anda üç sistem: TAYFUN, ATMACA ve AKINCI.

Projenin kalıcı bağlamı ve pazarlık dışı editoryal kuralları [CLAUDE.md](./CLAUDE.md)
dosyasındadır. Bir karar o dosyayla çelişiyorsa önce konuşulur.

## Çalıştırma

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Komut | Ne yapar |
|---|---|
| `pnpm dev` | Geliştirme sunucusu |
| `pnpm build` | Üretim derlemesi (öncesinde içerik doğrulaması çalışır) |
| `pnpm start` | Derlenmiş uygulamayı sunar |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm lint` | ESLint |
| `pnpm validate:content` | `content/` altındaki JSON'ları şemaya sokar |
| `pnpm test` | `lib/` altındaki birim testleri (`node --test`) |
| `./scripts/deploy.sh` | Yerelde derler, sunucuya aktarır, yeniler |

`pnpm validate:content` build'e `prebuild` olarak bağlıdır. Şemadan geçmeyen içerik
deploy'a gidemez.

## Rotalar

Türkçe varsayılan ve öneksiz, İngilizce önekli. Rota adları da çevrilir.

| Türkçe | İngilizce |
|---|---|
| `/` | `/en` |
| `/sistemler/tayfun` | `/en/systems/tayfun` |
| `/sistemler/atmaca` | `/en/systems/atmaca` |
| `/sistemler/akinci` | `/en/systems/akinci` |

Kök adres tarayıcı diline bakmaz, her zaman Türkçe açılır. Paylaşılan link herkeste
aynı görünsün diye dil algılama kapalıdır.

## Dizin yapısı

```
app/[locale]/            sayfalar, kök layout burada
app/_fonts/              self-host font dosyaları ve lisansları
components/              her bileşen kendi klasöründe, CSS Module ile
content/systems/*.json   sistem verisi
content/assets.json      görsel lisans kaydı
i18n/                    next-intl rota ve istek yapılandırması
lib/schema.ts            zod şeması — veri sözleşmesi
lib/geo.ts               jeodezik daire ve mesafe
lib/format.ts            sayı, tarih ve ölçüm biçimlendirme
lib/measurement/         iki ölçüm ıraksıyor mu — aralık hesabı ve testleri
messages/                arayüz çevirileri
scripts/                 içerik doğrulayıcı
reference/               çalışan tek dosya prototip, davranış referansı
```

## Veri sözleşmesi

Her sayısal alan bir **dizidir**, çünkü açık kaynak veriler birbiriyle çelişir.
Şema `lib/schema.ts` içinde, sözleşmenin tamamı CLAUDE.md §3'te.

```jsonc
"range_km": [
  {
    "value": 280,
    "operator": ">",
    "confidence": "official",         // official | press | estimate
    "source": {"tr": "...", "en": "..."},
    "source_url": "https://...",      // opsiyonel
    "verified_at": "2026-09-10"       // gelecek tarih olamaz
  }
]
```

Kurallar şema seviyesinde zorlanır:

- `confidence`, `source` ve `verified_at` olmayan sayı UI'a çıkamaz.
- Boş dizi yazılamaz. Değer yoksa alan hiç bulunmaz.
- `operator` yalnız `> < ≤ ≥ ~` kabul eder, ASCII `<=` reddedilir.
- Şemada tanımlı olmayan alan sessizce geçmez.

**Bir sayının kaynağını bulamıyorsan alanı boş bırak.** Placeholder sayı üretmek bu
projedeki en tehlikeli hatadır. Eksik alanı `_todo` dizisine yaz:

```jsonc
"_todo": ["cep_m icin acik kaynak bulunamadi — alan bos birakildi"]
```

Doğrulayıcı bu maddeleri her çalıştığında listeler.

### Düzeltme kaydı

Yayımlanmış bir değeri değiştirince kayıt tutulur. Sessizce düzeltilen bir sayı,
"sayı verilir, kaynağı gösterilir" iddiasını bozar.

```jsonc
"revisions": [
  {
    "date": "2026-09-05",
    "field": "range_km",              // bilinen anahtar ya da serbest metin
    "from": "> 500 km",
    "to": "> 280 km",
    "reason": {"tr": "...", "en": "..."},
    "source": {"tr": "...", "en": "..."},   // opsiyonel
    "source_url": "https://..."             // opsiyonel
  }
]
```

Sistem sayfasında ayrı bir bölüm olarak çıkar (`components/revision-log/`).
Program takvimiyle karıştırılmamalı: takvim sistemin tarihini, düzeltme kaydı
bizim dosyamızın tarihini anlatır. Kayıt yoksa bölüm hiç çizilmez — boş bir
"Düzeltme geçmişi" başlığı, kaydın tutulmadığı izlenimi verir.

## Yeni sistem eklemek

1. `content/systems/<slug>.json` oluştur. Dosya adı `slug` alanıyla birebir aynı olmalı.
2. Yeni bir kategori gerekiyorsa `lib/schema.ts` içindeki `categorySchema` enumuna ekle.
   Bilinçli karar olsun diye enum dar tutuluyor.
3. Kategoriye göre özel davranışları gözden geçir:
   - Füzelerde `range_km` zorunludur ve menzil zarfı çizilir.
   - İHA'larda (`insansiz-hava-araci`) menzil zarfı ve 3D model üretilmez;
     `wingspan_m` gibi uçak ölçüleri kullanılır.
4. `pnpm validate:content` çalıştır.

Sayfa `generateStaticParams` ile kendiliğinden üretilir.

## Görsel lisans kaydı — pazarlık dışı

Repoya giren her görselin lisansı `content/assets.json` içinde kayıtlı olmalıdır.

```json
{
  "assets": [
    {
      "file": "images/ornek.jpg",
      "license": "CC BY-SA 4.0",
      "source_url": "https://commons.wikimedia.org/...",
      "attribution": "Fotoğrafçı adı"
    }
  ]
}
```

- `file` yolu `public/` altına görelidir. Doğrulayıcı dosyanın diskte var olduğunu kontrol eder.
- Dört alanın dördü de zorunludur. Lisansı bilinmeyen görsel commit edilmez.
- Wikimedia'daki her dosya serbest değildir. Dosya sayfasındaki lisansı tek tek oku.

## Fontlar

Archivo ve Source Serif 4 self-host edilir, Google CDN kullanılmaz. Dosyalar
`app/_fonts/` altında, ikisi de SIL Open Font License 1.1 (lisans metinleri aynı dizinde).

Türkçe için her fontun **iki** alt kümesi gerekir: `ü ö ç ı` latin alt kümesinde,
`ğ ş İ Ğ Ş` latin-ext'te. Font stack'inde latin ailesi önce, ext hemen arkasında gelir.
Tek dosyayla yetinilirse ş ve ğ sistem fontuna düşer.

## Harita

Altlık kendi sunucumuzdan geliyor. Üçüncü taraf tile servisi yok: PMTiles arşivi,
stil dosyası, glifler ve sprite `public/tiles/` altında durur ve uygulama onları
kendi origin'inden sunar.

```bash
pnpm build:tiles     # ağ gerektirir, ~1 dakika, çıktı 66 MB
```

Script `scripts/build-tiles.mjs`:

| | |
|---|---|
| Kaynak | Protomaps günlük planet yapısı (OpenStreetMap, ODbL) |
| Kapsama | bbox 22,30 – 50,47 — Türkiye ve çevresi |
| Zoom | 0–9 (daha yakını MapLibre büyüterek gösterir) |
| Çıktı | `turkiye-<yapı-tarihi>.pmtiles`, `style.json`, `fonts/`, `sprites/`, `build.json` |
| Araç | go-pmtiles 1.31.2, SHA-256 sabitli |

Çıktı git'te **durmaz** (`.gitignore`). Hangi günün OSM verisi olduğu
`public/tiles/build.json` içinde yazar; lisans kaydı `content/assets.json` içinde
üç ayrı satırdır (`basemap-tiles`, `basemap-glyphs`, `basemap-sprites`).

Paketi üretmeden çalışan bir kopyada harita boş kalır. O durumda başka bir stile
bakmak için:

```bash
NEXT_PUBLIC_MAP_STYLE_URL=https://ornek/style.json
```

### Atıf ve kapsama

OSM verisi ODbL gereği atıf ister. Atıf **stil dosyasının kaynak tanımında** durur,
haritanın kurulumunda değil: paket nereye giderse yükümlülük onunla gider. MapLibre
bunu kendi atıf kutusunda gösterir, kontrol kapatılmaz. Aynı bilgi sayfa altbilgisinde
gerçek bağ öğeleriyle bir kez daha görünür (`MAP_SOURCES`).

Harita kapsama alanının dışına kaydırılamaz: sınırlar stilin `metadata` alanından
okunur ve `maxBounds` olarak uygulanır, koordinat alanları da aynı aralığa kapanır.
Kapsama iki yerde tanımlı değildir — tek kaynak script'teki bbox.

Etiketler okuyucunun dilini izler. Paket tek: adların hepsi tile içinde, değişen
yalnızca hangi ad alanının önce denendiği (`name:tr` / `name:en`). Türkçe veya
İngilizce adı olmayan küçük yerleşim etiketsiz kalır — karşılığında ilk harita
görünümü sekiz yerine dört glif aralığı indirir.

### Önbellek

Arşivin adı yapı tarihini taşır, yani içeriği değişince adresi de değişir. Başlıklar
`next.config.ts` içindeki `headers()` ile gönderilir, kenar vekile dokunmak gerekmez:

| Yol | Cache-Control |
|---|---|
| `/tiles/*.pmtiles` | `public, max-age=31536000, immutable` |
| `/tiles/style.json` | `public, max-age=300` |
| `/tiles/fonts/*`, `/tiles/sprites/*` | `public, max-age=604800` |

nginx ve Caddy karşılıkları `deploy/nginx/acikdosya.org.conf` sonunda örnek olarak
duruyor — kurulu değil.

Menzil halkaları `range_km` verisinden türer, kodda sabit değer yoktur. Halkalar
büyük daire yöntemiyle çizilir; Turf eklenmez. Menzil zarfı yalnızca füze
kategorilerinde (`balistik-fuze`, `seyir-fuzesi`) çizilir; `insansiz-hava-araci`
kategorisi için çizilmez.

**Sürüm kısıtı:** `maplibre-gl` 5.x'te sabitlenmiştir. 6.9 sürümünde harita kuruluyor
ancak hiçbir kaynak yüklenmiyor, `load` olayı hiç gelmiyor ve konsola hata düşmüyor.
Yükseltmeden önce haritanın gerçekten çizildiği doğrulanmalı.

## Keşfedilebilirlik

`/robots.txt` ve `/sitemap.xml` kök seviyede üretilir. Site haritası her sayfanın
iki dildeki karşılığını `alternates.languages` ile verir; rota adları çevrildiği
için (`/yontem` karşısında `/en/method`) arama motorunun bunu kendiliğinden
bilmesi beklenmez.

Her sayfa kanonik adresini ve `hreflang` bağlarını taşır: `tr`, `en` ve
`x-default`. `x-default` Türkçeyi gösterir, çünkü kök adres her tarayıcıda
Türkçe açılır (`localeDetection: false`) — başka bir dili göstermek arama
motoruna yanlış söz vermek olurdu. Tek kaynak `lib/urls.ts`.

### Yapısal veri

Sistem sayfaları JSON-LD taşır (`lib/structured-data.ts`), iki tür:

- **Article** — sayfanın kendisi: başlık, özet, son güncelleme, yayımlayan.
- **Dataset** — sayfadaki ölçümler. Her değer `variableMeasured` içinde birimi,
  güven seviyesi ve kaynağıyla birlikte. Çelişen değerler tek bir "doğru" değere
  indirgenmez; sayfada nasıl duruyorsa öyle listelenir.

Operatör değerin parçasıdır: `> 280 km` schema.org'un `minValue` alanına,
`≤ 1.000 km` `maxValue` alanına yazılır. Sahip olmadığımız bir kesinlik iddia
edilmez.

Sayfada görünmeyen hiçbir alan yapısal veriye girmez. §5 sınırları burada da
geçerlidir: hedef, hedef sınıfı, operasyonel yorum yok.

### Paylaşım görselleri

`app/[locale]/opengraph-image.tsx` ve sistem sayfası için ayrı bir tane.
Adresleri elle yazılır (`ogImage`, `lib/urls.ts`): Next'in dosya sözleşmesinden
ürettiği adres `[locale]` segmentini kullanıyor ve Türkçe için `/tr/...`
çıkıyordu, o da 307 ile öneksize dönüyordu. Yönlendirmeyi izlemeyen paylaşım
istemcisi görseli hiç göstermez.

Görsel rotası **çevrilmez**: İngilizce sistem sayfasının görseli
`/en/sistemler/<slug>/opengraph-image` adresindedir, sayfanın kendisi
`/en/systems/<slug>` olsa bile.

## Dağıtım

Site https://acikdosya.org adresinde yayında. Ayrıntılar ve sunucuya dair
kısıtlar [CLAUDE.md §11](./CLAUDE.md) içinde.

```bash
cp .env.production.example .env.deploy   # bir kez, sonra doldur
./scripts/deploy.sh
```

Betik yerelde Docker imajı derler, sunucuya aktarır, konteyneri yeniler ve
sağlık kontrolü yapar. Yaklaşık üç dakika.

**Sunucu paylaşımlı.** 80 ve 443 bize ait olmayan bir system-nginx'te.
Konteyner yalnızca loopback'e yayın yapar, nginx vhost'u ona vekillik eder,
sertifikayı certbot alır. Bu yüzden:

- Betik nginx'e dokunmaz. Vhost kurulumu bir kereliktir ve elle yapılır.
- Sunucuda genel `docker system prune` çalıştırma, bizim olmayan imajları
  siler.

Port, kurulum dizini ve kurulum adımları `deploy/RUNBOOK.md` içinde; o dosya
git'te durmaz, iskeleti [deploy/RUNBOOK.example.md](./deploy/RUNBOOK.example.md).
Depoda yapının şekli var, sayıları yok: tek tek zafiyet değiller ama bir arada
bedava keşif bilgisi ve aynı makinedeki komşu servisleri de işaret ediyorlar.
Değerler `.env.deploy` üzerinden geçer; vhost dosyası `__APP_PORT__` yer
tutucusu taşır.

**Sitenin adresi ve iletişim adresi derleme zamanında imaja gömülür.**
Değiştirmek konteyneri yeniden başlatmakla olmaz, `deploy.sh` yeniden
çalıştırılır.

Geri dönüş sunucudaki sürüm etiketleriyle:

```bash
ssh "$DEPLOY_HOST" 'docker image ls acikdosya'
ssh "$DEPLOY_HOST" 'docker tag acikdosya:<eski-sürüm> acikdosya:latest \
                        && cd "$DEPLOY_DIR" && docker compose up -d'
```

## Ölçüm

Kendi sunucumuzda Umami. Üçüncü taraf script yok, çerez yok, çerez bandı da
yok: script `acikdosya.org/veri/script.js` adresinden servis edilir, olay ucu
da aynı origin'dedir. Ziyaretçinin IP adresi başka bir sunucuya gitmez —
fontları da tam bu gerekçeyle self-host ediyoruz.

Yığın `deploy/analytics/compose.yaml` içinde; kurulum adımları runbook'ta.
Umami loopback'te durur, yönetim arayüzü ssh tüneliyle açılır, internete
kapalıdır. Uygulama konteyneri ona paylaşılan docker ağı üzerinden ulaşır;
`next.config.ts` içindeki `/veri` yeniden yazımı tek bağlantı noktasıdır —
ziyaretçi ölçümü aynı origin altında, `acikdosya.org/veri` yolundan görür.

Site kimliği derleme zamanında gömülür (`UMAMI_WEBSITE_ID`). Boşsa tarayıcı
script'i hiç basılmaz — yerelde ölçüm kapalıdır, kapatmak için ayrı bayrak yok.

İzlenen olaylar `lib/analytics.ts` içinde tek sözlükte durur:

| Olay | Ne zaman |
|---|---|
| `harita-etkilesim` | menzil zarfında işaretçi taşındı ya da halka açılıp kapandı (sayfa başına bir kez) |
| `model-yuklendi` | 3D bölüm görüntüye girdi ve görüntüleyici kuruldu (`webgl` verisiyle) |
| `varyant-degisti` | model bölümünde varyant değiştirildi |
| `yontem-gidis` | yöntem sayfasına giden bağ tıklandı |
| `kaynak-tikla` | bir ölçümün kaynak bağı tıklandı (tam adres değil, yalnızca alan adı) |

Sunucuda çizilen bağlara olay `data-track-event` özniteliğiyle takılır;
`components/analytics/Analytics.tsx` içindeki tek dinleyici toplar. Böylece
kaynak bağları için bir bileşeni istemciye taşımak gerekmez.

Sorgu dizesi kaydedilmez. Menzil zarfı referans noktasını URL'de taşıyor
(`?ref=41.0,29.0`); o nokta ziyaretçinin seçtiği bir konum, kaydı tutulmaz.

## Editoryal sınırlar

Tam listesi CLAUDE.md §5'te. Kısaca:

- Hedef dili yok. Menzil halkası çizilir; hedef şehir veya ülke etiketlenmez,
  vurgulanmaz. Terim: "menzil zarfı", "referans nokta".
- Üretim, güdüm iç yapısı, harp başlığı tasarımı konularında teknik detay yok.
- Çatışma veya patlama görseli yok.
- Üretici logoları kullanılmaz, hiçbir yerde resmî izlenimi verilmez. Bağımsızlık
  ibaresi her sayfanın altında bulunur.

Bu proje yayımlanmış açık kaynaklardan derlenir ve **resmî bir yayın değildir**.
Yukarıdaki kurallar projenin bir parçasıdır; onları kaldıran türevler bu
projeyle ilişkili değildir.

## Kim yazıyor

Muhammed Said Çakır — [@muhammedsaidckr](https://github.com/muhammedsaidckr).

Proje bağımsızdır: hiçbir kurum, üretici ya da kamu kuruluşuyla ilişkisi,
onlardan aldığı destek yoktur. Ad burada açıkça duruyor çünkü bu alanda
anonim yayın kaynağı sorgulanamaz hale getirir; kaynağını gösteren bir
dosyanın yazarını gizlemesi tutarsız olurdu.

Düzeltme ve iletişim: info@acikdosya.org

## Katkı

En değerli katkı yeni özellik değil, yanlış bir sayının düzeltilmesidir.
Kaynağı olmayan bildirim değerlendirilmez — bu kural bize de uygulanıyor.

Yol: [CONTRIBUTING.md](./CONTRIBUTING.md).
Güvenlik açığı issue olarak açılmaz: [SECURITY.md](./SECURITY.md).

Tartışma kuralları: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md). Konu gereği
issue'larda hararetli tartışma çıkar; kural önceden yazılı olmazsa bir
thread'i kilitlemek keyfi görünür. İletişim: info@acikdosya.org.

## Lisans

Üç ayrı şey var ve aynı lisansla yönetilemezler.

| Katman | Lisans |
|---|---|
| Kod | AGPL-3.0 — [LICENSE](./LICENSE) |
| İçerik ve veri (`content/`, `messages/`, belgeler) | CC BY 4.0 — [LICENSE-CONTENT](./LICENSE-CONTENT) |
| Marka | Lisans kapsamı **dışında** |

**Kod neden AGPL:** siteyi çalıştıran türevleri de kaynağını açmaya zorlar.
Bu projede asıl kopyalanma riski ikili dağıtım değil, kodu alıp kapalı bir
site kurmaktır.

**Marka:** "Açık Dosya" adı ve `public/brand/` altındaki logo varlıkları
hiçbir lisansla verilmez. Türev çalışmalar bu adı ve logoyu kullanamaz.

Bunun sebebi telif değil. Kodu ve veriyi açmak, birinin fork'layıp editoryal
kuralları — hedef dili yasağını, sorumluluk ibaresini — kaldırıp yayınlamasını
engellemez. Onu engelleyen şey marka hakkıdır: fork edebilirler, "Açık Dosya"
adıyla yayınlayamazlar.

Depoya giren görseller bu lisansların dışındadır; her birinin kendi lisansı
`content/assets.json` içinde kayıtlıdır. Harita altlığı OpenStreetMap
verisidir, ODbL.
