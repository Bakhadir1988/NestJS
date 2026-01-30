# Гарды (Guards) в NestJS

Гарды (Guards) — это классы, основной задачей которых является определение, может ли текущий запрос быть обработан хендлером роута. Они отвечают на один простой вопрос: «разрешено или запрещено?».

Это ключевой механизм для реализации **авторизации** (не путать с аутентификацией) в приложении.

---

## 1. Ключевые концепции

### Место в цикле запроса

Гарды выполняются **после** всех middleware, но **до** любых пайпов (Pipes) и самого обработчика роута.

`Request -> Middleware -> Guard -> Pipe -> Route Handler`

Это идеальное место, чтобы отсечь неавторизованных пользователей до того, как какая-либо бизнес-логика начнет выполняться.

### Интерфейс `CanActivate`

Каждый гард должен реализовывать интерфейс `CanActivate`, у которого есть всего один метод — `canActivate()`.

```typescript
interface CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean>;
}
```

- `context: ExecutionContext`: Предоставляет информацию о текущем запросе (request, response), классе контроллера и методе-обработчике.
- **Возвращаемое значение**:
  - `true`: Запрос разрешен и будет передан дальше по цепочке.
  - `false`: Запрос запрещен. NestJS немедленно вернет клиенту ошибку `403 Forbidden`.

### `ExecutionContext`

`ExecutionContext` — это мощный объект. Наиболее частый сценарий — получение объекта `request`:

```typescript
const request = context.switchToHttp().getRequest();
```

Из `request` можно достать заголовки, параметры запроса, тело и т.д.

---

## 2. Пример кода: Простой `ApiKeyGuard`

Давайте создадим гард, который проверяет наличие статичного API-ключа в заголовке `X-API-KEY`. Это примитивный, но наглядный пример защиты.

```typescript
// src/auth/guards/api-key.guard.ts

import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    // В реальном приложении ключ должен храниться в .env
    const isValid = apiKey === 'my-secret-api-key';

    if (!isValid) {
      // Вместо возврата false, лучше выбросить конкретное исключение
      throw new UnauthorizedException('Invalid or missing API Key');
    }

    return true;
  }
}
```

### Применение Гарда

Гард можно применить с помощью декоратора `@UseGuards()`:

```typescript
// На уровне всего контроллера
@UseGuards(ApiKeyGuard)
@Controller('boards')
export class BoardsController {
  // Все роуты в этом контроллере будут защищены

  @Get()
  findAll() {
    return 'This action returns all boards';
  }
}

// На уровне отдельного роута
@Controller('tasks')
export class TasksController {
  @UseGuards(ApiKeyGuard)
  @Post()
  create(@Body() createTaskDto: any) {
    return 'This action adds a new task';
  }

  @Get()
  findAll() {
    // Этот роут останется публичным
    return 'This action returns all tasks';
  }
}
```

---

## 3. Частые ошибки

1.  **Возвращать `false` вместо `throw new ...Exception()`**.
    - Возврат `false` приводит к стандартному `403 Forbidden`. Если вы хотите вернуть `401 Unauthorized` или другую ошибку с кастомным сообщением, всегда используйте `throw`.
2.  **Помещать тяжелую логику в гард.**
    - Гарды должны быть быстрыми. Не стоит делать внутри них тяжелые запросы к базе данных на каждую проверку.
3.  **Забыть зарегистрировать гард в провайдерах.**
    - Если ваш гард имеет зависимости (например, `ConfigService`), он должен быть частью `providers` в модуле, чтобы Nest мог его инстанцировать.

---

## 4. Best Practices

-   **Один гард — одна ответственность.** Создавайте отдельные гарды для проверки JWT, API-ключа, ролей пользователя и т.д.
-   **Используйте встроенные исключения** (`UnauthorizedException`, `ForbiddenException`). Они стандартны и понятны.
-   **Делайте гарды глобальными, если они применяются ко всему приложению.** Это можно сделать в `main.ts` с помощью `app.useGlobalGuards(new ApiKeyGuard())`.

---

## 5. Краткий вывод

Гарды — это основной механизм авторизации в NestJS. Они встраиваются в начало цикла обработки запроса и решают, пропустить ли запрос дальше. Они просты в реализации, но очень мощны, особенно в комбинации друг с другом.

---

## 6. Практическое задание

1.  Создайте новую папку `src/auth/guards`.
2.  Внутри создайте файл `api-key.guard.ts` и скопируйте в него код `ApiKeyGuard` из примера выше.
3.  Создайте модуль `BoardsModule` с пустым контроллером `BoardsController` (используйте Nest CLI: `nest g mo boards` и `nest g co boards`).
4.  Защитите весь `BoardsController` с помощью `@UseGuards(ApiKeyGuard)`.
5.  Зарегистрируйте `BoardsModule` в `AppModule`.
6.  **Проверьте результат:**
    -   Запустите приложение.
    -   С помощью Postman или `curl` отправьте `GET` запрос на эндпоинт, который обслуживает `BoardsController` (например, `/boards`).
    -   Убедитесь, что без заголовка `X-API-KEY` вы получаете ошибку `401 Unauthorized`.
    -   Добавьте заголовок `X-API-KEY` со значением `my-secret-api-key` и убедитесь, что получаете успешный ответ `200 OK`.
