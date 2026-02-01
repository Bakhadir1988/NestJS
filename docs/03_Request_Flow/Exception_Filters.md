# Фильтры исключений (Exception Filters) в NestJS

Мы почти завершили разбор потока запроса. Фильтры исключений — это последний и очень важный компонент. Это "последняя линия обороны" вашего приложения.

**Основная задача:** Перехватить необработанные исключения (ошибки), которые произошли во время обработки запроса, и сформировать из них кастомный, красивый и понятный HTTP-ответ для клиента.

**Аналогия:** Аварийная бригада на заводе.
-   Ваш код — это конвейер. Иногда на нем что-то ломается (выбрасывается исключение).
-   Обычный процесс останавливается. Приложение готово вернуть стандартный, некрасивый отчет об ошибке (например, `500 Internal Server Error` с кучей текста).
-   Но тут в дело вступает **аварийная бригада (фильтр исключений)**. Она обучена действовать в конкретных аварийных ситуациях. Она перехватывает "аварию", оценивает ее и составляет четкий, понятный отчет для руководства (формирует HTTP-ответ для клиента).

---

## 1. Ключевые концепции

### `@Catch()` декоратор

Это главный декоратор, который "привязывает" ваш фильтр к определенному типу исключений.
-   `@Catch(Prisma.PrismaClientKnownRequestError)`: Будет ловить только ошибки, выброшенные Prisma Client.
-   `@Catch(HttpException)`: Будет ловить все стандартные HTTP-ошибки NestJS (404, 403, 400 и т.д.).
-   `@Catch()`: Если оставить пустым, фильтр будет ловить **абсолютно все** необработанные ошибки.

### Интерфейс `ExceptionFilter`

Каждый фильтр должен реализовывать этот интерфейс с одним методом `catch()`.
-   `exception`: Сам объект исключения, который был выброшен. Мы можем его проанализировать (например, `exception.code` у ошибок Prisma).
-   `host`: Объект, похожий на `ExecutionContext`, который дает доступ к объектам `request` и `response` для отправки кастомного ответа.

---

## 2. Пример кода: `PrismaClientExceptionFilter`

Давайте создадим фильтр, который будет красиво обрабатывать нашу ошибку `P2002` (нарушение уникальности).

#### Шаг 1: Создание файла

Создайте файл `src/common/filters/prisma-client-exception.filter.ts`.

#### Шаг 2: Код фильтра

```typescript
// src/common/filters/prisma-client-exception.filter.ts

import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Для ошибки P2002 (нарушение уникальности)
    if (exception.code === 'P2002') {
      const status = HttpStatus.CONFLICT; // 409 Conflict
      const target = (exception.meta?.target as string[])?.join(', ');
      
      response.status(status).json({
        statusCode: status,
        message: `A record with this ${target} already exists.`,
      });
    } else {
      // Для всех других ошибок Prisma, используем стандартный обработчик
      super.catch(exception, host);
    }
  }
}
```
**Что здесь происходит:**
1.  `@Catch(...)`: Мы указываем, что этот фильтр ловит только определенный тип ошибок от Prisma.
2.  `extends BaseExceptionFilter`: Это хорошая практика. Она позволяет нам вызывать `super.catch()`, если мы столкнулись с ошибкой, которую не хотим обрабатывать сами, передавая ее стандартному обработчику NestJS.
3.  `if (exception.code === 'P2002')`: Мы проверяем код ошибки.
4.  `response.status(status).json(...)`: Мы вручную формируем и отправляем красивый JSON-ответ с кодом `409 Conflict`.

#### Шаг 3: Глобальное применение

Применение глобальных фильтров, которые наследуются от `BaseExceptionFilter`, немного сложнее, чем у Interceptors. Нам нужно передать в него `httpAdapter`.

```typescript
// src/main.ts
// ...
import { HttpAdapterHost } from '@nestjs/core';
import { PrismaClientExceptionFilter } from './common/filters/prisma-client-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ... другая настройка app ...

  // Получаем httpAdapter для передачи в фильтр
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new PrismaClientExceptionFilter(httpAdapter));

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

---

## 3. Практическое задание

1.  Создайте папку `src/common/filters` (если ее еще нет).
2.  Создайте файл `prisma-client-exception.filter.ts` и скопируйте в него код из примера выше.
3.  Зарегистрируйте `PrismaClientExceptionFilter` глобально в `main.ts`, как показано в примере (не забудьте импортировать `HttpAdapterHost` и получить `httpAdapter`).
4.  **Проверьте:**
    -   Перезапустите приложение.
    -   С помощью Postman попробуйте создать пользователя с `email`, который **уже существует** в вашей базе (`POST /api/users`).
    -   Убедитесь, что вместо огромной ошибки `500` вы получаете аккуратный ответ `409 Conflict` с понятным сообщением.
