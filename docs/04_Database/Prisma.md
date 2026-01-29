
# 04_Database: Prisma

## 1. Краткое описание темы

**Prisma** — это ORM (Object-Relational Mapper) нового поколения для Node.js и TypeScript. В контексте NestJS Prisma выступает как мощный инструмент для взаимодействия с базой данных, который обеспечивает полную типобезопасность от схемы данных до кода вашего приложения.

В отличие от традиционных ORM, которые строят сущности на основе классов, Prisma использует **схему (`schema.prisma`)** как единственный источник правды. На основе этой схемы генерируется сверхмощный и полностью типизированный **Prisma Client**.

## 2. Ключевые концепции

#### 1. Prisma Schema (`schema.prisma`)
Это главный файл конфигурации Prisma. В нем вы:
- Определяете источник данных (например, PostgreSQL, MySQL).
- Указываете генератор (чаще всего это `prisma-client-js`).
- Описываете модели данных (таблицы в вашей БД).

```prisma
// schema.prisma

model Habit {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

#### 2. Prisma Client
Это автоматически генерируемый и типобезопасный конструктор запросов. После каждого изменения в `schema.prisma` вы запускаете команду `npx prisma generate`, и Prisma Client обновляется, предоставляя вам методы для работы с моделями (`findUnique`, `create`, `update`, `delete` и др.) с полной поддержкой автодополнения и проверкой типов в TypeScript.

#### 3. Prisma Migrate
Инструмент для декларативного управления миграциями базы данных.
- Вы изменяете схему в `schema.prisma`.
- Запускаете `npx prisma migrate dev --name <migration-name>`.
- Prisma сравнивает вашу схему с состоянием БД и автоматически генерирует SQL-файл миграции.
Это делает процесс изменения структуры БД предсказуемым и версионируемым.

#### 4. Prisma Studio
GUI для просмотра и редактирования данных в вашей базе. Запускается командой `npx prisma studio`. Это невероятно удобный инструмент для отладки и ручного управления данными на этапе разработки.

## 3. Пример кода (интеграция с NestJS)

Лучший способ интегрировать Prisma — создать `PrismaService`, который инкапсулирует `PrismaClient` и управляет его жизненным циклом. Ваш проект уже следует этому подходу, что является best practice!

**Ваш текущий `prisma.service.ts`:**
```typescript
// src/prisma/prisma.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient {}
```

Чтобы сделать его еще более надежным, добавим управление жизненным циклом NestJS для корректного подключения и отключения от БД.

**Улучшенный `PrismaService`:**
```typescript
// src/prisma/prisma.service.ts
import { Injectable, OnModuleInit, INestApplication } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // Выполняем подключение к БД при инициализации модуля
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    // Корректно закрываем соединение с БД при остановке приложения
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```
*Примечание: для `enableShutdownHooks` также потребуется небольшое изменение в `main.ts`.*

## 4. Частые ошибки

1.  **Забыть запустить `npx prisma generate`:** После любого изменения в `schema.prisma` необходимо генерировать клиент заново. Иначе TypeScript будет жаловаться на отсутствие новых полей или моделей.
2.  **Создавать `new PrismaClient()` в каждом сервисе:** Это антипаттерн. Он создает множество ненужных подключений к БД. Правильный подход — ваш: создать один инъектируемый `PrismaService`.
3.  **Редактировать БД вручную:** Изменение таблиц или колонок напрямую в обход `prisma migrate` приведет к рассинхронизации между схемой Prisma и реальным состоянием БД.

## 5. Best Practices

- **Абстрагировать Prisma Client в `PrismaService`:** Вы это уже сделали. Отлично!
- **Создать `PrismaModule`:** Чтобы `PrismaService` был доступен во всем приложении, его нужно не только создать, но и экспортировать из модуля. Вы это тоже сделали.
- **Управлять жизненным циклом:** Реализуйте `onModuleInit` и `enableShutdownHooks` для стабильной работы приложения.
- **Использовать `select` и `include`:** Не извлекайте избыточные данные. С помощью `select` можно выбрать только нужные поля, а с помощью `include` — подгрузить связанные сущности.

## 6. Краткий вывод

Prisma — превосходный выбор для работы с БД в NestJS. Он обеспечивает непревзойденную типобезопасность, упрощает миграции и повышает продуктивность разработки за счет автодополнения и интуитивно понятного API. Интеграция через отдельный модуль и сервис является золотым стандартом.

## 7. Практическое задание

1.  **Улучшите `PrismaService`:** Модифицируйте ваш `src/prisma/prisma.service.ts`, добавив реализацию `OnModuleInit`, как показано в примере выше.
2.  **Добавьте `enableShutdownHooks`:** В файле `src/main.ts` получите экземпляр `PrismaService` и вызовите новый метод.
    ```typescript
    // src/main.ts
    // ... (импорты)
    import { PrismaService } from './prisma/prisma.service';

    async function bootstrap() {
      const app = await NestFactory.create(AppModule);
      app.setGlobalPrefix('api');

      // Добавьте эту строку
      const prismaService = app.get(PrismaService);
      await prismaService.enableShutdownHooks(app);

      await app.listen(process.env.PORT ?? 3000);
    }
    bootstrap();
    ```
3.  **Подготовьтесь к аутентификации:** Добавьте модель `User` в `schema.prisma`. Мы пока не будем ее использовать, но это подготовит нас к будущим урокам. После этого создайте миграцию.

    **Модель `User`:**
    ```prisma
    // Добавьте в schema.prisma
    model User {
      id        Int      @id @default(autoincrement())
      email     String   @unique
      password  String
      createdAt DateTime @default(now())
      updatedAt DateTime @updatedAt
    }
    ```
    **Команда для миграции:**
    ```bash
    npx prisma migrate dev --name add-user-model
    ```

Это задание укрепит ваши знания о жизненном цикле и миграциях в Prisma.
