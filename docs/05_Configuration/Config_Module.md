# Управление конфигурацией с @nestjs/config

До сих пор мы хранили конфигурационные данные, такие как секретный ключ JWT, прямо в коде. Это небезопасно и негибко. В этом уроке мы научимся делать это правильно с помощью официального модуля `@nestjs/config`.

**Основная идея:** все, что может меняться в зависимости от окружения (dev, production) или является секретом, должно храниться в **переменных окружения**.

---

## 1. Ключевые концепции

### Файл `.env`

Это стандартный способ хранить переменные окружения для локальной разработки. Это простой текстовый файл в корне проекта, где каждая строка — это пара `КЛЮЧ=ЗНАЧЕНИЕ`.

**Пример `.env` файла:**
```
DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
JWT_SECRET="MySuperSecretKey"
PORT=3000
```
**ВАЖНО:** Файл `.env` никогда не должен попадать в Git. Его нужно сразу добавить в `.gitignore`.

### `ConfigModule` и `ConfigService`

-   `@nestjs/config` — это модуль, который читает ваш `.env` файл и делает переменные из него доступными внутри вашего приложения через Dependency Injection.
-   `ConfigModule`: Главный модуль, который мы импортируем. Вызов `ConfigModule.forRoot()` запускает процесс чтения `.env` файла.
-   `ConfigService`: Сервис, который мы можем внедрять в другие сервисы, модули или компоненты, чтобы получить значение любой переменной с помощью метода `.get()`.

---

## 2. Пример кода: Настраиваем JWT_SECRET

Наша задача — вынести `YOUR_SUPER_SECRET_KEY` из кода в `.env` файл.

#### Шаг 1: Установка

```bash
npm install @nestjs/config
```

#### Шаг 2: Создание `.env` и добавление в `.gitignore`

1.  В корне вашего проекта создайте файл с именем `.env`.
2.  Добавьте в него ваш секрет:
    ```
    # .env
    JWT_SECRET=MySuperSecretKeyThatIsVeryLongAndSecure
    ```
3.  Откройте файл `.gitignore` и добавьте в конец новую строку:
    ```
    # .gitignore
    .env
    ```

#### Шаг 3: Глобальная регистрация `ConfigModule`

Чтобы `ConfigService` был доступен во всем приложении без необходимости каждый раз импортировать `ConfigModule`, мы зарегистрируем его глобально в `app.module.ts`.

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// ...другие импорты

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Делаем ConfigModule глобальным
    }),
    // ...остальные ваши модули
  ],
  // ...
})
export class AppModule {}
```

#### Шаг 4: Асинхронная настройка `JwtModule`

Теперь самое интересное. Мы не можем просто написать `secret: this.configService.get('JWT_SECRET')` в декораторе `@Module`, потому что декораторы не поддерживают Dependency Injection.

Для таких случаев в NestJS существует специальный асинхронный паттерн `registerAsync`.

```typescript
// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config'; // <-- Импортируем

@Module({
  // ...
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule], // 1. Импортируем ConfigModule
      useFactory: async (configService: ConfigService) => ({
        // 2. useFactory позволяет нам сначала получить зависимости
        secret: configService.get<string>('JWT_SECRET'), // 3. А потом использовать их
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService], // 4. Указываем, что нужно внедрить в useFactory
    }),
  ],
  // ...
})
export class AuthModule {}
```

---

## 3. Best Practices

-   Всегда добавляйте `.env` в `.gitignore`.
-   Создавайте в репозитории файл `.env.example` с перечнем всех нужных переменных, но без их реальных значений, чтобы другие разработчики знали, что им нужно настроить.
-   Используйте валидацию схемы (`validationSchema` в `ConfigModule.forRoot`), чтобы приложение не запускалось, если какая-то важная переменная окружения отсутствует.

---

## 4. Практическое задание

1.  Установите `@nestjs/config`.
2.  Создайте файл `.env` в корне проекта, добавьте в него `JWT_SECRET` и добавьте `.env` в `.gitignore`.
3.  Зарегистрируйте `ConfigModule` глобально в `app.module.ts`.
4.  **Отрефакторите `AuthModule`:** Замените `JwtModule.register()` на `JwtModule.registerAsync()`, как показано в примере, чтобы секрет читался из `ConfigService`.
5.  **Отрефакторите `JwtStrategy`:**
    -   Внедрите `ConfigService` в конструктор `JwtStrategy`.
    -   В `super()` передавайте `secretOrKey` из `configService`, а не хардкодом.
6.  **Проверьте:** Убедитесь, что система логина и доступа к защищенным роутам по-прежнему работает.
