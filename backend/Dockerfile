# ───────────────────────────────────────────────
# Stage 1: Dependencies
# ───────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Install only production-relevant OS deps
RUN apk add --no-cache openssl

COPY package.json package-lock.json* ./
RUN npm install

# ───────────────────────────────────────────────
# Stage 2: Development runtime
# ───────────────────────────────────────────────
FROM node:20-alpine AS dev
WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client after copying schema
RUN npx prisma generate

EXPOSE 8080

# Push schema to DB (idempotent) → seed demo data → start dev server with hot-reload
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && npx prisma db seed && npm run dev"]
