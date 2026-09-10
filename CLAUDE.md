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
| Deploy | Hetzner, Docker, Caddy | mevcut altyapı |

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

interface Measurement {
  value: number;
  operator?: '>' | '<' | '≤' | '≥' | '~';
  confidence: Confidence;
  source: string;        // insan okuyabilir kaynak adı
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

Prototipte oturmuş palet — koru:

```css
--ground:#E4E5E1;  --paper:#F3F4F1;
--ink:#1C2124;     --ink-2:#5C6367;   --rule:#C6C9C3;
--signal:#B3131B;  --signal-soft:rgba(179,19,27,.09);
```

- Tipografi: **Archivo** (başlık, sayı, UI — tabular figürler açık),
  **Source Serif 4** (gövde metni, 18px, satır yüksekliği 1.62).
- Güven rozetleri: `official` düz çerçeve / `press` kesikli çerçeve, soluk /
  `estimate` kırmızı çerçeve + soft dolgu. Aynı stil haritadaki halkalarda da
  kullanılır — dil tutarlı olmalı.
- Sol kenardaki ölçü cetveli motifi projenin imzası. Dekorasyon değil; sayfa
  ölçüm hakkında olduğu için var.

**Yapma:**
- Her bölüme scroll'da fade-up animasyonu ekleme. Tek orkestre edilmiş an
  (hero siluet çizimi) yeterli; gerisi kullanıcı hareketine cevap versin.
- Her şeyi eşit köşe yarıçaplı karta bölme.
- Etiketleri ALL CAPS yapma.
- `prefers-reduced-motion` her animasyonda desteklenecek.

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
reference/
  prototype.html          # çalışan tek dosya prototip, davranış referansı
  tayfun.json
```

---

## 8. Çalışma şeklim

- Büyük değişiklikten önce plan çıkar, onay al.
- Her PR/adım sonunda `pnpm typecheck && pnpm lint` çalışsın.
- Zod şeması içerik dosyalarını build zamanında doğrulasın — bozuk veri deploy'a gitmesin.
- Türkçe karakterler her yerde test edilsin (İ/ı/ğ/ş sıralama ve font desteği).
- Emin olmadığın yerde tahmin etme, sor.
