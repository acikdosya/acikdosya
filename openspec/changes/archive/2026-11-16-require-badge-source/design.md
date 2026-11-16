# Design

## Context

Gerekçe ve kayıt listesi proposal.md'de. Burada yaklaşımı belirleyen mevcut durum:

- `lib/schema.ts`: `measurementSchema.source` zorunlu, `verified_at` zorunlu.
  `attributeSchema` ikisini de isteğe bağlı tutuyor; `timelineEventSchema` `source`
  alanını isteğe bağlı tutuyor ve `verified_at` alanı hiç yok.
- `components/spec-table/SpecTable.tsx`: özellik yoksa hücre zaten
  `data-state="absent"` tire ve "veri yok" ekran okuyucu metniyle çiziliyor; hiçbir
  varyantta bulunmayan özelliğin satırı çizilmiyor. Yokluk durumu için yeni çizim
  gerekmiyor, yalnız içeriğin değeri yazmaması gerekiyor.
- `lib/format.ts` `formatEventDate` kısmi tarihi zaten ay ya da yıl olarak yazıyor;
  `2025-07` için kod değişmez.
- Düzeltme defteri alan adını `components/revision-log/RevisionLog.tsx` içinde
  `fieldLabel`, kartta `lib/cards/revision.ts` içinde `revisionField` ile çözüyor.
  İkisi de yalnız ölçüm ve özellik anahtarlarını tanıyor; geri kalanı ham dize.
  TAYFUN'un 2026-09-11 tarihli `source` kaydı bugün bu yüzden iki dilde "source"
  olarak çiziliyor.
- Düzeltme kartı sıra numarasıyla adresleniyor (`lib/cards/params.ts`).
- `lib/hero.ts` son düzeltmeyi yalnız işaretçi yokken (geri çekilmenin ikinci
  katmanı) okuyor. TAYFUN'da işaretçi var; panel etkilenmez.

## Goals / Non-Goals

**Goals:**

- Kural şemada dursun: kaynaksız rozet derlemeye giremesin, dikkate kalmasın.
- TAYFUN'un dokuz kaydı kuraldan geçsin, ve geçerken okuyucunun gördüğü her değişiklik
  defterde iz bıraksın.
- Diğer üç dosyada tek bayt değişmesin.

**Non-Goals:**

- Kaynak araştırmasını TAYFUN'un bu dokuz kaydının dışına taşımak. Ölçümlerdeki açık
  `_todo` maddeleri (561 km `source_url`, BLOK-4 `mass_kg`, `cep_m`) bu değişikliğin
  kuralını zaten geçiyor; ayrı iş.
- Kaynak satırının görünümünü değiştirmek. `SourceLine` olduğu gibi kullanılır.

## Decisions

### K1. `source` zorunlu; köken kimliği onun yerine geçmez

Özellik ve takvim olayında `source` zorunlu olur, `measurementSchema` ile aynı
biçimde. `source_url` isteğe bağlı kalır: bazı kayıtların okunduğu yayının adresi
yok (basılı katalog, fuar standı panosu) ve adres istemek o kayıtları ya dışarı iter
ya uydurma adres üretir.

*Reddedilen: "`source` ya da `origin_id`".* Köken, okunan yayının aktardığı
belgedir (`source-repeat-chain`). Köken kimliği tek başına okuyucuya bizim hangi
yayını okuduğumuzu söylemez; SİPER'de köken taşıyan tek takvim olayı da zaten kaynak
adı taşıyor. İki alanı birbirinin yerine kabul etmek, şemanın ayırmak için kurulduğu
iki şeyi birleştirirdi.

### K2. `verified_at` özellikte zorunlu, takvimde ertelendi

Özellikte zorunlu olur. Bugün 12 özelliğin 5'inde eksik ve beşi de TAYFUN'da, yani bu
değişiklikte kaynak açılırken yazılır. Takvimde alan yok; 26 olayın her birinin
kaynağı yeniden açılmadan tarih yazılamaz.

*Reddedilen: takvime de şimdi eklemek.* Kaynağa bakmadan geçmiş bir tarih yazmak
uydurmadır; bakarak yazmak bu değişikliği 22 kaynaklı olayın yeniden denetimine
çevirir. Ayrı değişiklik.

### K3. Yokluk değer olarak yazılmaz; ayrı bir bayrak ya da dize denetimi yok

"Açıklanmadı" iki BLOK-4 özelliğinden çıkar, alan yazılmaz. Tablo hücreyi mevcut
yokluk çizimiyle gösterir.

*Reddedilen: `disclosed: false` gibi bir bayrak.* "Kaynak açıklanmadığını söylüyor"
ile "biz bulamadık" ayrımı gerçek, ama onu çizmek dördüncü bir rozet durumu demek
(§4). Ayrım gerekirse `_todo`'da ve yöntem sayfasında durur.

*Reddedilen: "Açıklanmadı"yı kaynakla birlikte tutmak.* Kaynak eklemek rozeti yine
bir yokluğa takar; yasak olan kaynaksızlık değil, yokluğun rozetlenmesi.

*Reddedilen: yokluk ifadelerini dize eşleştirmeyle reddeden doğrulama.* Türkçe ve
İngilizce yazım çeşitliliği ("açıklanmadı", "bilgi yok", "undisclosed", "N/A") sonu
gelmeyen bir liste ve meşru bir değeri yanlışlıkla reddetme riski. Bugünkü iki vakayı
K1 zaten yakalıyor: ikisi de kaynaksız. Kalan risk aşağıda.

### K4. Güven seviyesi kaynaktan yeniden belirlenir

Her kayıt için arama sırası: kurumun kendi kanalı (ROKETSAN, SSB, MSB açıklaması ya da
belgesi) → haber ajansı ve basın → hiçbiri. İlki `official`, ikincisi `press`
(kurum adına "resmî kaynaklara göre" diyen haber de `press`, §3). Hiçbiri yoksa kayıt
çıkar ve nedeni `_todo`'ya yazılır. Bulunan kaynak, mevcut kaynaklı kayıtlarla aynı
alanları taşır: `source`, `source_url`, `verified_at`; belge ise `accessed_at` ve
`document_version`; arşiv kopyası alınabiliyorsa `archive_url`.

Bulunan kaynak olayın tarihini ya da metnini farklı veriyorsa kayıt kaynağa göre
düzeltilir; bu da bir defter kaydıdır. İki takvim olayının ("BLOK-4 duyurusu" ve
"Kamuya tanıtım") aynı fuara işaret ettiği ortaya çıkarsa ikisi birleşir ve
kalkan olay için kaldırma kaydı düşülür.

### K5. Defter: neyin kayıt gerektirdiği ve nasıl yazıldığı

Kayıt gerektiren: kaldırma, güven seviyesi değişikliği, tarih ya da metin
değişikliği. Kayıt gerektirmeyen: değeri ve rozeti aynı kalan bir kayda kaynak
satırının eklenmesi.

*Reddedilen: kaynak eklemeyi de deftere yazmak.* Defter okuyucunun dün gördüğü
değerin nereye gittiğini anlatır (§3); değer ve rozet yerindeyse gidilen bir yer yok.
Her kaynak eklemesini yazmak defteri atıf günlüğüne çevirir ve gerçek düzeltmeleri
gömer.

Biçim mevcut TAYFUN kayıtlarıyla aynı: `text` kolu, güven niteleyicisi parantezde,
varyant adı gerekiyorsa niteleyicinin içinde (`"Katı yakıt (TAYFUN BLOK-4, basın)"`).
Kaldırmada `to` `removed`. Alan adı özellik için özellik anahtarı, takvim için
`timeline`. Bu kayıtlar ölçüm kolunda olmadığı için `lib/revisions.ts` defter-tablo
kıyasına girmez; girmeleri de mümkün değil.

Yeni kayıtlar dizinin **sonuna** eklenir. Kart adresi sıra numarası; araya ekleme
dolaşımdaki her TAYFUN düzeltme kartını sessizce başka bir düzeltmeye çevirirdi.

### K6. Bölüm anahtarları tek listeden çevrilir

`timeline` ve `source` bilinen bölüm anahtarı olur. Liste tek yerde durur ve iki
tüketici (`RevisionLog`, `revisionField`) onu okur; çeviriler `messages/*.json`
içinde. `revisionField` sonucuna `section` türü eklenir.

*Reddedilen: `field` alanını iki dilli nesneye çevirmek.* Bütün `revisions`
kayıtlarına dokunan bir şema göçü; iki bölüm adı için orantısız.

*Reddedilen: alan adını Türkçe yazmak ("Program takvimi").* `field` tek dize; İngilizce
sayfada Türkçe çıkardı — `RevisionValue` `text` kolunun çözdüğü sorunun aynısı.

### K7. Sıra: şema önce, içerik sonra

Şema değişikliği ve testleri önce yazılır. O noktada `pnpm validate:content` TAYFUN'da
tam olarak dokuz kayıt için düşmeli; bu çıktı içerik işinin denetim listesidir ve
listenin dokuzdan farklı olması kural ya da sayım hatası demektir. İçerik düzeltildikten
sonra doğrulama yeşile döner. Commit içerik bitmeden atılmaz; ara durum derlenmez.

## Risks / Trade-offs

- [Kaynakların çoğu bulunamaz, TAYFUN sayfası incelir: özellik satırları ve takvim
  olayları kalkar] → Kabul. Dosyanın gerçek durumu bu; düşen her kayıt defterde ve
  `_todo`'da gerekçesiyle durur. İnce ama kaynaklı sayfa, dolu ama kaynaksız
  sayfadan iyidir.
- [Kaynaklı bir "açıklanmadı" ileride K1'den geçer] → Spec gerekliliği ve yöntem
  sayfası kuralı söylüyor; dize denetimi bilerek yazılmadı (K3). Beşinci dosyanın
  incelemesinde aranacak madde olarak tasks'ta yer alır.
- [roketsan.com.tr Wayback'ten hariç; ROKETSAN kaynakları için `archive_url`
  alınamaz] → Bilinen durum, diğer ROKETSAN kayıtlarıyla aynı; `_todo`'da yazılı.
- [Düzeltme kartının "N / toplam" sayacı değişir; önbellekteki eski kart görselleri
  eski toplamı gösterir] → Kabul; adres aynı düzeltmeyi göstermeye devam eder (K5).
- [`dateModified` ilerler, arama motoru sayfayı güncellenmiş görür] → Doğru davranış;
  sayfa gerçekten değişti.

## Migration Plan

Göç yalnız `content/systems/tayfun.json`. Gerileme denetimi:

1. `git diff --stat` ATMACA, AKINCI, SİPER JSON dosyalarında boş.
2. `pnpm validate:content` dört dosyada geçer.
3. Mevcut testler (`lib/revisions.test.ts`, `lib/hero.test.ts`, kart testleri)
   değişmeden geçer; hero testi işaretçinin aynı konuyu seçtiğini doğrular.

Dağıtım `scripts/deploy.sh` ile, yalnız istendiğinde. Geri dönüş önceki sürüm
etiketine (deploy becerisi); içerik imajın içinde olduğu için eski sayfa olduğu gibi
döner.
