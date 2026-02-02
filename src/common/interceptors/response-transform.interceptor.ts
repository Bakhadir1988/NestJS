import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

// Опишем интерфейс для нашей новой структуры ответа
export interface TransformedResponse<T> {
  statusCode: number;
  data: T;
  meta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<
  T,
  TransformedResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<TransformedResponse<T>> {
    // Получаем объект ответа, чтобы из него взять statusCode
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        if (data && 'meta' in data) {
          // Проверяем, что data существует и в нем есть meta

          // Ветка №1: Это ответ с пагинацией.
          // data здесь — это { data: [...], meta: {...} }.
          // Нам нужно вернуть объект, который будет итоговым JSON.
          return {
            statusCode: response.statusCode,
            data: data.data, // Берем вложенные данные
            meta: data.meta, // Берем вложенную мету
          };
        } else {
          // Ветка №2: Это обычный ответ.
          // data здесь — это просто { id: 1, ... } или [ { id: 1, ... } ].
          // Возвращаем объект как и раньше.
          return {
            statusCode: response.statusCode,
            data: data, // Просто оборачиваем data
          };
        }
      }),
    );
  }
}
