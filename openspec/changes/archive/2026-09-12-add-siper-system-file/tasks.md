## 1. Nesne ekseni ve kıyas

- [x] 1.1 `lib/schema.ts` içine ölçümün `object` alanını kapalı küme olarak ekle
  (`fuze`, `sistem`, `atici`); `pnpm typecheck` geçsin ve tanımsız bir ad taşıyan
  örnek kayıt şemadan reddedilsin
- [x] 1.2 `lib/measurement/divergence.ts` içindeki `COMPARISON_AXES` dizisine `object`
  eksenini ekle; `pnpm test` geçsin
- [x] 1.3 `lib/measurement/divergence.test.ts` içine üç durumu sınayan testler yaz —
  iki taraf dolu ve farklı → `farkli-kapsam`, tek taraf dolu → `belirsiz`, iki taraf
  boş → eksen atlanır; `pnpm test` geçsin
- [x] 1.4 Yayındaki üç dosyada gerileme olmadığını sınayan bir test yaz: `object`
  taşımayan bir dosyanın ıraksama sonuçları eksen eklenmeden önceki sonuçlarla aynı
  kalsın; `pnpm test` geçsin
- [x] 1.5 `lib/measurement/divergence.ts` içindeki `UNITS` tablosuna `adet` ve
  `derece` boyutlarını ekle; iki farklı boyutun kıyaslanmasının hata attığını sınayan
  test geçsin

## 2. Sistem düzeyi ölçü alanları

- [x] 2.1 `lib/schema.ts` `specKeys` listesine sistem alanlarını ekle: önleme menzili,
  önleme irtifası, yanca kapsama, izleme / angajman / güdülebilen füze kapasitesi,
  atıcı taşıma kapasitesi; `pnpm typecheck` geçsin
- [x] 2.2 `lib/format.ts` `SPEC_UNITS` tablosuna yeni alanların birimlerini ekle;
  eksik birim derlemeyi düşürsün (`Record<SpecKey, SpecUnit>` exhaustive)
- [x] 2.3 `messages/tr.json` ve `messages/en.json` `Specs` bloklarına yeni alan
  etiketlerini ekle; `pnpm test` içindeki `lib/messages.test.ts` geçsin
- [x] 2.4 Türkçe karakter kontrolü: yeni etiketlerde ğ ş ı İ ç ö ü doğru render
  olsun; `pnpm build` çıktısında font subset uyarısı çıkmasın

## 3. Üretici ve takvim göçü

- [x] 3.1 `lib/schema.ts` `manufacturer` alanını diziye çevir (`min(1)`) ve opsiyonel
  program yürütücüsü alanını ekle; `pnpm typecheck` geçsin
- [x] 3.2 `content/systems/tayfun.json`, `atmaca.json`, `akinci.json` dosyalarında
  `manufacturer` nesnesini diziye sar; `pnpm validate:content` geçsin
- [x] 3.3 `manufacturer` okuyan tüketicileri güncelle (sistem sayfası başlığı,
  `SystemCard`, `opengraph-image`, `lib/structured-data.ts`); `pnpm typecheck &&
  pnpm lint` geçsin ve üç sistem sayfası aynı üretici adını göstermeye devam etsin
- [x] 3.4 `lib/schema.ts` takvim olayına `date_kind` (`event` varsayılan,
  `announcement`) ve opsiyonel `announced_at` alanlarını ekle; üç dosya değişmeden
  `pnpm validate:content` geçsin
- [x] 3.5 `components/timeline/Timeline.tsx` duyuru tarihli olayı olay tarihinden
  ayırt ederek göstersin; `messages/*.json` karşılığı eklensin ve
  `lib/messages.test.ts` geçsin

## 4. Köken kaydı

- [x] 4.1 `lib/schema.ts` içine sistem düzeyi köken kaydını ekle: kimlik, belge adı,
  adres, erişilip erişilmediği, taşıyan yayın listesi (`min(1)`), her yayında aynı
  yayıncı bayrağı; boş liste ve sayaç alanı şemadan reddedilsin
- [x] 4.2 Ölçüme ve takvim olayına opsiyonel köken kimliği alanı ekle; kimlik alanı
  dolu ama karşılığı tanımsız olan bir kaydı `scripts/validate-content.ts` düşürsün
  ve bunu sınayan test geçsin
- [x] 4.3 Ölçüm kaydına doğrudan tekrar sayısı yazılmasını şema düzeyinde imkânsız
  kıl (`strictObject` bilinmeyen alanı reddediyor); bunu sınayan test geçsin
- [x] 4.4 Köken kaydını sistem sayfasında göster: köken belgesi, taşıyan yayınlar,
  aynı yayıncı tekrarı ayrı okunacak şekilde; `pnpm typecheck && pnpm lint` geçsin
- [x] 4.5 Sayının listeden türediğini sınayan test yaz — kayıtta ayrı bir sayaç
  bulunmadığı ve gösterilen sayının liste uzunluğuna eşit olduğu doğrulansın

## 5. Menzil halkası

- [x] 5.1 `lib/schema.ts` içine halkayı hangi alanın çizdiğini söyleyen içerik kaydını
  ekle; kayıt opsiyonel olsun ve yokluğunda halka çizilmesin
- [x] 5.2 `components/range-envelope/rings.ts` kategori dalını kaldır, halka alanını
  içerik kaydından oku; `pnpm test` geçsin
- [x] 5.3 Üç yayındaki dosyaya halka kaydını yaz (TAYFUN ve ATMACA menzil alanı,
  AKINCI kayıt taşımaz); `pnpm validate:content` geçsin ve üç sayfanın halkaları
  değişmeden kalsın — mevcut halka sayıları ve sayısı sınanacak
- [x] 5.4 Menzil alanı taşıyıp halka kaydı taşımayan dosyayı `scripts/validate-content.ts`
  uyarı olarak raporlasın, derlemeyi düşürmesin; uyarı çıktısını sınayan test geçsin
- [x] 5.5 Harita lejantına halkanın irtifa bileşenini göstermediğini söyleyen satırı
  ekle (`messages/tr.json`, `en.json`); `lib/messages.test.ts` geçsin
- [x] 5.6 Halkanın üretilmiş görsele girmediğini sınayan test yaz: paylaşım kartları
  ve OG görselleri harita kesiti taşımasın

## 6. Kategori ve geometri

- [x] 6.1 `lib/schema.ts` kategori enumuna `hava-savunma-sistemi` ekle;
  `pnpm typecheck` bu adımda `CATEGORY_COVERAGE` ve `CATEGORY_KIND` eksik satırları
  yüzünden DÜŞSÜN — exhaustive kontrolün çalıştığı böyle doğrulanır
- [x] 6.2 `lib/geometry/coverage.ts` ve `lib/geometry/measurements.ts` tablolarına
  yeni kategori satırını yaz (`modelled`, `missile`); `pnpm typecheck` geçsin
- [x] 6.3 `messages/tr.json` ve `en.json` `Categories` bloklarına yeni kategoriyi
  ekle; `lib/messages.test.ts` geçsin
- [x] 6.4 Ürün-1 ve Ürün-2 için ürün tanımını yaz — tek dosya iki oran tablosu mu iki
  ayrı dosya mı olduğu bu adımda karara bağlanır (design.md Open Questions); her oran
  köken beyanı taşısın ve ortografik kaynak görsel olmadığı için hepsi `chosen` olsun
- [x] 6.5 `lib/geometry/registry.ts` içine kayıt satırını ekle; siluet ve model aynı
  parça listesinden türesin, `pnpm test` geçsin

## 7. İçerik

- [x] 7.1 `docs/research/siper-sources.md` dosyasını yaz — `atmaca-sources.md`
  biçiminde kaynak matrisi, kaynak başına bölüm, köken ile tekrarın ayrıldığı örüntüler
- [x] 7.2 `content/systems/siper.json` dosyasını yaz: iki füze varyantı, sistem
  düzeyi ölçüler, köken kayıtları, takvim, düzeltme defteri yok (henüz düzeltme
  yapılmadı); `pnpm validate:content` geçsin
- [x] 7.3 SİPER-A ve SİPER-4 adlarını `attributes.variant_names` kaydına yaz; ayrı
  varyant girdisi AÇMA
- [x] 7.4 Kanister ölçülerinin neden girmediğini `_todo` kaydına yaz (eksen adları
  kaynakta belirtilmemiş); `pnpm validate:content` bunu rapor etsin
- [x] 7.5 ASELSAN belge geneli ±%10 toleransını K3 kaynaklı kayıtlara `context_note`
  olarak yaz; `uncertainty` alanı hiçbir kayıtta doldurulmasın
- [x] 7.6 `content/assets.json` `rejected` dizisine raporun Bölüm 7 bulgularını ekle
  (açık lisanslı SİPER görseli bulunamadı, gerekçeleriyle); `pnpm validate:content`
  geçsin
- [x] 7.7 Dosyanın `hero` işaretçisi TAŞIMADIĞINI doğrula — işaretçi `tayfun.json`
  üzerinde kalsın, iki işaretçi `pnpm validate:content` tarafından reddedilsin

## 8. Doğrulama

- [x] 8.1 `pnpm typecheck && pnpm lint && pnpm test && pnpm validate:content` tamamı
  geçsin
- [x] 8.2 `pnpm build` geçsin; GLB çıktısı 3 MB sınırının altında ve ilk yükleme JS
  bütçesi 180 KB gzip içinde kalsın
- [x] 8.3 SİPER sayfasını iki dilde aç; menzil halkası sistem önleme menzilinden
  çizilsin, füze menzili tabloda kalsın, irtifa notu lejantta görünsün
- [x] 8.4 Sistem sayfasındaki ıraksama okumasını gözle doğrula: füze menzili ile
  sistem önleme menzili "aynı alanda ayrışan değerler" olarak GÖSTERİLMESİN
- [x] 8.5 Köken kaydının sayfada okunduğunu doğrula: altı yayıncılı tekrar ile aynı
  yayıncının kendi devam yazısı farklı okunsun
- [x] 8.6 JSON-LD çıktısını kontrol et — sistem düzeyi alanların yapısal veriye girip
  girmeyeceği bu adımda karara bağlanır (design.md Open Questions); sayfada
  görünmeyen hiçbir alan JSON-LD'ye girmesin
