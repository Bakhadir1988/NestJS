
# 02_Data_Validation: Custom Pipes

## 1. Краткое описание темы

Хотя `ValidationPipe` и другие встроенные пайпы (`ParseIntPipe`, `ParseUUIDPipe`) покрывают большинство стандартных задач, часто возникает необходимость в собственной, уникальной логике валидации или трансформации данных. **Custom Pipes** (пользовательские пайпы) — это механизм NestJS, который позволяет создавать такую логику.

Кастомный пайп — это класс, реализующий интерфейс `PipeTransform`, который может быть использован для:
-   **Трансформации:** Преобразования входных данных в нужный формат (например, из строки в `Date`, из `string` "true" в `boolean`).
-   **Валидации:** Проверки данных по определенным критериям и выброса исключения, если они невалидны.

## 2. Ключевые концепции

#### Интерфейс `PipeTransform`
Любой пайп должен реализовывать этот интерфейс, который требует наличия одного метода: `transform()`.

```typescript
import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common';

@Injectable()
export class MyCustomPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // Здесь ваша логика
    return value;
  }
}
```

-   `value`: Входное значение, которое нужно обработать (например, строка из параметра URL или тело запроса).
-   `metadata`: Объект с метаданными, содержащий информацию о обрабатываемом аргументе:
    -   `metatype`: Тип аргумента (например, `String`, `Number` или класс DTO).
    -   `type`: Тип декоратора (`'body'`, `'query'`, `'param'`, `'custom'`).
    -   `data`: Строка, переданная в декоратор (например, `id` в `@Param('id')`).

#### Типы Пайпов

1.  **Validation Pipe (Валидационный):** Проверяет `value` и, если оно валидно, возвращает его без изменений. Если невалидно — выбрасывает исключение (например, `BadRequestException`).

2.  **Transformation Pipe (Трансформационный):** Принимает `value`, преобразует его и возвращает **новое** значение.

## 3. Пример кода

Давайте создадим трансформационный пайп, который будет разбирать строку с тегами, разделенными запятыми, в массив строк. Например, из `?tags=nest,api,ts` делать `['nest', 'api', 'ts']`.

**1. Создаем файл `src/common/pipes/parse-comma-separated.pipe.ts`:**
*(Рекомендуется создать общую папку для таких утилит)*
```typescript
import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseCommaSeparatedPipe implements PipeTransform<string, string[]> {
  transform(value: string): string[] {
    if (typeof value !== 'string') {
      // Можно вернуть пустой массив, значение по умолчанию или кинуть ошибку
      return []; 
    }
    return value.split(',').map(item => item.trim());
  }
}
```

**2. Используем пайп в контроллере:**
```typescript
// в habits.controller.ts
import { ParseCommaSeparatedPipe } from 'src/common/pipes/parse-comma-separated.pipe';

@Get()
async findAll(@Query('tags', ParseCommaSeparatedPipe) tags: string[]) {
  console.log(tags); // Если запрос был /habits?tags=js,ts,nest
                     // в консоли будет: ['js', 'ts', 'nest']
  return this.habitsService.findAll(); 
}
```

## 4. Частые ошибки

-   **Забыть вернуть значение:** Метод `transform` **всегда** должен что-то возвращать. Если он ничего не вернет (т.е. вернет `undefined`), то и в обработчик вашего роута придет `undefined`.
-   **Неправильная обработка отсутствующих значений:** Если пайп применяется к опциональному параметру (например, `@Query('search')`), `value` может быть `undefined`. Пайп должен корректно это обрабатывать, а не падать с ошибкой.
-   **Слишком сложная логика:** Пайпы должны быть простыми, быстрыми и переиспользуемыми. Сложную бизнес-логику следует размещать в сервисах.

## 5. Best Practices

-   **Создавайте общую директорию:** Храните кастомные пайпы в общей директории, например `src/common/pipes`, чтобы их можно было легко переиспользовать в разных модулях.
-   **Делайте пайпы "чистыми":** Пайп не должен зависеть от внешнего контекста, кроме своих входных данных. Это упрощает их тестирование и переиспользование.
-   **Четко определите назначение:** Пайп должен делать что-то одно и делать это хорошо: либо валидировать, либо трансформировать.

## 6. Краткий вывод

Custom Pipes — это элегантный и соответствующий архитектуре NestJS способ инкапсулировать логику обработки входящих данных. Они делают код контроллеров чище, а логику — более декларативной и переиспользуемой.

## 7. Практическое задание

Давайте создадим кастомный **валидационно-трансформационный** пайп, который решает частую проблему: обработку опционального числового ID из строки запроса.

**Задача:** Создать `ParseOptionalIntPipe`.

**Требования к поведению:**
-   Если на вход приходит `undefined` (параметр не передан), он должен вернуть `undefined`.
-   Если на вход приходит строка, содержащая число (например, `'123'`), он должен вернуть это число (`123`).
-   Если на вход приходит строка, которую нельзя преобразовать в число (например, `'abc'`), он должен выбросить `BadRequestException`.

**Шаги:**
1.  Создайте файл `src/common/pipes/parse-optional-int.pipe.ts`.
2.  Реализуйте в нем класс `ParseOptionalIntPipe`, следуя требованиям выше.
3.  Примените этот пайп в `HabitsController` к новому, опциональному query-параметру в методе `findAll`.

    ```typescript
    // habits.controller.ts
    // ...
    import { ParseOptionalIntPipe } from 'src/common/pipes/parse-optional-int.pipe';
    
    @Get()
    async findAll(@Query('userId', ParseOptionalIntPipe) userId?: number) {
      console.log('User ID:', userId, '(Тип:', typeof userId, ')');
      // ... остальная логика
    }
    ```
4.  **Протестируйте:**
    -   `GET /api/habits` -> в консоли `User ID: undefined (Тип: undefined)`
    -   `GET /api/habits?userId=42` -> в консоли `User ID: 42 (Тип: number)`
    -   `GET /api/habits?userId=abc` -> должны получить ошибку 400.
