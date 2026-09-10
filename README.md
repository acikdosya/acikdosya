# Savunma Sanayii İnteraktif Dosya

Türk savunma sanayii sistemlerini derinlemesine anlatan, animasyonlu ve interaktif
dijital dosya. Yayında: https://acikdosya.org — şimdilik tek sistem, TAYFUN.

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
| `./scripts/deploy.sh` | Yerelde derler, sunucuya aktarır, yeniler |

`pnpm validate:content` build'e `prebuild` olarak bağlıdır. Şemadan geçmeyen içerik
deploy'a gidemez.

## Rotalar

Türkçe varsayılan ve öneksiz, İngilizce önekli. Rota adları da çevrilir.

| Türkçe | İngilizce |
|---|---|
| `/` | `/en` |
| `/sistemler/tayfun` | `/en/systems/tayfun` |

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

## Yeni sistem eklemek

1. `content/systems/<slug>.json` oluştur. Dosya adı `slug` alanıyla birebir aynı olmalı.
2. Yeni bir kategori gerekiyorsa `lib/schema.ts` içindeki `categorySchema` enumuna ekle.
   Bilinçli karar olsun diye enum dar tutuluyor.
3. `pnpm validate:content` çalıştır.

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

Şu an MapLibre demo tile'ları kullanılıyor. Tek yapılandırma noktası `lib/config.ts`;
kendi PMTiles sunucumuza geçerken sadece orası değişir.

```bash
NEXT_PUBLIC_MAP_STYLE_URL=https://ornek/style.json
NEXT_PUBLIC_SITE_URL=https://ornek.com
```

Menzil halkaları `range_km` verisinden türer, kodda sabit değer yoktur. Halkalar
büyük daire yöntemiyle çizilir; Turf eklenmez.

### Harita lisansı — yayında bilerek kabul edilen aykırılık

`demotiles.maplibre.org` **demo ve test amaçlıdır**. GitHub Pages üzerinde barındırılır,
üretim altyapısı olarak tasarlanmamıştır ve servis garantisi yoktur.

- MapLibre demotiles deposunun kendi lisansı BSD-3-Clause.
- Kullandığımız vektör kaynağın verisi Natural Earth (kamu malı) ve OpenStreetMap
  (ODbL) kaynaklıdır. ODbL **atıf zorunluluğu** getirir.
- Servisin TileJSON'u boş `attribution` alanı gönderir. Atfı bu yüzden biz veriyoruz:
  `lib/config.ts` içindeki `MAP_ATTRIBUTION`, haritanın atıf kutusunda görünür.
- Demo stilindeki uydu ve arazi katmanları CC BY-NC-SA (ticari kullanım yasak).
  Bu proje onları kullanmaz, sadece vektör altlığı kullanır. Stil değiştirilirken
  bu kontrol tekrarlanmalı.

**Site bu kaynakla yayına çıktı (10.09.2026).** Menzil bölümüne inen her ziyaretçinin
IP adresi üçüncü tarafa gidiyor; fontları tam bu gerekçeyle self-host etmiştik.
CLAUDE.md §6 tile'ları kendi origin'imizden şart koşuyor, aykırılık bilerek kabul
edildi ve `content/assets.json` içinde `maplibre-demotiles` kaydında gerekçesiyle
duruyor.

Kendi PMTiles altlığımıza geçilince tek değişecek yer `lib/config.ts`: `MAP_STYLE_URL`
ve `MAP_SOURCES`. Atıf metni de o kaynağa göre güncellenmeli.

**Sürüm kısıtı:** `maplibre-gl` 5.x'te sabitlenmiştir. 6.9 sürümünde harita kuruluyor
ancak hiçbir kaynak yüklenmiyor, `load` olayı hiç gelmiyor ve konsola hata düşmüyor.
Yükseltmeden önce haritanın gerçekten çizildiği doğrulanmalı.

## Dağıtım

Site https://acikdosya.org adresinde yayında. Ayrıntılar ve sunucuya dair
kısıtlar [CLAUDE.md §11](./CLAUDE.md) içinde.

```bash
cp .env.production.example .env.deploy   # bir kez, sonra doldur
./scripts/deploy.sh
```

Betik yerelde Docker imajı derler, sunucuya aktarır, konteyneri yeniler ve
sağlık kontrolü yapar. Yaklaşık üç dakika.

**Sunucu paylaşımlı.** Aynı makinede 15 nginx sitesi ve başka üretim
servisleri çalışıyor. 80 ve 443 system-nginx'te; bizim konteynerimiz
`127.0.0.1:3003`'e yayın yapıyor ve nginx ona vekillik ediyor. Bu yüzden:

- Betik nginx'e dokunmaz. Vhost kurulumu bir kereliktir ve elle yapılır,
  adımları `deploy/nginx/acikdosya.org.conf` dosyasının başında.
- Sunucuda genel `docker system prune` çalıştırma, bizim olmayan imajları
  siler.

**Sitenin adresi ve iletişim adresi derleme zamanında imaja gömülür.**
Değiştirmek konteyneri yeniden başlatmakla olmaz, `deploy.sh` yeniden
çalıştırılır.

Geri dönüş sunucudaki sürüm etiketleriyle:

```bash
ssh root@46.62.206.100 'docker image ls acikdosya'
ssh root@46.62.206.100 'docker tag acikdosya:<eski-sürüm> acikdosya:latest \
                        && cd /opt/acikdosya && docker compose up -d'
```

## Ölçüm

Kendi sunucumuzda Umami. Üçüncü taraf script yok, çerez yok, çerez bandı da
yok: script `acikdosya.org/veri/script.js` adresinden servis edilir, olay ucu
da aynı origin'dedir. Ziyaretçinin IP adresi başka bir sunucuya gitmez —
fontları da tam bu gerekçeyle self-host ediyoruz.

Yığın `deploy/analytics/compose.yaml` içinde; kurulum adımları dosyanın
başında. Umami loopback'te (`127.0.0.1:3004`) durur, yönetim arayüzü ssh
tüneliyle açılır, internete kapalıdır. Uygulama konteyneri ona paylaşılan
docker ağı üzerinden ulaşır; `next.config.ts` içindeki `/veri` yeniden yazımı
tek bağlantı noktasıdır.

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
