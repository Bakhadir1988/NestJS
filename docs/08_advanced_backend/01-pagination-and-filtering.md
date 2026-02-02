# Урок 08: Пагинация и Фильтрация

## 1. Краткое описание темы

Пагинация и фильтрация — это фундаментальные техники для работы с большими наборами данных в API. Пагинация позволяет запрашивать данные по частям (страницами), а фильтрация — получать только те данные, которые соответствуют определённым критериям. Это критически важно для производительности, стабильности и удобства использования API.

## 2. Ключевые концепции

### Пагинация (Pagination)

Загрузка данных порциями. Существует два основных подхода:

#### а) Offset-based (на основе смещения)

- **Принцип:** Клиент запрашивает конкретную "страницу" данных, указывая её номер и размер.
- **Параметры:** `page` (номер страницы) и `limit` (количество элементов на странице).
- **Пример запроса:** `GET /tasks?page=2&limit=20` (получить 20 задач со второй страницы).
- **Реализация в Prisma:** Используются опции `skip` (пропустить) и `take` (взять). `skip` вычисляется как `(page - 1) * limit`.
- **Плюсы:**
  - Простота реализации.
  - Позволяет пользователю переходить на любую страницу напрямую.
- **Минусы:**
  - Проблемы с производительностью на больших объёмах данных (БД должна "просканировать" все записи до нужного смещения).
  - Риск пропуска или дублирования данных, если в наборе появляются новые элементы во время просмотра.

#### б) Cursor-based (на основе курсора)

- **Принцип:** Клиент запрашивает данные "после" или "до" определённого элемента, используя его уникальный идентификатор (курсор).
- **Параметры:** `cursor` (ID последнего полученного элемента) и `limit` (количество).
- **Пример запроса:** `GET /tasks?cursor=abcdef-12345&limit=20` (получить 20 задач, идущих после задачи с ID `abcdef-12345`).
- **Реализация в Prisma:** Используются опции `cursor` и `take`.
- **Плюсы:**
  - Высокая производительность независимо от объёма данных.
  - Надёжная работа с динамически изменяющимися данными (идеально для "бесконечных лент").
- **Минусы:**
  - Невозможность перейти на произвольную страницу.
  - Более сложная логика на клиенте.

### Фильтрация (Filtering)

Отбор данных по заданным критериям.

- **Принцип:** Клиент передаёт параметры фильтрации в виде query-параметров URL.
- **Пример запроса:** `GET /tasks?status=COMPLETED&priority=HIGH` (получить выполненные задачи с высоким приоритетом).
- **Реализация в Prisma:** Параметры из запроса добавляются в условие `where` в запросе к БД.

---

## 3. Пример кода

### Шаг 1: Создание `PaginationQueryDto`

Создадим универсальный DTO для обработки query-параметров пагинации. Он будет находиться в `src/common/dto/pagination-query.dto.ts`, так как является переиспользуемым.

```typescript
// src/common/dto/pagination-query.dto.ts
import { IsOptional, IsPositive } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsPositive()
  @Type(() => Number)
  limit: number = 10;
}
```

## 4. Best Practices

- **Создавайте универсальный DTO:** Не дублируйте DTO для пагинации в каждом модуле. Выносите его в `common` директорию.
- **Используйте `@Type(() => Number)`:** Все query-параметры приходят в виде строк. Этот декоратор из `class-transformer` обеспечивает их корректное преобразование в числа перед валидацией.
- **Задавайте значения по умолчанию:** `page = 1`, `limit = 10`. Это делает API более предсказуемым и позволяет клиентам не передавать параметры, если их устраивают стандартные значения.
- **Используйте валидаторы:** `@IsPositive` защищает от некорректных значений вроде `page=0` или `page=-1`. `@IsOptional` делает параметры необязательными.

### Шаг 2: Обновление Controller, Service и Interceptor

Далее мы последовательно обновляем каждый слой нашего приложения для поддержки пагинации.

**`boards.controller.ts`**
Контроллер теперь принимает `PaginationQueryDto` через декоратор `@Query` и передает его в сервис.

```typescript
// src/boards/boards.controller.ts
// ... imports
import { Query } from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Controller('boards')
export class BoardsController {
  // ... constructor, create, etc.

  @Get()
  async findMany(
    @Request() request: RequestWithUser,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    const user = request.user;
    return this.boardsService.findMany(user, paginationQuery);
  }

  // ... findOne, delete, update
}
```

**`boards.service.ts`**
Сервис выполняет основную работу: делает два запроса к БД в рамках одной транзакции (`$transaction`) для получения данных и общего количества, а затем формирует итоговый объект с `data` и `meta`.

```typescript
// src/boards/boards.service.ts
// ... imports
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

@Injectable()
export class BoardsService {
  // ... constructor, create

  async findMany(user: UserFromJwt, paginationQuery: PaginationQueryDto) {
    const { page, limit } = paginationQuery;
    const skip = (page - 1) * limit;

    const [total, boards] = await this.prisma.$transaction([
      this.prisma.board.count({
        where: { userId: user.id },
      }),
      this.prisma.board.findMany({
        where: { userId: user.id },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: boards.map((board) => new BoardEntity(board)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }
  // ... findOne, delete, update
}
```

**`response-transform.interceptor.ts`**
Интерсептор становится "умнее": он проверяет наличие поля `meta` в ответе. Если оно есть, он отдает ответ как есть (просто добавляя `statusCode`). Если `meta` нет, он оборачивает ответ в `{ data: ... }`, как и раньше.

```typescript
// src/common/interceptors/response-transform.interceptor.ts
// ... imports

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  any
> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Если data существует и содержит ключ 'meta', это наш ответ с пагинацией
        if (data && 'meta' in data) {
          return {
            statusCode: response.statusCode,
            ...data, // "Раскрываем" объект { data: [...], meta: {...} }
          };
        }
        // В противном случае, это обычный ответ
        return {
          statusCode: response.statusCode,
          data,
        };
      }),
    );
  }
}
```

## 5. Частые ошибки

- **Забыть про `await`:** При работе с асинхронными вызовами, особенно с `$transaction`, легко забыть `await`, что приведет к непредсказуемому поведению.
- **Неправильный расчет `skip`:** Ошибки в формуле `(page - 1) * limit` (например, `page * limit`) приводят к неверной выборке данных.
- **Неверная обработка в интерсепторе:** Без "умного" интерсептора ответы с пагинацией будут иметь неверную структуру (`{ "data": { "data": [...]} }`).

---

## 6. Практическое задание
