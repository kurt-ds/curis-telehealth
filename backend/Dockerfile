# ───────────────────────────────────────────────
# Stage 1: Dependencies
# ───────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
RUN npm install

# ───────────────────────────────────────────────
# Stage 2: Builder (compile TypeScript)
# ───────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
RUN npm run build

# ───────────────────────────────────────────────
# Stage 3: Production runtime
# ───────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
RUN apk add --no-cache openssl

# Copy only what's needed to run
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma

EXPOSE 8080

# Push schema (idempotent) → seed → start compiled server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && node dist/index.js"]

# ───────────────────────────────────────────────
# Stage 4: Development (used by docker-compose)
# ───────────────────────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npx prisma generate
EXPOSE 8080
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm run dev"]
