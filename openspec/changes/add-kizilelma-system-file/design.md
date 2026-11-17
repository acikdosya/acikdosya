## Context

Gerekçe proposal.md'de. Burada yalnız yapı.

Birim alan adının içinde taşınır (`*_ktas`, `*_km`). Bu yüzden aynı alandaki
değerler zaten aynı birimdedir ve ıraksama hesabı birim dönüştürmez. Birim tablosu
(`lib/measurement/divergence.ts` `UNITS`) yine de boyut ve taban çarpanı taşıyor.
`lib/format.ts` `SPEC_UNITS` ve `UNIT_LABELS` exhaustive `Record`: yeni bir birim
eklenip satırı yazılmazsa derleme düşer.

Mesafe cetveli (`components/range-scale`) bugün yalnız kilometre alanlarını okuyor
ve değer etiketini `"{value} km"` mesaj kalıbıyla basıyor.

## Goals / Non-Goals

**Goals:**

- Kaynağın birimi sayfaya olduğu gibi çıkar. Dönüşüm yalnız çizim için yapılır.
- Dönüşüm çarpanı tek yerde durur.

**Non-Goals:**

- Mach ile KTAS arasında kıyas ya da dönüşüm.
- Halka kaydı (`range_ring`) için yeni bir biçim. KIZILELMA'da kayıt yok.

## Decisions

**1. Mach ayrı alan ve ayrı boyut.** `cruise_speed_mach` ve `max_speed_mach` açılır,
birim tablosunda `mach` boyutunda durur.
*Reddedilen:* KTAS alanına standart atmosferle çevirmek. Değer irtifaya bağlı ve
kaynak irtifa yazmıyor; seçeceğimiz irtifa kaynağın söylemediği bir sayı üretirdi
(§5.7). *Reddedilen:* `hiz` boyutuna koymak. Aynı boyuttaki iki alan ileride bir
kıyas yolunda karşılaşırsa sessizce kıyaslanırdı; ayrı boyut bunu hataya çevirir.

**2. Görev yarıçapı kaynağın biriminde: `combat_radius_nm`.**
*Reddedilen:* `combat_radius_km` ve 926. Sayfada kaynakta olmayan bir sayı belirirdi;
okuyucu 926'yı üreticinin sayfasında arar ve bulamaz. *Reddedilen:*
`operational_range_km`'ye yazmak. O alan AKINCI'da yarıçap olarak yorumlanmadı (bkz.
`components/range-scale/geometry.ts`); iki farklı nicelik aynı adı taşırdı.

**3. Basılan simge `NM`.** Kaynak `nm` yazıyor, ama `nm` SI'da nanometre. Birim
etiketleri dilden bağımsız simge olduğu için (`lib/format.ts`) çevrilmez; ICAO
kısaltması seçildi. *Reddedilen:* `nmi`. Havacılıkta yerleşik değil.

**4. Dönüşüm `convertValue(value, from, to)` içinde.** Çarpanı birim tablosundan
okur; boyutlar farklıysa hata atar. Cetvel çubuk boyunu bununla kilometreye çevirir.
*Reddedilen:* cetvelde yerel bir `1.852` sabiti. Tablo ile cetvel ayrı ayrı
yanılabilirdi.

**5. Cetvel değeri kaynağın sayısı.** Çubuk etiketi ve not satırı
`withUnit(value, SPEC_UNITS[key])` ile basılır. Kilometre alanlarında çıktı
bugünküyle aynı. Artık kullanılmayan `RangeScale.kmLabel` mesajı kaldırılır.

**6. Altyazı alan kümesine göre.** Genel altyazı "bu değer üreticinin kendi terimi"
diyor. Görev yarıçapı için bu yanlış gerekçe olur: o bir yarıçap beyanı, halka
çizilmemesinin sebebi görev profilinin yazılmamış olması. `captionRadius` ayrı
mesajdır. İki tür bir aradaysa iki gerekçe tek `<figcaption>` içinde art arda yazılır;
bir `<figure>` içinde birden fazla `<figcaption>` geçersiz HTML.

**7. Doğrulayıcı `nm` alanlarını menzil beyanı sayar.** `range_ring` kaydı yoksa
uyarı verir, hata değil. Halka çizmemek bir karar ve uyarı onun yazıldığını
gösterir.

**8. Model yok.** Kategori `insansiz-hava-araci` ve `coverage.ts` kategoriyi
`modelled` sayıyor. Ama `productFor('kizilelma', …)` tanımsız döner ve sayfa modeli
açmaz. Bu, §9'un "ürün tanımı yoksa model üretilmez" kuralının bugünkü hali.
Uygulamada bir testin her İHA dosyası için ürün tanımı beklediği çıkarsa test
gevşetilmez, adım ertelenir ve kullanıcıya sorulur.

**Yapısal veri.** Yeni alanlar `lib/structured-data.ts` üzerinden `unitText: "Mach"`
ve `"NM"` ile çıkar. Sayfada görünen etiketle aynıdır (§5.8). Operatörlü değer
(`> 3` saat) bugünkü gibi `minValue` olur.

**Hero, halka, kartlar.** `hero` işaretçisi taşınmaz. `range_ring` yazılmaz.
Paylaşım kartları yeni alanları okumuyor; harita kesiti üretilmiş görsele girmez
(§5.9).

## Risks / Trade-offs

- [`Seyir hızı` etiketi iki alanda (KTAS ve Mach) aynı] → Aynı dosyada ikisi birlikte
  bulunmuyor; tabloda birim sütunu ayırıyor. İkisi bir dosyada buluşursa etiket
  ayrılır.
- [Gelecekte NM ile km alanları aynı cetvelde] → Çubuklar ortak kilometre ölçeğinde,
  her biri kendi biriminde etiketli. Altyazı iki gerekçeyi de yazar.
- [Yayındaki dosyalarda gerileme] → Yeni alanların hiçbiri onlarda dolu değil.
  `pnpm validate:content` beş dosya için aynı uyarı kümesini vermeli. Cetvel
  etiketinin kilometre çıktısı test edilir.

## Migration Plan

Göç yok: alanlar isteğe bağlı, mevcut kayıtlar değişmez. Geri dönüş: commit geri
alınır; KIZILELMA dosyası alanlarla birlikte gider.
