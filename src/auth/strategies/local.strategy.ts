import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';

import { AuthService } from '../auth.service';
import { UserFromJwt } from '../interfaces';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Указываем, что в качестве "username" мы будем использовать поле 'email'
    super({ usernameField: 'email' });
  }

  // Passport автоматически вызовет этот метод, передав в него email и password из тела запроса
  async validate(email: string, password: string): Promise<UserFromJwt> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}
