# syntax=docker/dockerfile:1

# Node surumu yerel gelistirme ile ayni majorde: 22.
FROM node:22-alpine AS base
# Next'in bazi bagimliliklari glibc sembolleri bekliyor; alpine'da bu paket
# olmadan calisma zamaninda cozulemeyen semboller cikiyor.
RUN apk add --no-cache libc6-compat
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable
WORKDIR /app

# --- bagimliliklar ---------------------------------------------------------
# Derleme, dev bagimliliklarina da ihtiyac duyuyor: prebuild adimi icerik
# semasini dogruluyor (tsx, zod) ve GLB'leri pisiriyor (draco3dgltf).
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

# --- derleme ---------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Sitenin adresi DERLEME zamaninda gomuluyor: canonical, hreflang, OG ve
# AR icin verilen mutlak adresler buradan turuyor. Calisma zamani degiskeni
# yetmez, o yuzden build arg.
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

# Iletisim adresi de derleme zamaninda gomuluyor (hakkinda sayfasi).
# Bos birakilirsa sayfa kanalin yayimlanmadigini soyler.
ARG NEXT_PUBLIC_CONTACT_EMAIL
ENV NEXT_PUBLIC_CONTACT_EMAIL=$NEXT_PUBLIC_CONTACT_EMAIL

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# --- calisma ---------------------------------------------------------------
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Kok olarak calismiyor.
RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# public/ derleyiciden kopyalaniyor, kaynaktan degil: GLB modelleri prebuild
# sirasinda uretiliyor ve git'te durmuyor.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
# Konteyner disindan erisilebilmesi icin loopback degil.
ENV HOSTNAME=0.0.0.0

CMD ["node", "server.js"]
