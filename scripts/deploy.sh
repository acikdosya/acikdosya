#!/usr/bin/env bash
#
# Yerelde derler, imaji sunucuya aktarir, konteyneri yeniler.
#
# Imaj burada derleniyor cunku sunucu paylasimli ve uzerinde iki aydir
# ayakta duran uretim servisleri var; derleme yukunu oraya bindirmiyoruz.
# Bedeli: her dagitimda imajin sikistirilmis hali ssh uzerinden gidiyor.
#
# BU BETIK NGINX'E DOKUNMAZ. Kenar vekil 15 siteyi birden tasiyor; onun
# yapilandirmasi bir kerelik ve elle yapilir, adimlar
# deploy/nginx/acikdosya.org.conf basinda yaziyor.
#
#   ./scripts/deploy.sh
#
# Ayarlar .env.deploy dosyasindan okunur, ornegi .env.production.example.

set -euo pipefail

cd "$(dirname "$0")/.."

if [ -f .env.deploy ]; then
	# shellcheck disable=SC1091
	set -a && . ./.env.deploy && set +a
fi

SITE_URL="${SITE_URL:-https://acikdosya.org}"
CONTACT_EMAIL="${CONTACT_EMAIL:-}"
DEPLOY_HOST="${DEPLOY_HOST:?DEPLOY_HOST tanimli degil}"
DEPLOY_DIR="${DEPLOY_DIR:-/opt/acikdosya}"

REVISION="$(git rev-parse --short HEAD)"
if ! git diff --quiet || ! git diff --cached --quiet; then
	REVISION="${REVISION}-kirli"
	echo "UYARI: calisma agaci temiz degil, imaj ${REVISION} olarak etiketleniyor." >&2
fi

if [ -z "$CONTACT_EMAIL" ]; then
	echo "NOT: CONTACT_EMAIL bos — lib/config.ts icindeki yayimlanmis adres" >&2
	echo "     kullanilacak. Baska bir adres istiyorsan .env.deploy'a yaz;" >&2
	echo "     degisiklik yeniden derleme ister." >&2
fi

echo "==> Derleniyor  (${REVISION}, ${SITE_URL})"
docker build \
	--build-arg "NEXT_PUBLIC_SITE_URL=${SITE_URL}" \
	--build-arg "NEXT_PUBLIC_CONTACT_EMAIL=${CONTACT_EMAIL}" \
	--tag "acikdosya:${REVISION}" \
	--tag acikdosya:latest \
	.

echo "==> Yapilandirma gonderiliyor"
ssh "$DEPLOY_HOST" "mkdir -p '${DEPLOY_DIR}'"
scp compose.yaml "${DEPLOY_HOST}:${DEPLOY_DIR}/"
# vhost buraya kopyalaniyor ama kurulmuyor: /etc/nginx paylasimli alan,
# oraya yazmak elle ve bilerek yapilir.
scp deploy/nginx/acikdosya.org.conf "${DEPLOY_HOST}:${DEPLOY_DIR}/"

echo "==> Imaj aktariliyor"
# Iki etiket de gonderiliyor. Katmanlar ortak, tek kopya gidiyor; kazanc
# sunucuda surumlu bir etiketin kalmasi. Geri donus bunun uzerine kurulu:
# eski surum etiketi olmadan hangi imaja donulecegi bilinemez.
docker save "acikdosya:${REVISION}" acikdosya:latest \
	| gzip -1 | ssh "$DEPLOY_HOST" 'gunzip | docker load'

echo "==> Baslatiliyor"
ssh "$DEPLOY_HOST" "cd '${DEPLOY_DIR}' && docker compose up -d"

echo "==> Saglik kontrolu"
ssh "$DEPLOY_HOST" "curl -sf -o /dev/null -w 'loopback: %{http_code}\n' http://127.0.0.1:3003/"

echo
echo "==> Bitti: ${SITE_URL}  (${REVISION})"
echo
echo "Geri donus:"
echo "    ssh ${DEPLOY_HOST} 'docker image ls acikdosya'"
echo "    ssh ${DEPLOY_HOST} 'docker tag acikdosya:<eski-surum> acikdosya:latest \\"
echo "                        && cd ${DEPLOY_DIR} && docker compose up -d'"
echo
echo "Temizlik — makinede baska servisler var, GENEL prune calistirma:"
echo "    ssh ${DEPLOY_HOST} 'docker image ls acikdosya --format \"{{.Tag}}\"'"
