# Güvenlik

## Bildirim

Güvenlik açığı bulursanız **issue açmayın**. Şuraya yazın:

**info@acikdosya.org**

İçeriği: ne bulduğunuz, nasıl tekrarlanacağı, etkisinin ne olduğu.
Elinizde varsa kavram kanıtı ekleyin.

Yanıt süresi: 72 saat içinde ilk dönüş. Proje tek kişi tarafından
yürütülüyor, bu yüzden söz verilen süre kısa tutuluyor.

Ödül programı yok. Düzeltmeden sonra, istemezseniz aksini belirtin, bulan
kişi olarak anılırsınız.

## Kapsam

Yayındaki site (https://acikdosya.org) ve bu depodaki kod.

Kapsam dışı:

- Barındırma sağlayıcısına ya da altyapıya yönelik testler.
- Kullanılabilirliği bozan testler: yük denemesi, servis dışı bırakma,
  kaba kuvvet.
- Üçüncü taraf hizmetlerin kendi açıkları.
- Etkisi gösterilmemiş tarayıcı başlığı ya da yapılandırma önerileri.

## Saldırı yüzeyi hakkında

Site statik olarak üretilir. Kullanıcı hesabı, oturum, giriş formu ve
kullanıcı içeriği **yoktur** — dolayısıyla kimlik doğrulama ve yetkilendirme
açığı da yoktur.

Ziyaretçiden toplanan veri: kendi sunucumuzdaki Umami üzerinden sayfa
görüntülemeleri ve `lib/analytics.ts` içinde sayılı olayları. Çerez yok,
üçüncü taraf script yok, sorgu dizesi kaydedilmez. Menzil zarfının referans
noktası URL'de taşınır ve ziyaretçinin seçtiği bir konumdur; kaydı tutulmaz.

## Veri hatası güvenlik açığı değildir

Yanlış bir sayı bulduysanız burası doğru kanal değil.
[CONTRIBUTING.md](./CONTRIBUTING.md) içindeki düzeltme yolunu izleyin.
