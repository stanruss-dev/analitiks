# CRM Система (амоподобная)

Полноценная CRM-система на русском языке с воронкой сделок, контактами, компаниями, задачами, аналитикой и управлением пользователями.

## Стек

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS**
- **Prisma 7** + SQLite (`better-sqlite3`)
- **NextAuth.js v5** (JWT, credentials)
- **Winston** — логирование в `logs/app.log`

## Запуск

```bash
# 1. Установка зависимостей
npm install

# 2. Настройка окружения
cp .env.example .env

# 3. Применение миграции БД
node -e "
const Database = require('better-sqlite3');
const fs = require('fs');
const db = new Database('prisma/dev.db');
const sql = fs.readFileSync('prisma/migrations/20260615172635_init/migration.sql', 'utf8');
sql.split(';').filter(s=>s.trim()).forEach(stmt => { try { db.prepare(stmt).run() } catch(e) {} });
console.log('Миграция применена');
db.close();
"

# 4. Заполнение тестовыми данными
npx tsx prisma/seed.ts

# 5. Запуск
npm run dev
```

Открыть: http://localhost:3000

## Учётные записи

| Email | Пароль | Роль |
|-------|--------|------|
| admin@crm.ru | admin123 | Администратор |
| manager@crm.ru | manager123 | Менеджер |

## Функции

- **Воронка сделок** — Kanban drag-and-drop по стадиям
- **Контакты** — CRUD с поиском, телефоны, email
- **Компании** — CRUD с привязкой контактов и сделок
- **Задачи** — типы (звонок/встреча/письмо/задача), приоритеты, сроки
- **Лента активностей** — автоматические события + ручные заметки
- **Аналитика** — дашборд, графики по месяцам, топ менеджеры
- **Пользователи** — роли ADMIN/MANAGER/USER (только для admin)
- **Авторизация** — JWT сессии, защита всех маршрутов

## Бэкап БД

```bash
bash backup_db.sh
```

## Логи

Логи пишутся в `logs/app-YYYY-MM-DD.log`, ротация 14 дней.
Уровень задаётся переменной `LOG_LEVEL=debug|info|warn|error`.
