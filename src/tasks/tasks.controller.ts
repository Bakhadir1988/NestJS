import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard';
import { type UserFromJwt } from 'src/auth/interfaces';

import { CreateTaskDto } from './dto/create-task.dto';
import { TasksService } from './tasks.service';

@UseGuards(JwtAuthGuard)
@Controller('boards/:boardId/columns/:columnId/tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  // Создание задачи
  @Post()
  async create(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() createTaskDto: CreateTaskDto,
    @CurrentUser() user: UserFromJwt,
  ) {
    return await this.tasksService.create(
      boardId,
      columnId,
      createTaskDto,
      user,
    );
  }

  // Получение всех задач

  @Get()
  async findAll(
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @CurrentUser() user: UserFromJwt,
  ) {
    return await this.tasksService.findAll(boardId, columnId, user);
  }
}
