import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import { UserFromJwt } from '../interfaces'; // Убедитесь, что импорт правильный

export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserFromJwt => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
