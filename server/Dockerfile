FROM node:20-slim AS builder

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

RUN npx prisma generate --schema=prisma/schema.prod.prisma

COPY . .

RUN npm run build

# ──────────────────────────────────────────────
FROM node:20-slim AS runner

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --omit=dev

RUN npx prisma generate --schema=prisma/schema.prod.prisma

COPY --from=builder /app/dist ./dist

EXPOSE 8000

CMD ["sh", "-c", "npx prisma migrate deploy --schema=prisma/schema.prod.prisma && node dist/index.js"]
