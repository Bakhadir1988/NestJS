// src/auth/interfaces/jwt-payload.interface.ts

export interface JwtPayload {
  sub: number; // 'sub' (subject) — это стандартное имя для ID пользователя в JWT
  email: string;
  name: string;

  // Стандартные поля, которые добавляет JWT библиотека
  iat?: number; // 'issued at' — время создания токена
  exp?: number; // 'expiration time' — время, когда токен станет невалидным
}
