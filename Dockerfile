# Boteco ACIA — imagem para Coolify (Docker atrás de Traefik).
#
# REGRA QUE ORGANIZA ESTE ARQUIVO: nenhum segredo entra na imagem.
#
# `CPF_PEPPER` e `SUPABASE_SERVICE_ROLE_KEY` NÃO aparecem como ARG em lugar
# nenhum aqui, de propósito. Build arg fica gravado no histórico da imagem e
# sai em `docker history` para quem tiver a imagem na mão — vale o mesmo que
# publicar o segredo. Os dois chegam por variável de ambiente em runtime,
# cadastradas no painel do Coolify.
#
# Os dois `NEXT_PUBLIC_*` são build arg porque precisam ser: o Next os grava
# dentro do JavaScript que vai para o navegador, no momento do build. E podem
# ser, porque são públicos por natureza — a chave anônima já viaja no HTML de
# toda página, e quem protege os dados é o RLS do Supabase.

# ---------- dependências ----------
FROM node:22-alpine AS deps
# O sharp, que o next/image usa para otimizar as fotos dos pratos, é binário e
# precisa disto no Alpine.
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---------- build ----------
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ---------- execução ----------
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário sem privilégio. Se um dia alguém escapar do processo do Node, sai
# como `nextjs`, não como root.
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 --ingroup nodejs nextjs

# `output: 'standalone'` já resolveu quais arquivos o servidor precisa. Estático
# e public ficam de fora desse pacote e entram à parte.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

# 0.0.0.0 é obrigatório: preso em localhost, o Traefik não alcança o container.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
