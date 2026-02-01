// src/auth/strategies/jwt.strategy.ts

import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { JwtPayload, UserFromJwt } from '../interfaces';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly configService: ConfigService) {
    const jwtSecret = configService.get<string>('JWT_SECRET');

    if (!jwtSecret) {
      throw new Error('ACCESS_SECRET is not defined in environment');
    }

    super({
      // 1. Указываем, как извлечь токен из запроса
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // 2. Указываем, что не нужно игнорировать истекший срок действия токена
      ignoreExpiration: false,

      // 3. Указываем секретный ключ для проверки подписи
      secretOrKey: jwtSecret, // ВАЖНО: Ключ должен быть тот же, что и в auth.module.ts
    });
  }

  // 4. Этот метод вызывается, если токен успешно прошел проверку
  async validate(payload: JwtPayload): Promise<UserFromJwt> {
    // payload - это расшифрованное содержимое токена, которое мы зашивали при логине
    // То, что мы возвращаем отсюда, NestJS поместит в request.user
    return { id: payload.sub, name: payload.name, email: payload.email };
  }
}
