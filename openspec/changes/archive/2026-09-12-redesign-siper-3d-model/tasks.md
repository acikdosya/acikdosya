## 1. Ürün kaydı varyant düzeyine iner

- [x] 1.1 `lib/geometry/registry.ts` kaydını `"<sistem>/<varyant>"` anahtarıyla
  çözecek biçimde yaz; çözüm hangi anahtarla bulduğunu da döndürsün ve tanımsız
  çift için varsayılan DÖNMESİN — `pnpm typecheck` geçsin
- [x] 1.2 `lib/geometry/parts-for.ts` ve `lib/geometry/measurements.ts` sistem+varyant
  çiftini taşısın; `pnpm typecheck && pnpm lint` geçsin
- [x] 1.3 Sisteme düşüşün görünür olduğunu sınayan test yaz: varyant tanımı olmayan
  bir sistemde çözüm sistem anahtarını bildirsin, tanım hiç yoksa undefined dönsün
- [x] 1.4 Yayındaki üç sistemin ürettiği parça listesinin değişmediğini sınayan test
  yaz (parça kimlikleri ve sayıları sabitlensin); `pnpm test` geçsin
- [x] 1.5 `scripts/validate-content.ts` etiket parça kontrolü çifti kullansın;
  `pnpm validate:content` geçsin

## 2. Yüzey grupları listeye döner

- [x] 2.1 `lib/geometry/axial.ts` içinde `ratios` + `wings` ikilisini adlandırılmış
  grup listesine çevir; her grup adet, kök/uç veçhe, açıklık, kalınlık, firar
  istasyonu ve ok açısı taşısın — `pnpm typecheck` geçsin
- [x] 2.2 Parça kimlikleri grup adından türesin (`fin-aft-1` gibi) ve grup adı oran
  tablosunda yazılı olsun; kimlik üretimini sınayan test geçsin
- [x] 2.3 `lib/geometry/tayfun.ts`, `atmaca.ts`, `akinci.ts` oran tablolarını yeni
  yapıya taşı; 1.4'teki parça listesi testi hâlâ geçsin
- [x] 2.4 `components/model-provenance/ModelProvenance.test.ts` yeni oran
  anahtarlarını görsün; `messages/tr.json` ve `en.json` `RatioLabels` bloklarına
  eksik etiketler eklensin ve `pnpm test` geçsin

## 3. Gövde istasyon listesine döner

- [x] 3.1 `lib/geometry/axial.ts` gövdeyi `{t, radiusRatio}` istasyon listesinden
  kursun; burun ve boattail bu listenin uçları olsun — `pnpm typecheck` geçsin
- [x] 3.2 Kademeli gövde sınaması yaz: iki farklı yarıçaplı istasyon verildiğinde
  üretilen lathe profili kademeyi ve geçişi taşısın
- [x] 3.3 Bölümlü burun sınaması yaz: burun eğrisi üzerindeki istasyon sınırı
  ortografik izdüşümde de görünsün
- [x] 3.4 Üç yayındaki üründe parça listesi ve sınır kutusu değişmesin; 1.4 testi
  ve kadraj testi geçsin

## 4. Ölçüm ve köken

- [x] 4.1 `lib/geometry/ratio.ts` içindeki `projection_check` metninin iki koşulu
  birden yazdığını sınayan test yaz (iç tutarlılık ve dış uyum ayrı ayrı)
- [x] 4.2 Ürün-2 oranlarını çizimden çıkar ve `measured` olarak yaz; her oranın
  `projection_check` metni gövde eni sapmasını (%0,5) ve L/D uyumunu (%3,9)
  birlikte söylesin
- [x] 4.3 Ürün-1 boyuna oranlarını çizimden çıkar ve `reading` olarak yaz; notu
  %39'luk uyuşmazlığı ve iticinin doğrulanmamış yorum olduğunu söylesin
- [x] 4.4 Ürün-1'de `chosen` oran BIRAKMA: açıklık oranları da çizimden okunur ve
  `reading` olur. Aynı eksendeki iki uzunluğun oranı ölçekten bağımsızdır; `chosen`
  yazmak kaynağı silerdi (design.md karar 5)
- [x] 4.5 Kanat adetlerini her iki üründe de çizimden al ve sayımın izdüşümden
  bağımsız olduğunu ayrı bir gerekçe metniyle yaz

## 5. SİPER ürün tanımları

- [x] 5.1 `lib/geometry/siper-urun-1.ts` yaz: kademeli gövde (itici + ana gövde),
  üç yüzey grubu (arka kanat, kontrol yüzeyi, orta kanat), ogive burun
- [x] 5.2 `lib/geometry/siper-urun-2.ts` yaz: tek çaplı gövde, dört ok açılı arka
  kanat, gövde boyu dört strake, radom bölümü taşıyan burun
- [x] 5.3 `lib/geometry/siper.ts` dosyasını kaldır ve kayıt satırlarını iki varyant
  tanımıyla değiştir; `pnpm typecheck && pnpm lint` geçsin
- [x] 5.4 İki varyantın farklı parça listesi ürettiğini sınayan test yaz — aynı
  listeyi üretirlerse test düşsün
- [x] 5.5 `pnpm bake:models` iki GLB'yi yeniden pişirsin; her biri 3 MB sınırının
  altında kalsın

## 6. Kayıt

- [x] 6.1 `content/assets.json` içine iki referans kaydı ekle: çizimler görüldü,
  repoya girmedi, izdüşüm sınavının sayısal sonucu notta; broşürdeki hedef tipi ve
  harp başlığı alanlarının alınmadığı da yazılı olsun (§5.2, §5.3)
- [x] 6.2 `content/systems/siper.json` `_todo` kaydına 5,4 m'nin ayrılabilir iticiyi
  kapsayıp kapsamadığının bilinmediğini yaz; `pnpm validate:content` geçsin
- [x] 6.3 `messages/*.json` içindeki model açıklama metnini güncelle: iticinin
  ayrılabilir olduğu modelden anlaşılmaz, atıcı ve kanister modellenmez

## 7. Doğrulama

- [x] 7.1 `pnpm typecheck && pnpm lint && pnpm test && pnpm validate:content` tamamı
  geçsin
- [x] 7.2 `pnpm build` geçsin; ilk yükleme JS bütçesi 180 KB gzip içinde kalsın
- [x] 7.3 Üç yayındaki sistemin model ve siluetlerini gözle karşılaştır; hiçbiri
  değişmemiş olsun
- [x] 7.4 SİPER sayfasında iki varyantı yan yana aç; modeller birbirinden farklı
  görünsün ve her biri kendi çizimine benzesin
- [x] 7.5 Biçim kaydını oku: Ürün-2 satırları "ölçülmüş", Ürün-1 satırları "okuma"
  ve "seçilmiş" karışık göstersin; sayımlar kendi gerekçesini taşısın
