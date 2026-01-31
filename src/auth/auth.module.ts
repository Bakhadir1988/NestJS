// src/auth/auth.module.ts

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UsersModule } from 'src/users/users.module';

// UsersService больше не нужно импортировать здесь напрямую
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';

@Module({
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy], // <-- УБЕРИТЕ UsersService ОТСЮДА
  imports: [
    UsersModule, // <-- Этого достаточно, чтобы получить UsersService
    JwtModule.register({
      secret: 'YOUR_SUPER_SECRET_KEY',
      signOptions: { expiresIn: '60m' },
    }),
  ],
})
export class AuthModule {}
