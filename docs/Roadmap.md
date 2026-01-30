# Kanban API — Roadmap

## Phase 1 — MVP (Core Learning Phase)

**Цель:** изучить базовую и среднюю архитектуру NestJS, создав ядро Kanban-системы.

### Функциональность

- **Users & Auth:** Регистрация, логин (JWT access token).
- **Boards:** Полный CRUD для досок (создать, прочитать, обновить, удалить).
- **Columns:** CRUD для колонок в контексте конкретной доски.
- **Tasks (Cards):** CRUD для задач в контексте конкретной колонки.
- **Task Movement:** Эндпоинт для перемещения задачи между колонками.
- **Task Ordering:** Базовая логика для определения порядка задач в колонке.

### Технические темы (остаются прежними)

- Modules, Controllers, Services
- DTO & Validation, Pipes
- Guards (для защиты эндпоинтов)
- Prisma в качестве ORM
- Database Migrations & Transactions

---

## Phase 2 — Advanced Backend

**Цель:** расширить функционал, изучить более сложные архитектурные паттерны.

### Функциональность

- **Task Labels/Tags:** Добавление цветных меток к задачам.
- **Task Assignees:** Назначение пользователей на задачи.
- **Due Dates:** Установка сроков выполнения задач.
- **Board Permissions:** Базовая система прав (владелец доски vs. участник).
- **Pagination & Filtering:** Для списков задач и досок.
- **Soft Delete:** "Мягкое" удаление вместо физического.

### Технические темы

- Interceptors (для трансформации ответов, логирования).
- Caching (для часто запрашиваемых данных).
- Cron Jobs (для уведомлений о просроченных задачах).
- Advanced Database Queries.

---

## Phase 3 — Production / Senior Level

**Цель:** внедрить enterprise-подход, подготовить API к высоким нагрузкам и сложным сценариям.

### Функциональность

- **Activity Log:** Запись всех действий на доске (аудит).
- **Notifications:** Уведомления (email или push) при упоминаниях или изменениях.
- **File Attachments:** Загрузка и прикрепление файлов к задачам.
- **Real-time Updates:** Использование WebSockets для мгновенного отображения изменений.
- **Webhooks:** для интеграции со сторонними сервисами.

### Технические темы

- CQRS (для разделения чтения и записи).
- Event-Driven Architecture (для слабой связанности компонентов).
- Observability & Monitoring (Grafana, Prometheus).
- Rate Limiting & Security Hardening.
- Containerization (Docker).
