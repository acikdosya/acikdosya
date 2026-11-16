# Proposal

## Why

TAYFUN sayfası yayında **9 güven rozetini kaynaksız** gösteriyor; bunların **4'ü
"resmî"**. Dosya ana sayfa panelinin (`hero`) konusu, yani sitenin en görünür
dosyası projenin kendi kuralını en açık biçimde çiğneyen dosya:

| kayıt | güven | kaynak |
|---|---|---|
| takvim 2022-10-18 "İlk test atışı" | official | yok |
| takvim 2025-07-01 "BLOK-4 duyurusu" | press | yok |
| takvim 2025-07-22 "Kamuya tanıtım" | official | yok |
| takvim 2026-04-07 "Teslimat töreni" | press | yok |
| `tayfun.propellant` "Katı yakıt" | official | yok |
| `tayfun.stages` "Tek kademe" | official | yok |
| `tayfun-blok-4.guidance` "Açıklanmadı" | estimate | yok |
| `tayfun-blok-4.propellant` "Katı yakıt" | press | yok |
| `tayfun-blok-4.stages` "Açıklanmadı" | estimate | yok |

Dosyanın kendi `_todo`'su iki şeyi zaten söylüyor: üretici ürün kartında
`propellant` ve `stages` geçmiyor; BLOK-4 duyurusunun kaynağı "Temmuz 2025" diyor,
yani `2025-07-01` kaynağın vermediği bir gün hassasiyeti iddia ediyor.

Sebep içerik değil şema. `lib/schema.ts` içinde `measurementSchema` `source`
alanını zorunlu tutuyor, ama `attributeSchema` ve `timelineEventSchema` tutmuyor;
`attributeSchema` `verified_at`'i de zorunlu tutmuyor. TAYFUN kurallar oturmadan
yazılan ilk dosya. Sonraki üç dosya aynı boşluğa düşmedi (ATMACA, AKINCI ve SİPER'de
6 özelliğin 6'sı, 22 takvim olayının 22'si kaynaklı) ama düşmemeleri bir kuralın
değil, dikkatin sonucu. Kural yazılmadıkça beşinci dosya aynı boşluğa düşebilir.

İki "Açıklanmadı" değeri ayrı bir sorun: "veri yok" kırmızı tahmin rozetiyle
çiziliyor. Bu, CLAUDE.md §4'ün yasakladığı dördüncü güven durumunun ta kendisi.

## What Changes

- **BREAKING (içerik sözleşmesi):** `attributeSchema` içinde `source` ve
  `verified_at`, `timelineEventSchema` içinde `source` zorunlu olur. Güven rozeti
  taşıyan üç kayıt türü (ölçüm, özellik, takvim olayı) aynı asgari atfı taşır.
  Yayındaki dosyalardan yalnız TAYFUN bu kuraldan geçmiyor; aynı değişiklikte
  düzeltilir.
- TAYFUN'un 9 kaydının her biri için kaynak aranır. Bulunursa kayıt kaynağıyla
  yazılır ve güven seviyesi kaynağın kim olduğuna göre yeniden belirlenir
  (kurumun kendi açıklaması değilse `official` kalmaz, §3). Bulunamazsa kayıt
  dosyadan çıkar ve nedeni `_todo`'ya yazılır.
- İki "Açıklanmadı" özelliği dosyadan çıkar; tablo o hücreyi `data-state="absent"`
  ile çizer. "Veri yok" değer olarak yazılmaz.
- BLOK-4 duyurusunun "1 Temmuz" günü hiçbir kaynağa dayanmıyor. Ya günü veren kaynak
  bulunur ya da tarih kaynağın hassasiyetine (`2025-07`) indirilir. *Uygulamada:* Anadolu
  Ajansı günü verdi (22.07.2025) ve olay aynı tanıtımı anlatan "Kamuya tanıtım" ile
  birleşti.
- Sayfada görünen her değişiklik (çıkan kayıt, değişen güven, değişen tarih)
  `revisions` defterine düşer. Sessiz düzeltme yapılmaz (§3).
- Düzeltme defteri `timeline` ve `source` alan adlarını çeviri paketinden okur.
  Bugün mevcut `source` kaydı iki dilde de ham İngilizce anahtar olarak çiziliyor;
  yeni takvim kayıtları aynı hataya düşmesin.
- CLAUDE.md §3'teki "confidence alanı olmayan sayı UI'a çıkmaz" kuralı, kaynağı
  olmayan rozeti de kapsayacak biçimde genişletilir; §11 "Yayındaki eksikler"
  maddesindeki TAYFUN düzeltme sayısı güncellenir.

**Sayfada değişen davranış.** Yalnız TAYFUN sayfası değişir: özellik satırlarında
kaynak satırı belirir ya da kayıt "—" olur (iki varyantta da kalmayan özelliğin
satırı tamamen kalkar), takvim olaylarında kaynak satırı belirir ya da olay kalkar,
BLOK-4 duyurusu ile "Kamuya tanıtım" tek olayda birleşir, düzeltme defteri yeni kayıtlar
alır.
ATMACA, AKINCI ve SİPER sayfaları değişmez. Ana sayfa paneli değişmez: işaretçi
TAYFUN `range_km` alanında ve o alana dokunulmuyor.

### Kapsam dışı (Non-goals)

- Takvim olaylarına `verified_at` eklemek. Bugün hiçbir dosyada alan yok; 26 olayın
  her birinin kaynağı yeniden açılmadan tarih yazılamaz, açılmadan yazılan tarih
  uydurmadır (§5.7). Ayrı değişiklik.
- Daha yeni beyanın eskisini geçersiz kılması (supersession).
- TAYFUN'un 561 km kaydı için köken zinciri (`origins`). Kaydın `source_url`'i yok;
  zincir önce o kaynak bulunduktan sonra kurulabilir.
- BLOK-4 `range_km`, `cep_m`, `mass_kg` ve ATMACA/AKINCI/SİPER `_todo` maddeleri.
- "Açıklanmadı" gibi yokluk ifadelerini dize eşleştirmeyle yakalayan bir denetim
  (gerekçe design.md'de).

## Capabilities

### New Capabilities

- `confidence-attribution`: Güven rozeti taşıyan her kaydın (ölçüm, özellik, takvim
  olayı) asgari atfı — kaynak adı, kontrol tarihi, yokluğun rozetle değil boşlukla
  çizilmesi, kaynağı düşen kaydın defterde iz bırakması ve tarihin kaynağın
  hassasiyetini aşmaması.

### Modified Capabilities

(yok — mevcut yedi yetenekten hiçbiri özellik ve takvim kayıtlarının atfını
tanımlamıyor; `source-repeat-chain` kökeni anlatıyor, okunan yayını değil.)

## Impact

- `lib/schema.ts` — `attributeSchema`, `timelineEventSchema`.
- `content/systems/tayfun.json` — 9 kayıt, `revisions` (yalnız sona ekleme),
  `_todo`.
- `components/revision-log/RevisionLog.tsx`, `lib/cards/revision.ts` — alan adı
  etiketi; `messages/tr.json`, `messages/en.json`.
- `lib/structured-data.ts` dokunulmaz ama çıktısı değişir: `dateModified` yeni
  düzeltme tarihine ilerler, kaynaklanan kayıtların adresleri atıf listesine girer.
- Paylaşım kartları: düzeltme kartı sıra numarasıyla adreslenir
  (`lib/cards/params.ts`); kayıtlar sona eklendiği için dolaşımdaki kart
  adresleri bozulmaz.
- Menzil halkası (`range_ring`) ve ana sayfa işaretçisi (`hero`) etkilenmez.
- CLAUDE.md §3 ve §11.
