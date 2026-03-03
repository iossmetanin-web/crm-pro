# CRM Pro - Production-Ready PWA CRM System

Полнофункциональная PWA CRM-система для команд из 3-10 человек, построенная на Next.js 15, TypeScript, TailwindCSS и Prisma.

## Возможности

### Основной функционал
- **Аутентификация** - Вход по email/паролю с ролевым доступом (Admin/Manager)
- **Управление задачами** - Kanban-доска с drag-and-drop, отслеживание просроченных
- **Управление клиентами** - Полный CRUD с историей контактов
- **Воронка сделок** - Этапы продаж с отслеживанием вероятности
- **Аналитика** - KPI, графики, метрики производительности команды
- **PWA** - Устанавливаемое приложение с офлайн-поддержкой

### Технические особенности
- **Адаптивный дизайн** - Mobile-first с нижней навигацией
- **Темная/Светлая тема** - Автоматическое определение системы
- **Обновления в реальном времени** - SWR для синхронизации данных
- **Type-Safe** - Полное покрытие TypeScript

## Технологии

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, ShadCN UI
- **State Management**: Zustand
- **Data Fetching**: SWR
- **Database**: SQLite (локально) / PostgreSQL (продакшн)
- **Authentication**: NextAuth.js
- **PWA**: Service Worker, Web App Manifest
- **Charts**: Recharts

## Быстрый старт

### Требования
- Node.js 18+ или Bun
- npm, yarn, или bun

### Установка

```bash
# Клонировать репозиторий
git clone <your-repo-url>
cd crm-pro

# Установить зависимости
bun install

# Создать .env файл
cp .env.example .env

# Сгенерировать Prisma клиент
bun run db:generate

# Создать схему базы данных
bun run db:push

# Заполнить базу демо-данными (создает admin + 5 менеджеров)
curl -X POST http://localhost:3000/api/seed

# Запустить сервер разработки
bun run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

### Переменные окружения

Создайте файл `.env`:

```env
# База данных (SQLite для локальной разработки)
DATABASE_URL="file:./dev.db"

# NextAuth (обязательно!)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="ваш-секретный-ключ-минимум-32-символа"

# Для продакшена (PostgreSQL)
# DATABASE_URL="postgresql://user:password@host:5432/database"
```

Для генерации NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

## Демо-аккаунты

После запуска seed-скрипта:

| Роль | Email | Пароль |
|------|-------|--------|
| Admin | admin@crm.com | admin123 |
| Manager 1 | manager1@crm.com | manager123 |
| Manager 2 | manager2@crm.com | manager123 |
| Manager 3 | manager3@crm.com | manager123 |
| Manager 4 | manager4@crm.com | manager123 |
| Manager 5 | manager5@crm.com | manager123 |

## Страницы

| Маршрут | Описание |
|---------|----------|
| `/login` | Страница аутентификации |
| `/` (Today) | Дашборд с задачами на сегодня и просроченными |
| `/tasks` | Kanban-доска с drag-and-drop |
| `/clients` | Управление клиентами с CRUD |
| `/deals` | Управление воронкой продаж |
| `/analytics` | KPI и графики производительности |

## API Routes

| Метод | Маршрут | Описание |
|-------|---------|----------|
| GET/POST | `/api/tasks` | Список/Создание задач |
| GET/PUT/DELETE | `/api/tasks/[id]` | CRUD задачи |
| GET/POST | `/api/clients` | Список/Создание клиентов |
| GET/PUT/DELETE | `/api/clients/[id]` | CRUD клиента |
| GET/POST | `/api/deals` | Список/Создание сделок |
| GET/PUT/DELETE | `/api/deals/[id]` | CRUD сделки |
| POST | `/api/seed` | Заполнить базу данных |
| DELETE | `/api/seed` | Очистить базу данных |

## Развертывание (Deployment)

### Вариант 1: Docker (Рекомендуется)

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
EXPOSE 3000
ENV NODE_ENV=production
CMD ["node", "server.js"]
```

```bash
# Сборка и запуск
docker build -t crm-pro .
docker run -p 3000:3000 -e DATABASE_URL="..." -e NEXTAUTH_SECRET="..." -e NEXTAUTH_URL="http://localhost:3000" crm-pro
```

### Вариант 2: VPS/VDS (Vultr, DigitalOcean, Hetzner)

```bash
# 1. Установить Node.js и PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

# 2. Клонировать проект
git clone <your-repo> && cd crm-pro
npm install

# 3. Настроить .env
nano .env

# 4. Собрать и запустить
npx prisma generate
npx prisma db push
npm run build
pm2 start npm --name "crm-pro" -- start

# 5. Настроить nginx (опционально)
sudo nano /etc/nginx/sites-available/crm-pro
```

### Вариант 3: Vercel / Netlify

Для serverless-платформ нужна внешняя база данных (PostgreSQL):

1. Создайте базу на Supabase, Neon, или PlanetScale
2. Выполните SQL из `supabase-schema.sql`
3. Настройте переменные окружения:
```
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://ваш-домен.com
NEXTAUTH_SECRET=сгенерированный-ключ
```

### Вариант 4: Supabase + Vercel

```bash
# 1. Создать проект на supabase.com
# 2. Выполнить SQL из supabase-schema.sql в SQL Editor
# 3. Получить строки подключения

# Переменные окружения:
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"
NEXTAUTH_URL="https://your-app.vercel.app"
NEXTAUTH_SECRET="your-secret-key"
```

## Структура проекта

```
├── prisma/
│   └── schema.prisma       # Схема базы данных
├── public/
│   ├── icons/              # PWA иконки
│   ├── manifest.json       # PWA манифест
│   ├── sw.js               # Service worker
│   └── offline.html        # Офлайн страница
├── src/
│   ├── app/
│   │   ├── (app)/          # Защищенные маршруты
│   │   │   ├── page.tsx    # Today/Dashboard
│   │   │   ├── tasks/      # Страница задач
│   │   │   ├── clients/    # Страница клиентов
│   │   │   ├── deals/      # Страница сделок
│   │   │   └── analytics/  # Аналитика
│   │   ├── (auth)/         # Auth маршруты
│   │   │   └── login/      # Страница входа
│   │   ├── api/            # API маршруты
│   │   └── layout.tsx      # Root layout
│   ├── components/
│   │   ├── layout/         # Компоненты布局
│   │   ├── providers/      # Context providers
│   │   └── ui/             # UI компоненты (ShadCN)
│   ├── hooks/              # Кастомные хуки
│   ├── lib/
│   │   ├── auth/           # Конфигурация аутентификации
│   │   ├── db.ts           # Prisma клиент
│   │   └── utils.ts        # Утилиты
│   └── stores/             # Zustand stores
├── supabase-schema.sql     # SQL схема для PostgreSQL
└── package.json
```

## Скрипты

```bash
bun run dev         # Запуск сервера разработки
bun run build       # Сборка для продакшена
bun run start       # Запуск продакшн-сервера
bun run lint        # Проверка ESLint
bun run db:push     # Применить схему к базе
bun run db:generate # Сгенерировать Prisma клиент
```

## PWA Установка

### Desktop (Chrome/Edge)
1. Откройте приложение
2. Нажмите иконку установки в адресной строке
3. Нажмите "Установить"

### Mobile (iOS)
1. Откройте в Safari
2. Нажмите кнопку "Поделиться"
3. Выберите "На экран Домой"

### Mobile (Android)
1. Откройте в Chrome
2. Нажмите меню
3. Выберите "Добавить на главный экран"

## Лицензия

MIT License - свободно используйте для личных и коммерческих проектов.
