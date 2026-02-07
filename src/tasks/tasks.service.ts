import { Injectable, NotFoundException } from '@nestjs/common';
import { UserFromJwt } from 'src/auth/interfaces';
import { BoardsService } from 'src/boards/boards.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateTaskDto } from './dto/create-task.dto';
import { TaskEntity } from './entities/task.entity';

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardService: BoardsService,
  ) {}

  // Создание задачи
  async create(
    boardId: string,
    columnId: string,
    createTaskDto: CreateTaskDto,
    user: UserFromJwt,
  ) {
    await this.boardService.checkAccess(boardId, user.id);

    const column = await this.prisma.column.findFirst({
      where: {
        id: columnId,
        boardId,
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found on this board.');
    }

    const taskCount = await this.prisma.task.count({
      where: {
        columnId,
      },
    });

    const task = await this.prisma.task.create({
      data: {
        ...createTaskDto,
        columnId,
        order: taskCount + 1,
      },
    });

    return new TaskEntity(task);
  }

  // Пполучение задачи
  async findAll(boardId: string, columnId: string, user: UserFromJwt) {
    await this.boardService.checkAccess(boardId, user.id);

    const column = await this.prisma.column.findFirst({
      where: {
        id: columnId,
        boardId,
      },
    });

    if (!column) {
      throw new NotFoundException('Column not found on this board.');
    }

    const tasks = await this.prisma.task.findMany({
      where: {
        columnId,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return tasks.map((task) => new TaskEntity(task));
  }
}
