# Katkı

Bu proje bir dosyadır: her sayı kaynağıyla birlikte durur. Katkının da aynı
kurala uyması beklenir. En değerli katkı yeni özellik değil, **yanlış bir
sayının düzeltilmesidir**.

## Düzeltme göndermek

En kolay yol: [veri düzeltme issue'su aç](../../issues/new?template=veri-duzeltme.yml).

Şablon beş şey ister: sistem, alan, sitedeki mevcut değer, önerilen değer,
kaynak URL. **Kaynağı olmayan bildirim değerlendirilmez.** Bu keyfi bir
katılık değil, projenin kendisine de uyguladığı kural: sitedeki hiçbir sayı
kaynaksız durmuyor.

Kabul edilmeyen kaynaklar:

- Ekran görüntüsü. Bağı ver, görüntüyü değil.
- "Duydum", "biliniyor ki", "askerî çevrelere göre".
- Kendisi kaynak göstermeyen forum ya da sosyal medya gönderisi.
- Erişilemeyen bağ. Sayfa kaldırılmışsa arşiv bağı ver.

Kaynak türünü doğru işaretleyin. Kurumun kendi açıklaması `official`.
Haber sitesinin "resmî kaynaklara göre" demesi `press`'tir, `official`
değil. Bağımsız değerlendirme `estimate`'tir.

## Çelişen değer nasıl işlenir

Yeni değer eskisiyle çelişiyorsa **eskisi silinmez**. Her ikisi de
`content/systems/<slug>.json` içinde durur, sayfa çelişkiyi rozetleriyle
gösterir. Tek doğruyu seçip diğerini gizlemek bu projede hata sayılır.

Yayımlanmış bir değer gerçekten değişirse `revisions` dizisine kayıt düşülür.
Sessiz düzeltme, veri hatasıyla aynı ağırlıktadır — okuyucu dün gördüğü
sayının nereye gittiğini sorabilmeli.

## Kod katkısı

```bash
pnpm install
pnpm dev
pnpm typecheck && pnpm lint && pnpm validate:content && pnpm test
```

Dördü de geçmeden PR açmayın. `validate:content` build'e `prebuild` olarak
bağlıdır; şemadan geçmeyen içerik deploy'a gidemez.

Değişiklik büyükse önce issue açın. Yönü konuşulmadan yazılmış büyük PR
ikimizin de zamanını harcar.

## Reddedilecek katkılar

Bunlar tartışmaya açık değildir; [CLAUDE.md](./CLAUDE.md) §5'te gerekçeleriyle
duruyor:

- Hedef şehir, ülke ya da bölge etiketleyen harita değişikliği. Menzil zarfı
  çizilir, "şuraya ulaşır" denmez.
- Sistemin hangi hedef sınıflarına karşı geliştirildiğine dair liste.
- Üretim süreci, güdüm iç yapısı, harp başlığı tasarımı, isabet
  optimizasyonu. Sınır: boyut, kütle, program takvimi, yayımlanmış
  performans beyanı.
- 3D modelde kesit, patlatılmış görünüm ya da iç bileşen yerleşimi. İç
  geometriye dair kaynaklı verimiz yok.
- Çatışma ya da patlama görseli.
- Üretici logosu, ya da projeyi resmî gösteren herhangi bir öğe.
- Lisansı `content/assets.json` içinde kayıtlı olmayan görsel. Dört alan da
  zorunlu: dosya, lisans, kaynak URL, atıf.
- Kaynağı doğrulanamayan 3D model. Pazar yerinden model indirilmez; gövde
  geometrisi ölçü verisinden üretilir.

## Ton

Sayı verilir, kaynağı gösterilir, çelişki gizlenmez. Ne övgü ne yergi.
Bu ton bir tercih değil, projenin çalışma biçimi.

## Tartışma kuralları

Konu itibarıyla issue'larda hararetli tartışma çıkar. Kural önceden yazılı
olmazsa bir thread'i kilitlemek keyfi görünür, o yüzden yazılı:
[CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md) — Katkıcı Sözleşmesi 2.1.

Bildirim adresi info@acikdosya.org.
