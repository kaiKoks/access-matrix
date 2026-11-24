# Служба управления матрицами сетевого доступа (АО «Алтайэнергосбыт»)

Веб-приложение для ведения, контроля и автоматической проверки матриц сетевого доступа (firewall rules) через Zabbix API в корпоративной сети АО «Алтайэнергосбыт».

---

## Архитектура проекта (Монорепозиторий)

- **`frontend/`** — Клиентская часть на React 19, Vite, Tailwind CSS v4, Lucide Icons. В продакшене отдается через встроенный Nginx.
- **`backend/`** — Серверная часть на NestJS 12, TypeORM, PostgreSQL (`10.194.222.31:5432`, база `it`), интеграция с Zabbix API.
- **`docker-compose.yml`** — Единый файл оркестрации для кроссплатформенного развертывания (Windows / РЕД ОС / Linux).

---

## Быстрый запуск через Docker Compose

### 1. Требования
- Установленный Docker и Docker Compose (Docker Desktop на Windows или пакет `docker-compose-plugin` на РЕД ОС).

### 2. Настройка параметров подключения (.env)
Перед первым запуском скопируйте шаблон настроек и впишите пароль к БД и токен Zabbix:
```bash
cp .env.example .env
# отредактируйте .env при необходимости (пароль к БД, токен Zabbix)
```

### 3. Запуск проекта одной командой
```bash
docker compose up -d --build
```

После сборки приложение сразу доступно по стандартному веб-порту:
- **Web UI**: `http://localhost` (или `http://<IP-сервера>`)

### 3. Управление
- Логи бэкенда в реальном времени: `docker compose logs -f backend`
- Логи Nginx: `docker compose logs -f frontend`
- Перезапуск бэкенда: `docker compose restart backend`
- Остановка приложения: `docker compose down`

---

## Разработка без Docker (Local Dev)

### Бэкенд (NestJS)
```bash
cd backend
pnpm install
pnpm start:dev
```
Сервер запустится на `http://localhost:3000`.

### Фронтенд (React / Vite)
```bash
cd frontend
pnpm install
pnpm run dev
```
Фронтенд запустится на `http://localhost:5173`.
