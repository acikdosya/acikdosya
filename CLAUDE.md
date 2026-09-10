# CLAUDE.md — Savunma Sanayii İnteraktif Dosya Projesi

Bu dosya projenin kalıcı bağlamıdır. Her oturumda geçerlidir. Bir karar bu dosyayla
çelişiyorsa, önce bana sor; kendi başına değiştirme.

---

## 1. Ürün ne, ne değil

**Ne:** Az sayıda Türk savunma sanayii sistemini (başlangıç: TAYFUN) derinlemesine
anlatan, animasyonlu ve interaktif bir dijital dosya. "İnteraktif müze vitrini."

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
| Deploy | Hetzner, Docker, nginx + certbot | sunucu paylaşımlı, bkz. §11 |

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

```ts
type Confidence = 'official' | 'press' | 'estimate';

interface LocalizedText { tr: string; en: string }   // AR ileride opsiyonel alan olarak

interface Measurement {
  value: number;
  operator?: '>' | '<' | '≤' | '≥' | '~';
  confidence: Confidence;
  source: LocalizedText; // insan okuyabilir kaynak adı, EN okuyucu ikincil hedef kitle
  source_url?: string;
  verified_at: string;   // ISO tarih — 6 ay sonra "bu nereden geldi" sorusunun cevabı
}
```

Kurallar:
- `confidence` alanı olmayan sayı UI'a **çıkmaz**. İstisnası yok.
- Aynı alanda birden fazla değer varsa UI çelişkiyi görünür kılar (rozet + alt satır).
- `official` = kurumun/bakanlığın kendi açıklaması. Haber sitesinin "resmî kaynaklara
  göre" demesi `press`'tir.
- `estimate` = bağımsız değerlendirme, resmî teyit yok. Rozeti kırmızı.
- Ürün kartındaki siluet/çizimler bu veriden **türetilir**, elle çizilmez. Veri
  değişince görsel değişmeli.

Referans şema ve doldurulmuş örnek: `reference/tayfun.json`.

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
- Sayfa başına TEK orkestre edilmiş hareket anı. Ana sayfada bu an,
  hero'daki çelişen veri satırının rozetleriyle belirmesidir — yöntemi
  gösteren hareket odur. Kademeli giriş kaskadları (n öğe, artan gecikme)
  scroll'da da sayfa yüklemesinde de kullanılmaz.
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

---

## 6. Performans bütçesi

- LCP < 2.0 s (4G, orta seviye Android)
- İlk yüklemede JS < 180 KB gzip; 3D ve harita **dinamik import**, kullanıcı o
  bölüme gelmeden yüklenmez
- GLB < 3 MB, doku KTX2
- Harita tile'ları kendi origin'imizden

---

## 7. Dizin yapısı

```
app/[locale]/             # sayfalar
components/
  scale-silhouette/       # veriden türeyen SVG siluet
  spec-table/             # kaynaklı veri tablosu + güven rozetleri
  range-envelope/         # MapLibre menzil zarfı
  timeline/
  model-viewer/           # R3F, dinamik import
content/
  systems/tayfun.json
  assets.json             # görsel lisans kaydı
lib/
  geo.ts                  # jeodezik daire, mesafe
  schema.ts               # zod şemaları — build'de içeriği doğrula
  brand.ts                # sembol geometrisi ve §10 oranları, tek kaynak
  tokens.ts               # paletin JS kopyası — CSS değişkeni okuyamayanlar için
  og.tsx                  # paylaşım görselleri ve ikonlar, next/og
deploy/
  nginx/acikdosya.org.conf  # vhost, kurulum adımları başında — bkz. §11
scripts/
  deploy.sh               # yerelde derle, sunucuya aktar, yenile
reference/
  prototype.html          # çalışan tek dosya prototip, davranış referansı
  design/                 # Claude Design çıktısı — yerleşim referansı, kod değil
  tayfun.json
```

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

Gövde geometrisi `lib/geometry/missile.ts` içinde, içerik dosyasındaki `length_m` ve
`diameter_mm` alanlarından üretilir. Ölçü verisi değişirse mesh değişir. Ölçü verisi
yoksa model üretilmez — varsayılan bir değerle doldurulmaz.

Blender yalnızca yayımlanmış fotoğraflardan çıkarılabilen dış detaylar için kullanılır
(kanatçık profili, taşıyıcı araç). Bu tür varlıklar `content/assets.json`'a kaydedilir.

### Şematik, fotogerçekçi değil

Mat gri yüzey, ince kontur çizgileri, ölçü çizgileri. Fotogerçekçi doku ve render
yapılmaz — sahip olmadığımız bir doğruluk iddiası anlamına gelir.

### Kesit ve iç görünüm yasak

Patlatılmış görünüm, kesit, iç bileşen yerleşimi üretilmez. İç geometriye dair
kaynaklı verimiz yok. Etiketleme yalnızca dış bölümler üzerinde yapılır
(burun bölümü, gövde, kuyruk, kanatçık) ve her etiket kendi `confidence` değerini
taşır.

### Annotation şeması

Konum mutlak koordinat değil, orandır — ölçüler güncellenince etiket yerinde kalır.

    interface Annotation {
      id: string;
      t: number;          // gövde boyunca oran, 0 = burun ucu, 1 = kuyruk
      angle: number;      // radyal açı, derece
      label: { tr: string; en: string };
      confidence: Confidence;
    }

### Teknik

| Konu | Karar |
|---|---|
| Runtime | three.js + @react-three/fiber + @react-three/drei |
| Yükleme | `next/dynamic` + `ssr:false` + IntersectionObserver; bölüme gelmeden yüklenmez |
| Hotspot | drei `<Html occlude>` — DOM elemanı, yani çevrilebilir ve erişilebilir |
| Segment | mobil 48, masaüstü 72 |
| Fallback | WebGL yoksa mevcut `ScaleSilhouette` bileşenine düşülür |
| Bellek | R3F unmount'ta `dispose()` çağrılır — geometri ve materyal sızdırmaz |
| Hareket | `prefers-reduced-motion` ise autoRotate kapalı, `frameloop="demand"` |
| AR | `scripts/bake-glb.mjs` build'de GLB pişirir, ARCore Scene Viewer intent'i onu kullanır |

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
| Sunucu | Hetzner, 46.62.206.100, Ubuntu 24.04, 2 vCPU / 3,7 GB |
| Konteyner | `acikdosya-app`, `127.0.0.1:3003`, bellek sınırı 512 MB |
| Dizin | `/opt/acikdosya` |
| Sertifika | Let's Encrypt, `acikdosya.org` + `www`, certbot otomatik yeniler |

### Sunucu paylaşımlı — en önemli kısıt

Makine bize ait değil, üzerinde 15 nginx sitesi ve iki aydır ayakta duran
üretim konteynerleri var. 80 ve 443 system-nginx'te.

Bu yüzden §2'deki Caddy kararı burada uygulanmadı. Caddy o portları
isteyecekti; koymak bütün sitelerin önündeki vekili devirmek olurdu.
Yerleşik düzene girildi: konteyner loopback'e yayın yapar, nginx vhost'u ona
vekillik eder, sertifikayı `certbot --nginx` alır. Makinedeki her site aynı
deseni kullanıyor.

Yeni ve tek başına bir sunucuya taşınırsa §2'deki Caddy kararı yeniden
geçerlidir.

**Yapma:**
- `scripts/deploy.sh` içinden nginx'e dokunma. Kenar vekil 15 siteyi
  taşıyor; yapılandırması bir kereliktir ve elle yapılır.
- nginx'i `nginx -t` geçmeden yeniden yükleme. Düşerse 15 site birden düşer.
- Sunucuda genel `docker image prune -a` veya `docker system prune`
  çalıştırma. Bizim olmayan imajları siler.
- `/etc/letsencrypt` altındaki verileri silme. Sertifikalar oradan yenileniyor
  ve Let's Encrypt haftalık oran sınırı uyguluyor.

### Dosyalar

| Dosya | İş |
|---|---|
| `Dockerfile` | üç aşamalı, node:22-alpine, standalone çıktı, kök değil |
| `compose.yaml` | yalnızca uygulama, loopback'e yayın, bellek sınırı |
| `deploy/nginx/acikdosya.org.conf` | vhost; kurulum adımları dosyanın başında |
| `scripts/deploy.sh` | yerelde derle, aktar, yenile, sağlık kontrolü |
| `.env.production.example` | `.env.deploy` için örnek, gerçeği git'te değil |

### Güncelleme

```
./scripts/deploy.sh
```

Yerelde derler, iki etiketi (sürüm ve `latest`) sunucuya aktarır, konteyneri
yeniler, loopback'ten sağlık kontrolü yapar. nginx'e dokunmaz. Yaklaşık üç
dakika.

Geri dönüş sunucuda duran sürüm etiketleriyle yapılır:

```
docker image ls acikdosya
docker tag acikdosya:<eski-sürüm> acikdosya:latest
cd /opt/acikdosya && docker compose up -d
```

### Derleme zamanında gömülenler

`NEXT_PUBLIC_SITE_URL` ve `NEXT_PUBLIC_CONTACT_EMAIL` imaja gömülür.
Canonical, hreflang, OG ve AR adresleri ilkinden türer. Değiştirmek
konteyneri yeniden başlatmakla olmaz, imaj yeniden derlenir.

### İletişim

Düzeltme kanalı: **info@acikdosya.org**. Hakkında sayfası bu adresi
gösteriyor. Varsayılan `lib/config.ts` içinde duruyor ki derleme argümanı
geçilmemiş bir imajda da adres kaybolmasın; `NEXT_PUBLIC_CONTACT_EMAIL`
ile ezilir.

### Ölçüm

Kendi sunucumuzda Umami + Postgres, `deploy/analytics/compose.yaml`.
Kurulum adımları dosyanın başında; **yığın `deploy.sh` ile başlatılmaz**,
yalnızca dosyası güncellenir. Sırları sunucudaki `.env` dosyasında durur.

| | |
|---|---|
| Konteyner | `acikdosya-umami`, `127.0.0.1:3004`, bellek sınırı 512 MB |
| Veritabanı | `acikdosya-umami-db`, yalnızca yığının iç ağında, 256 MB |
| Ağ | `acikdosya-net`, uygulama konteyneriyle ortak |
| Yönetim | ssh tüneli (`ssh -L 3004:127.0.0.1:3004`), internete kapalı |

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

### Yayındaki eksikler

1. **Harita üçüncü taraftan.** Menzil zarfı `demotiles.maplibre.org`
   üzerinden çalışıyor; o bölüme inen her ziyaretçinin IP adresi dışarı
   gidiyor. §6 kendi origin'imizi şart koşuyor, aykırılık bilerek kabul
   edildi ve `content/assets.json` içinde gerekçesiyle kayıtlı. PMTiles
   paketi üretilince tek değişecek yer `lib/config.ts`.
