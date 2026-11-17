## 1. Şema ve birimler

- [x] 1.1 `lib/schema.ts`: `cruise_speed_mach`, `max_speed_mach`, `combat_radius_nm` alanları, gerekçe yorumuyla; `pnpm typecheck` geçsin
- [x] 1.2 `lib/measurement/divergence.ts`: `mach` (ayrı boyut) ve `nm` (1852 m) birimleri, `convertValue()`; `pnpm typecheck` geçsin
- [x] 1.3 `lib/measurement/divergence.test.ts`: 500 NM ↔ 926 km ve Mach → KTAS hatası testleri; `pnpm test` geçsin
- [x] 1.4 `lib/format.ts`: `SPEC_UNITS` ve `UNIT_LABELS` satırları (`Mach`, `NM`); `pnpm typecheck` geçsin
- [x] 1.5 `messages/tr.json`, `messages/en.json`: `Specs` alan etiketleri; `pnpm typecheck` geçsin

## 2. Mesafe cetveli ve doğrulayıcı

- [x] 2.1 `components/range-scale/RangeScale.tsx`: `combat_radius_nm` cetvele girer, çubuk `convertValue` ile km ölçeğinde, değer kaynağın biriminde; `pnpm typecheck` geçsin
- [x] 2.2 `components/range-scale/RangeScale.tsx` + mesajlar: `captionRadius`, tek `<figcaption>`, kullanılmayan `kmLabel` kaldırılır; `pnpm lint` geçsin
- [x] 2.3 Cetvel değer etiketi testi: km alanı `6.000 km` (değişmedi), NM alanı `500 NM`; `pnpm test` geçsin
- [x] 2.4 `app/[locale]/sistemler/[slug]/page.tsx`: menzil beyanı koşuluna `combat_radius_nm`; `pnpm typecheck` geçsin
- [x] 2.5 `scripts/validate-content.ts`: `nm` alanları menzil beyanı sayılır (uyarı); `pnpm validate:content` geçsin

- [x] 2.6 `components/scale-silhouette`: ölçek şemasının `aria-label`'ı çizilene göre seçilir (`aircraftDrawingKind`: dış hat / kesikli zarf / karışık); modelsiz ilk dosya KIZILELMA'da "dış hat" diyordu; `pnpm test` geçsin

## 3. İçerik

- [x] 3.1 `content/systems/kizilelma.json`: ürün sayfasının on bir beyanı, `power_system`, `communications`, `variant_names`; kaynaksız sayı yok, eksik alan `_todo`'ya; `pnpm validate:content` geçsin
- [x] 3.2 `content/systems/kizilelma.json`: `status` ve `timeline` yalnız kaynaklı kayıtlardan (BAYKAR bülteni `official`, aktarılmış ajans metni `press`); bulunamayan olay yazılmaz; `pnpm validate:content` geçsin
- [x] 3.3 Ürün sayfasının eski sürümlerinde ve broşürlerde farklı değer varsa ayrı kayıt: arşiv kaydı `archive_url` + `document_version` (kayıt aralığı) + `context_note` ile, `stated_at` YAZILMAZ (açıklama günü bilinmiyor, yalnız arşivin kayıt günü); broşür `source_sha256` ile; test sonucu `scope: test`; `pnpm validate:content` geçsin
- [x] 3.4 `content/assets.json`: `kizilelma-turntable-refs` referans kaydı (`presence: absent`, 18 kare, sha256 eşleşmesi notu); `pnpm validate:content` geçsin
- [x] 3.5 `docs/research/kizilelma-sources.md`: REA gözlemi ve Evidence kimliği, kaynaklar, yayın kararları, karelerden ilk okumalar (yükseklik 3,69 m ↔ yayımlanan 3,5 m); `pnpm lint` geçsin

## 4. Belgeler

- [x] 4.1 `CLAUDE.md` §1 yayındaki dosya listesi ve §3 menzil halkası bölümü (görev yarıçapı cümlesi); README'de dosya sayısı geçiyorsa güncellenir; `pnpm lint` geçsin

## 5. Doğrulama

- [x] 5.1 `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm validate:content` geçsin; yayındaki beş dosyanın uyarı kümesi değişmemiş olsun
- [x] 5.2 `pnpm build` ve KIZILELMA sayfası TR/EN tarayıcıda: tablo, cetvel (500 NM), model bölümü açılmıyor, İ/ı doğru çiziliyor

## Workflow follow-up

- Arşiv: `range-envelope` ana spec'i senkronlanır.
- PR 2 ayrı değişiklik: istasyon başına kesit profili ve parametrik model.
