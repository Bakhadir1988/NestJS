import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    // В реальном приложении ключ должен храниться в .env
    const isValid = apiKey === 'my-secret-api-key';

    if (!isValid) {
      // Вместо возврата false, лучше выбросить конкретное исключение
      throw new UnauthorizedException('Invalid or missing API Key');
    }

    return true;
  }
}
