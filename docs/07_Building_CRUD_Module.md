# Урок 7: Реализация первого CRUD-модуля

Это практический урок, который объединяет множество ранее изученных концепций для создания полноценного функционального блока в нашем приложении. Мы создадим модуль для управления "Досками" (Boards) с нуля.

## Ключевые концепции

Для создания CRUD-модуля нам потребуется слаженная работа нескольких компонентов NestJS.

### 1. Генерация кода с помощью Nest CLI

Nest CLI — наш главный инструмент для ускорения разработки. Команда `nest g resource` создает всю необходимую файловую заготовку.

```bash
# nest g resource <имя> --no-spec
nest g resource boards --no-spec
```

- `g resource boards`: говорит CLI сгенерировать полный набор для ресурса "boards".
- `--no-spec`: флаг, который отключает создание тестовых файлов `.spec.ts`. Мы добавим тесты позже, в соответствующем разделе.

Эта команда создаст директорию `src/boards` и наполнит ее файлами:

- `boards.module.ts`: Контейнер для нашего модуля.
- `boards.controller.ts`: Место для наших HTTP эндпоинтов.
- `boards.service.ts`: Место для нашей бизнес-логики.
- `dto/create-board.dto.ts`: Класс для валидации тела запроса на создание.
- `dto/update-board.dto.ts`: Класс для валидации тела запроса на обновление.
- `entities/board.entity.ts`: Класс-представление сущности. **ВАЖНО:** Этот файл создается по умолчанию, так как это стандарт для TypeORM. В нашем проекте с Prisma он не нужен, и его следует **удалить**, чтобы избежать путаницы. Нашим источником правды о моделях является `schema.prisma`.

### 2. Контроллер (`@Controller`)

Контроллер — это слой, отвечающий за прием HTTP-запросов и отправку ответов.

**Задачи контроллера:**

- Определить маршруты (эндпоинты).
- Защитить маршруты с помощью Гардов (`@UseGuards`).
- Извлечь данные из запроса (`@Param`, `@Query`, `@Body`, `@CurrentUser`).
- Валидировать данные (`ValidationPipe`, который работает с DTO).
- Вызвать соответствующий метод сервиса, передав ему данные.
- Вернуть результат работы сервиса.

**Пример эндпоинта на создание:**

```typescript
// boards.controller.ts

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserFromJwt } from '../auth/interfaces';

@UseGuards(JwtAuthGuard) // Защищаем все эндпоинты в этом контроллере
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  create(
    @Body() createBoardDto: CreateBoardDto,
    @CurrentUser() user: UserFromJwt,
  ) {
    // Передаем в сервис DTO и информацию о пользователе
    return this.boardsService.create(createBoardDto, user);
  }

  // ... другие эндпоинты (findAll, findOne, update, delete)
}
```

### 3. Сервис (`@Injectable`)

Сервис — это слой, где находится основная бизнес-логика. Он ничего не знает о HTTP.

**Задачи сервиса:**

- Получить данные от контроллера.
- Взаимодействовать с базой данных (`PrismaService`).
- Выполнять проверки прав доступа (например, "может ли этот пользователь редактировать эту доску?").
- Обрабатывать ошибки (например, если доска не найдена).
- Возвращать данные контроллеру.

**Пример метода `create` в сервисе:**

```typescript
// boards.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { UserFromJwt } from '../auth/interfaces';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBoardDto: CreateBoardDto, user: UserFromJwt) {
    // Логика создания доски в БД с привязкой к пользователю
    return this.prisma.board.create({
      data: {
        ...createBoardDto,
        userId: user.id, // Привязываем доску к ID текущего пользователя
      },
    });
  }

  // ... другие методы
}
```

### 4. DTO (Data Transfer Object)

DTO — это классы, которые описывают структуру данных, передаваемых по сети. С помощью декораторов из библиотек `class-validator` и `class-transformer` мы описываем правила валидации для каждого поля.

**Пример `CreateBoardDto`:**

```typescript
// dto/create-board.dto.ts

import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateBoardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsString()
  @MaxLength(500)
  description?: string; // Поле не обязательное
}
```

## Частые ошибки

1.  **Забыть импортировать модуль.** Новый `BoardsModule` не будет работать, пока вы не добавите его в `imports` корневого `AppModule`.
2.  **Смешивание логики.** Помещать логику работы с БД прямо в контроллер. Это нарушает разделение ответственности. Контроллер должен быть "тонким".
3.  **Отсутствие проверки прав.** Позволять пользователю `A` изменять или удалять доску пользователя `B`. Проверка владения — обязательная часть логики в сервисе.
4.  **Отсутствие обработки ошибок.** Не обрабатывать случай, когда сущность не найдена. Prisma при вызове `findUniqueOrThrow` или `delete` с несуществующим `id` выбросит исключение, которое мы уже научились ловить с помощью `PrismaClientExceptionFilter`.

## Best Practices

- **"Thin Controllers, Thick Services"**: Контроллеры должны быть максимально простыми. Вся сложная логика — в сервисах.
- **Используйте DTO для всех входящих данных**: Никогда не доверяйте данным от клиента. Всегда валидируйте их.
- **Проверка владения**: Перед любой операцией изменения или удаления (`update`, `delete`) всегда проверяйте, что текущий пользователь имеет право это делать.

**Пример проверки владения в сервисе:**

```typescript
// boards.service.ts

async remove(id: number, user: UserFromJwt) {
  // 1. Находим доску и проверяем, что она принадлежит пользователю
  const board = await this.prisma.board.findFirst({
    where: {
      id,
      userId: user.id, // Ключевая проверка!
    },
  });

  // 2. Если доска не найдена (или принадлежит другому), выбрасываем ошибку
  if (!board) {
    throw new NotFoundException(`Board with ID ${id} not found.`);
  }

  // 3. Если все хорошо, удаляем
  return this.prisma.board.delete({
    where: { id },
  });
}
```

## Краткий вывод

Создание CRUD-модуля — это стандартная процедура:

1.  **Сгенерировать** ресурс с помощью CLI.
2.  **Определить** DTO для валидации.
3.  **Реализовать** бизнес-логику и работу с БД в Сервисе.
4.  **Создать** эндпоинты в Контроллере.
5.  **Защитить** эндпоинты и проверить права доступа.
6.  **Зарегистрировать** модуль в `AppModule`.

## Практическое задание

1.  С помощью `nest g resource boards --no-spec` сгенерируйте новый модуль.
2.  Создайте `CreateBoardDto` с полями `title` (обязательное, строка) и `description` (необязательное, строка).
3.  Создайте `UpdateBoardDto`, где все поля будут необязательными.
4.  Реализуйте в `BoardsService` все пять CRUD-методов: `create`, `findAll`, `findOne`, `update`, `remove`.
5.  В методе `create` обеспечьте автоматическую привязку создаваемой доски к ID текущего пользователя.
6.  В методе `findAll` возвращайте **только доски текущего пользователя**.
7.  В методах `findOne`, `update` и `remove` обеспечьте проверку владения: пользователь может получать, изменять и удалять **только свои доски**.
8.  Реализуйте все соответствующие эндпоинты в `BoardsController`.
9.  Защитите весь контроллер с помощью `JwtAuthGuard`.
10. Не забудьте импортировать `BoardsModule` в `AppModule`.

Удачи! Задавайте вопросы, если столкнетесь с трудностями.
