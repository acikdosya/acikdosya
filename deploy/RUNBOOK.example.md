# Sunucu defteri — ÖRNEK

Gerçeği `deploy/RUNBOOK.md` olarak tutulur ve **git'e girmez**
(`.gitignore`). Bu dosya yalnızca iskeleti gösterir.

```bash
cp deploy/RUNBOOK.example.md deploy/RUNBOOK.md   # bir kez, sonra doldur
```

**Neden ayrı dosya:** depo public. Port numarası, kurulum dizini ve makinenin
kimlerle paylaşıldığı tek tek zafiyet değil ama bir arada bedava keşif
bilgisidir ve aynı makinedeki komşu servisleri de işaret eder. Depoda yapının
**şekli** kalır (konteyner loopback'e yayın yapar, system-nginx vekillik eder);
sayılar burada durur.

Bu bir sır deposu değildir. Sırlar (`UMAMI_DB_PASSWORD`, `UMAMI_APP_SECRET`)
sunucudaki `.env` dosyalarında durur, buraya kopyalanmaz.

---

## Makine

| | |
|---|---|
| Sağlayıcı / sürüm | `<saglayici, dagitim surumu>` |
| Kaynak | `<vCPU / RAM>` |
| Adres | `.env.deploy` içinde `DEPLOY_HOST` |
| Paylaşım durumu | `<makinede baska kac site/servis var, kime ait>` |
| Kenar vekil | `<system-nginx mi, kime ait, 80/443 kimde>` |

## Değerler

`.env.deploy` içine yazılan gerçek değerler:

| Değişken | Değer | Nerede kullanılır |
|---|---|---|
| `DEPLOY_DIR` | `<kurulum dizini>` | compose ve tile paketi orada durur |
| `APP_PORT` | `<uygulama loopback portu>` | `compose.yaml`, nginx `proxy_pass`, sağlık kontrolü |
| `UMAMI_PORT` | `<olcum loopback portu>` | `deploy/analytics/compose.yaml`, ssh tüneli |

Üçü de yalnızca loopback'te dinler; dışarıya açık port yok.

## nginx vhost kurulumu (bir kez)

`deploy/nginx/acikdosya.org.conf` yer tutucu taşır. Kurarken gerçek port yazılır:

```bash
sed "s/__APP_PORT__/<uygulama loopback portu>/g" deploy/nginx/acikdosya.org.conf \
  | ssh "$DEPLOY_HOST" 'cat > /etc/nginx/sites-available/acikdosya.org.conf'
ssh "$DEPLOY_HOST" 'ln -sf /etc/nginx/sites-available/acikdosya.org.conf /etc/nginx/sites-enabled/'
ssh "$DEPLOY_HOST" 'nginx -t && systemctl reload nginx'
ssh "$DEPLOY_HOST" 'certbot --nginx -d acikdosya.org -d www.acikdosya.org'
```

`nginx -t` geçmeden reload edilmez: kenar vekil bu makinedeki bütün siteleri
taşıyor, düşerse hepsi birden düşer.

certbot çalışmadan önce iki ad da A kaydıyla sunucuya bakmalı.

## Ölçüm yığını kurulumu (bir kez)

```bash
ssh "$DEPLOY_HOST" 'docker network create acikdosya-net'   # deploy.sh de yapar
ssh "$DEPLOY_HOST" 'mkdir -p <kurulum dizini>/analytics'
scp deploy/analytics/compose.yaml "$DEPLOY_HOST:<kurulum dizini>/analytics/"
scp deploy/analytics/.env.example  "$DEPLOY_HOST:<kurulum dizini>/analytics/.env"
ssh "$DEPLOY_HOST" 'cd <kurulum dizini>/analytics && vi .env'   # sirlar + UMAMI_PORT
ssh "$DEPLOY_HOST" 'cd <kurulum dizini>/analytics && docker compose up -d'
```

Yönetim arayüzü internete kapalı, ssh tüneliyle açılır:

```bash
ssh -L <olcum portu>:127.0.0.1:<olcum portu> "$DEPLOY_HOST"
# tarayicida http://localhost:<olcum portu>   (ilk giris admin / umami — HEMEN degistir)
```

Panelden alınan website id `.env.deploy` içine `UMAMI_WEBSITE_ID` olarak yazılır
ve derleme zamanında imaja gömülür.

## Geri dönüş

```bash
ssh "$DEPLOY_HOST" 'docker image ls acikdosya'
ssh "$DEPLOY_HOST" 'docker tag acikdosya:<eski-surum> acikdosya:latest \
                    && cd <kurulum dizini> && docker compose up -d'
```

## Yapma

- `scripts/deploy.sh` içinden nginx'e dokunma. Vhost kurulumu bir kereliktir ve
  elle yapılır.
- Sunucuda genel `docker image prune -a` veya `docker system prune` çalıştırma.
  Bizim olmayan imajları siler.
- `/etc/letsencrypt` altını silme. Let's Encrypt haftalık oran sınırı uyguluyor.
- Ölçüm portunu dışarı açma.
