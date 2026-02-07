import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard';
import { type UserFromJwt } from 'src/auth/interfaces';

import { ColumnsService } from './columns.service';
import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';

@UseGuards(JwtAuthGuard)
@Controller('boards/:boardId/columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  // создание колонки
  @Post()
  async create(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Body() createColumn: CreateColumnDto,
    @CurrentUser() user: UserFromJwt,
  ) {
    return this.columnsService.create(boardId, createColumn, user);
  }

  //  Получение колонок
  @Get()
  async findAll(
    @Param('boardId', ParseIntPipe) boardId: number,
    @CurrentUser() user: UserFromJwt,
  ) {
    return this.columnsService.findAll(boardId, user);
  }

  @Patch(':columnId')
  update(
    // 1. Получаем boardId из пути контроллера
    @Param('boardId', ParseIntPipe) boardId: number,

    // 2. Получаем columnId из пути этого метода
    @Param('columnId', ParseIntPipe) columnId: number,

    // 3. Получаем тело запроса
    @Body() updateColumnDto: UpdateColumnDto,

    // 4. Получаем текущего пользователя
    @CurrentUser() user: UserFromJwt,
  ) {
    // И передаем ВСЕ необходимые данные в сервис
    return this.columnsService.update(boardId, columnId, updateColumnDto, user);
  }

  // Удаление колонки
  @Delete(':columnId')
  @HttpCode(204)
  async remove(
    @Param('boardId', ParseIntPipe) boardId: number,
    @Param('columnId', ParseIntPipe) columnId: number,
    @CurrentUser() user: UserFromJwt,
  ) {
    return this.columnsService.remove(boardId, columnId, user);
  }
}
