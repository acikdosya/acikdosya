---
name: deploy
description: Açık Dosya'yı acikdosya.org'a dağıtma ve işletme — scripts/deploy.sh çalıştırma, sürüm etiketine geri dönüş, derleme zamanında gömülen adresler, harita (tile) paketinin üretimi ve gönderimi, Umami ölçüm yığınının düzeni. Dağıtım, geri alma, sunucu, harita paketi veya ölçüm yığını işlerinde kullan.
---

# Dağıtım ve işletim

Kısıtlar ve "Yapma" listeleri CLAUDE.md §11'de; her oturumda geçerlidir ve
burada tekrarlanmaz. Önce onları oku: sunucu paylaşımlı, nginx'e dokunulmaz,
genel prune çalıştırılmaz, port ve dizin depoya yazılmaz.

## Güncelleme

```
./scripts/deploy.sh
```

Yerelde derler, iki etiketi (sürüm ve `latest`) sunucuya aktarır, konteyneri
yeniler, loopback'ten sağlık kontrolü yapar. nginx'e dokunmaz. Yaklaşık üç
dakika.

Geri dönüş sunucuda duran sürüm etiketleriyle yapılır:

```
docker image ls acikdosya
docker tag acikdosya:<eski-sürüm> acikdosya:latest
cd "$DEPLOY_DIR" && docker compose up -d
```

## Derleme zamanında gömülenler

`NEXT_PUBLIC_SITE_URL` ve `NEXT_PUBLIC_CONTACT_EMAIL` imaja gömülür.
Canonical, hreflang, OG ve AR adresleri ilkinden türer. Değiştirmek
konteyneri yeniden başlatmakla olmaz, imaj yeniden derlenir.

## İletişim

Düzeltme kanalı: **info@acikdosya.org**. Hakkında sayfası bu adresi
gösteriyor. Varsayılan `lib/config.ts` içinde duruyor ki derleme argümanı
geçilmemiş bir imajda da adres kaybolmasın; `NEXT_PUBLIC_CONTACT_EMAIL`
ile ezilir.

## Harita paketi

Altlık kendi sunucumuzdan geliyor (10.09.2026'dan beri). `pnpm build:tiles`
Protomaps günlük planet yapısından Türkiye ve çevresini çıkarır; çıktı
`public/tiles/` altında ~66 MB ve git'te durmaz.

Paket **imaja girmez**: sunucuda kurulum dizininin altında durur ve
konteynere salt okunur bağlanır (`compose.yaml`). `scripts/deploy.sh`
`build.json` özetini karşılaştırır, yalnızca değiştiyse gönderir.

## Ölçüm yığını

Kendi sunucumuzda Umami + Postgres, `deploy/analytics/compose.yaml`.
Kurulum adımları `deploy/RUNBOOK.md` içinde; **yığın `deploy.sh` ile
başlatılmaz**, yalnızca dosyası güncellenir. Sırları sunucudaki `.env`
dosyasında durur.

| | |
|---|---|
| Konteyner | `acikdosya-umami`, yalnızca loopback, bellek sınırı 512 MB |
| Veritabanı | `acikdosya-umami-db`, yalnızca yığının iç ağında, 256 MB |
| Ağ | `acikdosya-net`, uygulama konteyneriyle ortak |
| Yönetim | ssh tüneli, internete kapalı |
