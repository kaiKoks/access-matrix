# -------------------------------------------------------------
# Этап 1: Сборка TypeScript-кода (Builder)
# -------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build

# -------------------------------------------------------------
# Этап 2: Production-образ для запуска (минимум веса)
# -------------------------------------------------------------
FROM node:22-alpine AS runner

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/dist ./dist

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "dist/main.js"]
