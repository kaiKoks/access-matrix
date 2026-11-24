# -------------------------------------------------------------
# Этап 1: Сборка фронтенда React (Vite)
# -------------------------------------------------------------
FROM node:22-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

# При сборке все запросы к API пойдут по относительному пути /api
ENV VITE_API_URL=/api

RUN pnpm run build

# -------------------------------------------------------------
# Этап 2: Раздача статики через Nginx и проксирование API
# -------------------------------------------------------------
FROM nginx:alpine AS runner

# Копируем собранные статические файлы фронтенда
COPY --from=builder /app/dist /usr/share/nginx/html

# Копируем конфигурацию Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
