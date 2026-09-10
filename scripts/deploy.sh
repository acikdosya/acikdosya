#!/usr/bin/env bash
#
# Yerelde derler, imaji sunucuya aktarir, ayaga kaldirir.
#
# Imaj burada derleniyor cunku sunucu kucuk ve derleme bellek istiyor.
# Bedeli: her dagitimda imajin sikistirilmis hali ssh uzerinden gidiyor.
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

echo "==> Derleniyor  (${REVISION}, ${SITE_URL})"
docker build \
	--build-arg "NEXT_PUBLIC_SITE_URL=${SITE_URL}" \
	--build-arg "NEXT_PUBLIC_CONTACT_EMAIL=${CONTACT_EMAIL}" \
	--tag "acikdosya:${REVISION}" \
	--tag acikdosya:latest \
	.

echo "==> Yapilandirma gonderiliyor"
ssh "$DEPLOY_HOST" "mkdir -p '${DEPLOY_DIR}'"
scp compose.yaml Caddyfile "${DEPLOY_HOST}:${DEPLOY_DIR}/"

echo "==> Imaj aktariliyor"
docker save acikdosya:latest | gzip -1 | ssh "$DEPLOY_HOST" 'gunzip | docker load'

echo "==> Baslatiliyor"
ssh "$DEPLOY_HOST" "cd '${DEPLOY_DIR}' && docker compose up -d && docker image prune -f"

echo "==> Bitti: ${SITE_URL}"
