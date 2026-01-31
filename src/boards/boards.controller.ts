import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiKeyGuard } from 'src/auth/guards/api-key.guard';

@UseGuards(ApiKeyGuard)
@Controller('boards')
export class BoardsController {
  @Get() // <-- Вот эта строка
  findAll() {
    // <-- И вот этот метод
    return 'This action returns all boards!';
  }
}
