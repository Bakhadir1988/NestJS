# Interceptors (Перехватчики) в NestJS

Перехватчики (Interceptors) — это мощный механизм в NestJS, который позволяет "вклиниться" в поток выполнения запроса. Чаще всего их используют для того, чтобы изменить (трансформировать) **ответ**, который отправляется от вашего API клиенту.

**Аналогия:** Представьте конвейер на заводе.
-   Ваш контроллер — это станок, который производит деталь (данные для ответа).
-   Перехватчик — это рабочий, который стоит **после** станка. Он берет каждую деталь, упаковывает ее в красивую фирменную коробку и только потом отправляет на склад (клиенту).

---

## 1. Ключевые концепции

### Интерфейс `NestInterceptor`

Каждый перехватчик должен реализовывать интерфейс `NestInterceptor` с одним методом `intercept()`.

-   `ExecutionContext`: Тот же объект, что и в гардах, дает доступ к деталям запроса.
-   `CallHandler`: Это объект, который представляет собой "следующее действие" в цепочке — обычно это вызов вашего метода в контроллере. У него есть метод `handle()`, который запускает это действие.

### `Observable` и RxJS

В отличие от гардов, которые могут возвращать просто `boolean`, метод `intercept()` **должен вернуть `Observable`**.

-   **Что такое `Observable`?** Думайте об этом как о "потоке" данных. В нашем случае, это поток, в котором будет только одно значение — результат работы нашего контроллера (например, объект пользователя).

-   **Как с ним работать?** С "потоками" работают с помощью операторов из библиотеки **RxJS** (она уже установлена вместе с NestJS). Нам понадобится всего два элемента:
    -   `.pipe()`: Метод, который позволяет нам "встроить" в поток наши операторы.
    -   `map()`: Оператор, который берет значение из потока, позволяет нам что-то с ним сделать (например, обернуть в объект) и вернуть новое значение, которое пойдет дальше.

---

## 2. Пример кода: `ResponseTransformInterceptor`

Давайте создадим перехватчик, который будет оборачивать все успешные ответы в структуру `{ statusCode, data }`.

#### Шаг 1: Создание файла

Рекомендуется создать общую папку для таких вещей. Создайте `src/common/interceptors/response-transform.interceptor.ts`.

#### Шаг 2: Код перехватчика

```typescript
// src/common/interceptors/response-transform.interceptor.ts

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Опишем интерфейс для нашей новой структуры ответа
export interface TransformedResponse<T> {
  statusCode: number;
  data: T;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, TransformedResponse<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    // Получаем объект ответа, чтобы из него взять statusCode
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => ({
        statusCode: response.statusCode,
        data: data,
      })),
    );
  }
}
```
**Что здесь происходит:**
1.  `next.handle()`: Мы запускаем дальнейшее выполнение (вызывается наш контроллер). Это возвращает `Observable` с данными ответа.
2.  `.pipe()`: Мы "вклиниваемся" в этот `Observable`.
3.  `map((data) => ...)`: Мы говорим: "Когда данные (`data`) появятся в потоке, возьми их и верни вместо них новый объект `{ statusCode, data }`".

#### Шаг 3: Глобальное применение

Чтобы применить этот перехватчик ко всем эндпоинтам сразу, добавим его в `main.ts`.

```typescript
// src/main.ts
// ...
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // ...
  app.useGlobalInterceptors(new ResponseTransformInterceptor()); // <-- ДОБАВЬТЕ ЭТУ СТРОКУ
  // ...
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
```

---

## 3. Частые ошибки

1.  **Забыть `return` в методе `intercept`**. Метод всегда должен возвращать `Observable`.
2.  **Забыть вызвать `next.handle()`**. Если не вызвать этот метод, ваш контроллер никогда не выполнится, и запрос "зависнет".
3.  **Пытаться использовать `async/await`** внутри `map`. Операторы RxJS работают с потоками синхронно. Для асинхронных операций внутри `pipe` используются другие операторы (например, `mergeMap`), но это более сложная тема.

---

## 4. Практическое задание

1.  Создайте папку `src/common/interceptors`.
2.  Создайте файл `response-transform.interceptor.ts` и скопируйте в него код из примера выше (включая интерфейс `TransformedResponse`).
3.  Зарегистрируйте `ResponseTransformInterceptor` глобально в `main.ts`.
4.  **Проверьте:**
    -   Перезапустите приложение.
    -   Отправьте любой успешный запрос, который у вас уже есть (например, `GET /api/users/me`).
    -   Убедитесь, что ответ теперь имеет новую структуру:
        ```json
        {
          "statusCode": 200,
          "data": {
            "id": 1,
            "name": "vasy",
            "email": "vasy@mail.ru"
          }
        }
        ```
