import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Response } from 'express';
import { Prisma } from 'src/generated/prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Для ошибки P2002 (нарушение уникальности)
    if (exception.code === 'P2002') {
      const status = HttpStatus.CONFLICT; // 409 Conflict
      const target = (exception.meta?.target as string[])?.join(', ');

      response.status(status).json({
        statusCode: status,
        message: `A record with this ${target} already exists.`,
      });
    } else {
      // Для всех других ошибок Prisma, используем стандартный обработчик
      super.catch(exception, host);
    }
  }
}
