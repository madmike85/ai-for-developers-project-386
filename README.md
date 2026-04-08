### Hexlet tests and linter status:
[![Actions Status](https://github.com/madmike85/ai-for-developers-project-386/actions/workflows/hexlet-check.yml/badge.svg)](https://github.com/madmike85/ai-for-developers-project-386/actions)

### Web E2E Tests:
[![Web E2E Tests](https://github.com/madmike85/ai-for-developers-project-386/actions/workflows/web-e2e-tests.yml/badge.svg)](https://github.com/madmike85/ai-for-developers-project-386/actions/workflows/web-e2e-tests.yml)

# 📅 Call Calendar

Веб-приложение для планирования и управления звонками/встречами. Поддерживает две роли: владелец календаря и гости (без регистрации).

**Основные возможности:**
- 📋 Управление типами событий (владелец)
- 📅 Бронирование слотов без регистрации (гости)
- ⏰ Автоматическая генерация временных слотов (9:00-18:00)
- 🚫 Защита от двойного бронирования
- 📱 Адаптивный интерфейс (desktop + mobile)

---

## 🚀 Технологический стек

| Frontend | Backend | DevOps & Testing |
|----------|---------|------------------|
| React 19 | NestJS 11 | GitHub Actions |
| Vite 8 | TypeScript | Playwright (E2E) |
| TypeScript 5.9 | Prisma ORM 7.6 | Jest (Unit/E2E) |
| Mantine v9 | PostgreSQL | ESLint + Prettier |
| React Router v7 | class-validator | Swagger/OpenAPI |
| TanStack Query v5 | Swagger | |
| Zustand v5 | | |
| Axios + Day.js | | |

---

## 📁 Структура проекта

```
ai-for-developers-project-386/
├── apps/
│   ├── web/              # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── api/      # API клиенты (axios)
│   │   │   ├── components/  # React компоненты
│   │   │   │   ├── layout/   # AppShell, Header
│   │   │   │   ├── owner/    # EventTypeCard, EventTypeForm, BookingCard
│   │   │   │   └── guest/    # PublicEventTypeCard, BookingForm, TimeSlotItem
│   │   │   ├── hooks/    # Custom hooks (React Query)
│   │   │   ├── pages/    # Страницы приложения
│   │   │   ├── stores/   # Zustand stores
│   │   │   ├── types/    # TypeScript типы
│   │   │   └── utils/    # Утилиты (date, validation)
│   │   ├── e2e/          # Playwright E2E тесты
│   │   └── playwright.config.ts
│   │
│   └── api/              # NestJS backend
│       ├── src/
│       │   ├── event-types/   # CRUD типов событий
│       │   ├── bookings/      # Управление бронированиями
│       │   ├── public/        # Публичные endpoints
│       │   ├── prisma/        # Prisma service
│       │   └── app.module.ts  # Root модуль
│       └── test/           # Jest E2E тесты
│
└── packages/
    └── db/                 # Prisma schema & client
        ├── prisma/
        │   ├── schema.prisma
        │   ├── migrations/
        │   └── seed.ts
        └── src/index.ts    # Export PrismaClient
```

---

## ⚡ Быстрый старт

### Предварительные требования
- Node.js 20+
- PostgreSQL 14+
- npm или yarn

### 1. Клонирование и установка

```bash
# Клонирование репозитория
git clone <repository-url>
cd ai-for-developers-project-386

# Установка зависимостей
cd apps/api && npm install
cd ../web && npm install
cd ../../packages/db && npm install
```

### 2. Настройка переменных окружения

```bash
# В packages/db/.env
DATABASE_URL="postgresql://user:password@localhost:5432/callcalendar"

# В apps/api/.env
DATABASE_URL="postgresql://user:password@localhost:5432/callcalendar"
FRONTEND_URL="http://localhost:5173"
PORT=3000

# В apps/web/.env
VITE_API_URL="http://localhost:3000"
```

### 3. Инициализация базы данных

```bash
cd packages/db
npx prisma migrate dev
npx prisma db seed
```

### 4. Запуск приложения

```bash
# Терминал 1: Backend
cd apps/api
npm run start:dev

# Терминал 2: Frontend
cd apps/web
npm run dev
```

### 5. Доступ к приложению

- **Frontend**: http://localhost:5173
- **API**: http://localhost:3000
- **API Documentation (Swagger)**: http://localhost:3000/api/docs

---

## 🎯 Функциональность

### 👤 Владелец (Owner)

| Функция | Описание |
|---------|----------|
| 📝 Создание типов событий | Название, описание, длительность (5-480 мин) |
| ✏️ Редактирование | PATCH обновление полей |
| 🗑️ Удаление | Cascade удаление связанных бронирований |
| 📊 Просмотр бронирований | Единый список всех бронирований с сортировкой по времени |

**Роуты владельца:**
- `/owner` — Dashboard
- `/owner/event-types` — Управление типами событий
- `/owner/bookings` — Список бронирований

### 👥 Гость (Guest)

| Функция | Описание |
|---------|----------|
| 🔍 Просмотр типов событий | Публичный список с названием и длительностью |
| 📅 Выбор даты | Календарь для выбора дня |
| ⏰ Выбор времени | Слоты с 9:00 до 18:00 |
| ✍️ Бронирование | Имя, email, без регистрации |

**Роуты гостя:**
- `/book` — Выбор типа события
- `/book/:eventTypeId` — Выбор даты
- `/book/:eventTypeId/slots` — Выбор времени
- `/book/:eventTypeId/confirm` — Подтверждение

### 📋 Правила системы

- **Рабочие часы**: 9:00 — 18:00
- **Шаг слотов**: Зависит от длительности типа события (например, для 30 мин — слоты каждые 30 минут)
- **Защита от пересечений**: Нельзя создать две записи на одно время, даже разных типов
- **Граничные условия**: Бронирование может начинаться сразу после окончания другого (back-to-back)

---

## 🌐 API Documentation

### Swagger/OpenAPI

Интерактивная документация доступна по адресу: `http://localhost:3000/api/docs`

### Endpoints

#### Event Types API (Owner)

**Получить все типы событий**
```http
GET /api/event-types
```

**Ответ (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Консультация 30 мин",
    "description": "Первичная консультация клиента",
    "durationMinutes": 30,
    "createdAt": "2024-06-01T10:00:00.000Z",
    "updatedAt": "2024-06-01T10:00:00.000Z"
  }
]
```

**Создать тип события**
```http
POST /api/event-types
Content-Type: application/json

{
  "name": "Консультация 30 мин",
  "description": "Первичная консультация",
  "durationMinutes": 30
}
```

**Ответ (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Консультация 30 мин",
  "description": "Первичная консультация",
  "durationMinutes": 30,
  "createdAt": "2024-06-01T10:00:00.000Z",
  "updatedAt": "2024-06-01T10:00:00.000Z"
}
```

**Валидация:**
- `name`: обязательное, строка, 2-100 символов
- `description`: опциональное, строка
- `durationMinutes`: обязательное, число, 5-480 минут

**Получить тип события по ID**
```http
GET /api/event-types/{id}
```

**Ответ (200 OK):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Консультация 30 мин",
  "description": "Первичная консультация",
  "durationMinutes": 30,
  "createdAt": "2024-06-01T10:00:00.000Z",
  "updatedAt": "2024-06-01T10:00:00.000Z"
}
```

**Ошибка (404 Not Found):**
```json
{
  "message": "Event type with ID \"xxx\" not found",
  "error": "Not Found",
  "statusCode": 404
}
```

**Обновить тип события**
```http
PATCH /api/event-types/{id}
Content-Type: application/json

{
  "name": "Обновленное название",
  "durationMinutes": 45
}
```

**Ответ (200 OK):** Обновленный объект

**Удалить тип события**
```http
DELETE /api/event-types/{id}
```

**Ответ (204 No Content)**

---

#### Bookings API (Owner)

**Получить все бронирования**
```http
GET /api/owner/bookings
```

**Ответ (200 OK):**
```json
[
  {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "eventTypeId": "550e8400-e29b-41d4-a716-446655440000",
    "guestName": "Иван Иванов",
    "guestEmail": "ivan@example.com",
    "startTime": "2024-06-15T10:00:00.000Z",
    "endTime": "2024-06-15T10:30:00.000Z",
    "createdAt": "2024-06-10T08:30:00.000Z",
    "eventType": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Консультация 30 мин",
      "durationMinutes": 30
    }
  }
]
```

---

#### Public API (Guest)

**Получить публичный список типов событий**
```http
GET /public/event-types
```

**Ответ (200 OK):** Аналогичен `/api/event-types`

**Получить доступные временные слоты**
```http
GET /public/slots?eventTypeId={uuid}&date=2024-06-15
```

**Параметры запроса:**
- `eventTypeId` (обязательный): UUID типа события
- `date` (обязательный): Дата в формате YYYY-MM-DD

**Ответ (200 OK):**
```json
[
  {
    "startTime": "2024-06-15T09:00:00.000Z",
    "endTime": "2024-06-15T09:30:00.000Z",
    "isAvailable": true
  },
  {
    "startTime": "2024-06-15T09:30:00.000Z",
    "endTime": "2024-06-15T10:00:00.000Z",
    "isAvailable": false
  },
  {
    "startTime": "2024-06-15T10:00:00.000Z",
    "endTime": "2024-06-15T10:30:00.000Z",
    "isAvailable": true
  }
]
```

**Ошибки (400 Bad Request):**
```json
{
  "message": "Event type not found",
  "error": "Bad Request",
  "statusCode": 400
}
```

**Создать бронирование**
```http
POST /public/bookings
Content-Type: application/json

{
  "eventTypeId": "550e8400-e29b-41d4-a716-446655440000",
  "guestName": "Иван Иванов",
  "guestEmail": "ivan@example.com",
  "startTime": "2024-06-15T10:00:00.000Z"
}
```

**Поля запроса:**
- `eventTypeId` (обязательный): UUID типа события
- `guestName` (обязательный): Имя гостя
- `guestEmail` (обязательный): Email гостя (валидный формат)
- `startTime` (обязательный): Время начала в формате ISO 8601

**Ответ (201 Created):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "eventTypeId": "550e8400-e29b-41d4-a716-446655440000",
  "guestName": "Иван Иванов",
  "guestEmail": "ivan@example.com",
  "startTime": "2024-06-15T10:00:00.000Z",
  "endTime": "2024-06-15T10:30:00.000Z",
  "createdAt": "2024-06-10T08:30:00.000Z",
  "eventType": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "Консультация 30 мин",
    "description": "Первичная консультация",
    "durationMinutes": 30,
    "createdAt": "2024-06-01T10:00:00.000Z",
    "updatedAt": "2024-06-01T10:00:00.000Z"
  }
}
```

**Ошибка валидации (400 Bad Request):**
```json
{
  "message": [
    "name must be longer than or equal to 2 characters",
    "durationMinutes must not be less than 5"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

**Ошибка конфликта (409 Conflict):**
```json
{
  "code": "TIME_SLOT_OCCUPIED",
  "message": "This time slot is already booked",
  "conflictingBookingId": "660e8400-e29b-41d4-a716-446655440000"
}
```

---

## 🧪 Тестирование

### Backend E2E Tests (Jest)

```bash
cd apps/api
npm run test:e2e
```

**Покрытие:**
- `app.e2e-spec.ts` — Базовые тесты приложения
- `event-types.e2e-spec.ts` — Тесты CRUD операций (653 строки)
- `bookings.e2e-spec.ts` — Тесты бронирований и валидации (764 строки)
- `public.e2e-spec.ts` — Тесты публичного API и слотов (887 строк)

**Основные сценарии:**
- Создание/получение/обновление/удаление типов событий
- Валидация полей (граничные значения, типы данных)
- Создание бронирований с проверкой пересечений
- Генерация временных слотов с учетом занятости
- Двойное бронирование (409 Conflict)
- Пограничные случаи (back-to-back бронирования)

### Frontend E2E Tests (Playwright)

```bash
cd apps/web

# Запуск всех тестов
npm run test:e2e

# UI режим (для отладки)
npm run test:e2e:ui

# С видимым браузером
npm run test:e2e:headed

# Debug режим
npm run test:e2e:debug
```

**Конфигурация браузеров:**
- Desktop Chrome
- Desktop Firefox
- Desktop Safari
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

### Все тесты из корня проекта

```bash
# Только Backend
npm run test:api

# Только Frontend
npm run test:e2e

# Все тесты
npm run test:all
```

---

## 🏗️ Архитектура

### Backend (NestJS)

**Модульная архитектура:**
```
AppModule
├── PrismaModule (глобальный)
├── EventTypesModule
│   ├── EventTypesController
│   └── EventTypesService
├── BookingsModule
│   ├── BookingsController
│   └── BookingsService
└── PublicModule
    ├── PublicController
    └── PublicService
```

**Паттерны:**
- **Dependency Injection** — внедрение зависимостей через конструкторы
- **DTO Validation** — class-validator для входных данных
- **Repository Pattern** — Prisma как ORM
- **Global Pipes** — автоматическая валидация и трансформация

### Frontend (React)

**Структура состояния:**
```
State Management
├── Server State (React Query)
│   ├── useEventTypes() — получение типов событий
│   ├── useCreateEventType() — создание
│   ├── useUpdateEventType() — обновление
│   ├── useDeleteEventType() — удаление
│   ├── useOwnerBookings() — бронирования владельца
│   ├── usePublicEventTypes() — публичный список
│   ├── useAvailableSlots() — временные слоты
│   └── useCreateBooking() — создание бронирования
│
└── Client State (Zustand)
    └── useBookingStore — booking flow
        ├── selectedEventType
        ├── selectedDate
        └── selectedSlot
```

**UI Framework:**
- **Mantine v9** — компоненты, формы, даты, модалки, уведомления
- **CSS-in-JS** — инлайн стили через prop `style`
- **Responsive** — адаптивная сетка Mantine

### Database (PostgreSQL + Prisma)

**Схема:**
```prisma
model EventType {
  id              String    @id @default(uuid())
  name            String
  description     String?
  durationMinutes Int
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  bookings        Booking[]
}

model Booking {
  id          String    @id @default(uuid())
  eventTypeId String
  eventType   EventType @relation(fields: [eventTypeId], references: [id], onDelete: Cascade)
  guestName   String
  guestEmail  String
  startTime   DateTime
  endTime     DateTime
  createdAt   DateTime  @default(now())

  @@index([startTime, endTime])
}
```

---

## 🛠️ Разработка

### Скрипты (Root)

```bash
# Тестирование
npm run test:api      # Backend E2E тесты
npm run test:e2e      # Frontend E2E тесты
npm run test:all      # Все тесты
```

### Скрипты (Web)

```bash
# Разработка
npm run dev           # Dev сервер (Vite, порт 5173)
npm run build         # Production сборка
npm run preview       # Preview сборки

# Код-стайл
npm run lint          # ESLint проверка

# Тестирование
npm run test:e2e      # Playwright тесты
npm run test:e2e:ui   # UI режим
npm run test:e2e:headed  # С браузером
npm run test:e2e:debug   # Debug
```

### Скрипты (API)

```bash
# Разработка
npm run start:dev     # Dev сервер с watch (порт 3000)
npm run start:debug   # Debug режим
npm run build         # Production сборка
npm run start:prod    # Запуск production

# Код-стайл
npm run lint          # ESLint + Prettier
npm run format        # Форматирование

# Тестирование
npm run test          # Unit тесты
npm run test:watch    # Watch режим
npm run test:cov      # С покрытием
npm run test:e2e      # E2E тесты
```

### Скрипты (DB)

```bash
# Миграции
npx prisma migrate dev      # Создать и применить миграцию
npx prisma migrate deploy   # Применить в production
npx prisma migrate reset    # Сбросить и пересоздать

# Генерация
npx prisma generate         # Сгенерировать Prisma Client

# Seed
npx prisma db seed          # Заполнить тестовыми данными

# Studio
npx prisma studio           # GUI для базы данных
```

---

## 🔧 Переменные окружения

### API (.env)

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `DATABASE_URL` | URL подключения к PostgreSQL | — |
| `FRONTEND_URL` | URL фронтенда для CORS | `http://localhost:5173` |
| `PORT` | Порт сервера | `3000` |

### Web (.env)

| Переменная | Описание | По умолчанию |
|------------|----------|--------------|
| `VITE_API_URL` | URL API сервера | `http://localhost:3000` |

### DB (.env)

| Переменная | Описание |
|------------|----------|
| `DATABASE_URL` | URL подключения к PostgreSQL |

---

## 📚 Дополнительная документация

- **[AGENTS.md](./AGENTS.md)** — Гайдлайны для AI-разработчиков (code style, conventions)
- **[PROJECT.md](./PROJECT.md)** — Требования и спецификация проекта
- **[docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)** — Подробное руководство по тестированию
- **[docs/TEST_SCENARIOS.md](./docs/TEST_SCENARIOS.md)** — Тестовые сценарии и чек-листы

---

## 📝 Лицензия

UNLICENSED

---

## 🤝 Участие в разработке

### Git Workflow

**Branch naming:**
- `feature/short-description` — Новые функции
- `bugfix/issue-description` — Исправление багов
- `hotfix/urgent-issue` — Срочные исправления
- `release/v1.2.3` — Релизы

**Commit messages:**
```
feat(api): add booking validation
fix(web): correct slot time display
docs(readme): update API examples
test(api): add edge case tests
```

### Code Quality Standards

- **TypeScript**: Strict mode, никаких `any`
- **Testing**: >80% покрытие кода
- **Linting**: ESLint + Prettier
- **API**: Swagger документация для всех endpoints

---

## 📞 Поддержка

Если у вас возникли вопросы или проблемы:

1. Проверьте [API Documentation](http://localhost:3000/api/docs)
2. Ознакомьтесь с [TEST_SCENARIOS.md](./docs/TEST_SCENARIOS.md)
3. Запустите тесты: `npm run test:all`
4. Проверьте логи в консоли браузера и сервера

---

**Сделано с ❤️ для удобного планирования встреч**
