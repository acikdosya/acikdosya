# Tasks

## 1. Şema kilidi

- [x] 1.1 `lib/schema.ts` içinde `attributeSchema.source` ve `attributeSchema.verified_at`,
  `timelineEventSchema.source` alanlarını zorunlu yap; iki şemanın başlık yorumunu
  kuralı ve K1 gerekçesini (köken kaynak adının yerine geçmez) söyleyecek biçimde
  güncelle; `pnpm typecheck` geçsin
- [x] 1.2 `lib/attribution.test.ts` yaz: kaynaksız özellik, `verified_at`'siz özellik,
  kaynaksız takvim olayı ve yalnız `origin_id` taşıyan takvim olayı şemadan reddedilsin;
  `content/systems/atmaca.json`, `akinci.json`, `siper.json` olduğu gibi şemadan
  geçsin; `pnpm test` geçsin
- [x] 1.3 `pnpm validate:content` çalıştır ve çıktıyı denetim listesi olarak kaydet:
  hatalar yalnız `content/systems/tayfun.json` içinde ve tam dokuz kayda işaret etmeli
  (dört takvim olayı; `tayfun.propellant`, `tayfun.stages`, `tayfun-blok-4.guidance`,
  `tayfun-blok-4.propellant`, `tayfun-blok-4.stages`). Sayı dokuzdan farklıysa dur ve
  sebebini bul (design K7)

## 2. TAYFUN içerik borcu

Her görevde arama sırası design K4: kurumun kendi kanalı → ajans ve basın → hiçbiri.
Bulunamayan kayıt çıkar, nedeni `_todo`'ya yazılır; yer tutucu değer, tahmini tarih ya
da kaynağa bakılmadan yazılmış `verified_at` girmez (CLAUDE.md §5.7). Defter kaydı
gereken durumlar ve biçim design K5'te; yeni kayıtlar `revisions` dizisinin sonuna
eklenir.

- [x] 2.1 `content/systems/tayfun.json` `tayfun.propellant` ve `tayfun.stages` için kaynak
  ara. Bulunursa `source`, `source_url`, `verified_at` yaz ve güveni kaynağa göre
  belirle; `official` değişiyorsa ya da kayıt çıkıyorsa her alan için ayrı defter kaydı
  düş (`"Katı yakıt (resmî)"` → yeni hal ya da `removed`); `pnpm validate:content`
  çıktısında bu iki kayıt kalmasın
- [x] 2.2 `tayfun-blok-4.propellant` için kaynak ara; aynı kural, defter metninde varyant
  adı niteleyicinin içinde (`"Katı yakıt (TAYFUN BLOK-4, basın)"`); `pnpm validate:content`
  çıktısında kayıt kalmasın
- [x] 2.3 `tayfun-blok-4.guidance` ve `tayfun-blok-4.stages` ("Açıklanmadı") alanlarını
  çıkar; her biri için `to: {"kind": "removed"}` defter kaydı, gerekçe "veri yokluğu
  değer olarak yazılmaz" (kaynak bulunamadığı için değil); `pnpm validate:content`
  çıktısında kayıt kalmasın
- [x] 2.4 Takvim 2022-10-18 "İlk test atışı" için kaynak ara (SSB, MSB ya da ROKETSAN
  açıklaması önce); `source`, `source_url` yaz, güveni kaynağa göre belirle; tarih,
  yer ya da güven değişirse alanı `timeline` olan defter kaydı düş; `pnpm validate:content`
  çıktısında olay kalmasın
- [x] 2.5 Takvim "BLOK-4 duyurusu" için kaynak ara. Kaynak yalnız ayı veriyorsa tarihi
  `2025-07` yap; günü veriyorsa o günü yaz. Olayın 2025-07-22 "Kamuya tanıtım" ile aynı
  fuara işaret edip etmediğini kaynaktan belirle; aynıysa ikisini birleştir ve defter
  kaydı düş (design K4); `pnpm validate:content` çıktısında olay kalmasın.
  *Sonuç:* Anadolu Ajansı 22.07.2025 tarihli haberinde tanıtımı "bugün" diye veriyor;
  iki olay aynı IDEF 2025 tanıtımıydı ve 2025-07-22 tarihli tek olayda birleşti.
  "1 Temmuz" günü hiçbir kaynağa dayanmıyordu.
- [x] 2.6 Takvim 2025-07-22 "Kamuya tanıtım" için kaynak ara (2.5'te birleşmediyse);
  aynı kural; `pnpm validate:content` çıktısında olay kalmasın. *2.5'te birleşti.*
- [x] 2.7 Takvim 2026-04-07 için kaynak ara. Başlık "Teslimat töreni", gövde "tesis
  açılışında BLOK-4 sergilendi" diyor; kaynak hangisini söylüyorsa başlık ve gövde ona
  göre yazılsın, metin değişirse `timeline` defter kaydı düş; `pnpm validate:content`
  çıktısında olay kalmasın
- [x] 2.8 `_todo` güncelle: çözülen maddeleri (propellant/stages notu, BLOK-4 gün
  hassasiyeti, takvim kaynak notu) çıkar; düşürülen her kayıt için bulunamayan kaynağı ve
  arama tarihini yaz; `pnpm validate:content` dört dosyada geçsin
- [x] 2.9 Defterin yalnız sona ekleme aldığını sına: `git diff content/systems/tayfun.json`
  mevcut on kaydın sırasını ve içeriğini değiştirmemiş olsun; `pnpm test` içindeki kart
  parametre testleri (`lib/cards/params.test.ts`) geçsin

## 3. Defter alan adları

- [x] 3.1 `lib/cards/revision.ts` `revisionField` sonucuna `section` türünü ekle;
  `timeline` ve `source` bölüm anahtarlarının listesi tek yerde dursun ve
  `components/revision-log/RevisionLog.tsx` `fieldLabel` aynı listeyi ve aynı çözümü
  kullansın (ikinci liste yazılmaz, design K6); `pnpm typecheck` geçsin
- [x] 3.2 `messages/tr.json` ve `messages/en.json` içine iki bölüm adını ekle; `lib/messages.test.ts`
  geçsin
- [x] 3.3 `lib/cards/revision-card.tsx` bölüm türünü çevirsin; `lib/cards/cards.test.tsx`
  içine alanı `timeline` olan bir düzeltme kartının ham anahtar yerine çevrilmiş adı
  çizdiğini sınayan test ekle; `pnpm test` geçsin

## 4. Belgeler

- [x] 4.1 CLAUDE.md §3 "Kurallar" listesini genişlet: kaynak adı olmayan güven rozeti
  UI'a çıkmaz; ölçüm, özellik ve takvim olayı aynı asgari atfı taşır; "veri yok" değer
  olarak yazılmaz. Kural metni şemayı tekrar etmesin, `lib/schema.ts`'e yönlendirsin;
  `grep -n "confidence. alanı olmayan" CLAUDE.md` eski cümleyle çelişen ikinci bir ifade
  bırakmasın
- [x] 4.2 CLAUDE.md §11 "Yayındaki eksikler" madde 1'deki TAYFUN düzeltme sayısını
  dosyadaki gerçek sayıyla değiştir; sayıyı `node -e` ile `revisions.length`'ten oku
- [x] 4.3 README.md "Bir sayının kaynağını bulamıyorsan alanı boş bırak" paragrafına
  özellik ve takvim olayını ekle (kaynaksız kayıt derlenmez); README'deki komut örnekleri
  çalışır kalsın
- [x] 4.4 Yöntem sayfası metni `messages/tr.json` ve `messages/en.json` `recordMissing`:
  kaynağın açıklamadığı değerin de tire ile gösterildiğini ekle; `lib/messages.test.ts`
  geçsin
- [x] 4.5 CONTRIBUTING.md "Düzeltme göndermek" bölümüne yeni dosya incelemesi için bir
  satır ekle: yokluk ifadesi ("açıklanmadı", "bilinmiyor") değer olarak kabul edilmez —
  şema bunu dize olarak yakalamıyor (design K3, risk)

## 5. Doğrulama

- [x] 5.1 `pnpm typecheck`, `pnpm lint`, `pnpm test`, `pnpm validate:content` geçsin
- [x] 5.2 `git diff --stat content/systems/atmaca.json content/systems/akinci.json content/systems/siper.json`
  boş çıksın
- [x] 5.3 Uygulamayı çalıştır ve TAYFUN sayfasını Türkçe ve İngilizce aç: kaynak satırı
  olmayan rozet kalmasın; BLOK-4 güdüm hücresi rozetsiz tire; kademe satırı hiç
  çizilmesin; takvimde BLOK-4 tanıtımı 22 Temmuz 2025 tarihli tek olay olarak
  görünsün; düzeltme defterindeki `timeline` ve `source` kayıtları
  ham anahtar değil çevrilmiş adla çizilsin
- [x] 5.4 Ana sayfa panelinin konusu değişmemiş olsun (TAYFUN `range_km`); `lib/hero.test.ts`
  geçsin ve ana sayfada panel aynı alanı göstersin

## Workflow follow-up

- Commit yalnız istendiğinde; mesaj Türkçe, ASCII, "tür: özet" biçiminde, Co-Authored-By
  satırı yok.
- Dağıtım (`scripts/deploy.sh`) yalnız istendiğinde.
- Arşivlemeden önce CLAUDE.md ve README sayımlarını değişiklikle karşılaştır, sonra
  `openspec-archive-change`.
