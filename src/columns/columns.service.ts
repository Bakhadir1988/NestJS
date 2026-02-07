import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserFromJwt } from 'src/auth/interfaces';
import { BoardsService } from 'src/boards/boards.service';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ColumnEntity } from './entities/columns.entity';

@Injectable()
export class ColumnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly boardService: BoardsService,
  ) {}

  // Поиск колонки по id
  private async getColumn(boardId: string, columnId: string, userId: string) {
    // 1. Вызов await this.checkAccess(boardId, userId)
    await this.boardService.checkAccess(boardId, userId);
    // 2. Поиск колонки по columnId
    const column = await this.prisma.column.findFirst({
      where: {
        id: columnId,
        deletedAt: null,
      },
    });
    // 3. Проверка, что column.boardId === boardId
    if (!column || column.boardId !== boardId) {
      throw new ForbiddenException('Column not found on this board.');
    }
    // 4. Если все хорошо, можно вернуть найденную колонку: return column;
    return column;
  }

  async create(
    boardId: string,
    createColumn: CreateColumnDto,
    user: UserFromJwt,
  ) {
    await this.boardService.checkAccess(boardId, user.id);

    const columnCount = await this.prisma.column.count({
      where: {
        boardId,
      },
    });

    const column = await this.prisma.column.create({
      data: {
        name: createColumn.name,
        boardId,
        order: columnCount + 1,
      },
    });

    return new ColumnEntity(column);
  }

  async findAll(boardId: string, user: UserFromJwt) {
    await this.boardService.checkAccess(boardId, user.id);

    const columns = await this.prisma.column.findMany({
      where: {
        boardId,
        deletedAt: null,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return columns.map((column) => new ColumnEntity(column));
  }

  async update(
    boardId: string,
    columnId: string,
    updateColumnDto: UpdateColumnDto,
    user: UserFromJwt,
  ) {
    await this.getColumn(boardId, columnId, user.id);

    const column = await this.prisma.column.update({
      where: { id: columnId },
      data: updateColumnDto,
    });

    return new ColumnEntity(column);
  }

  async remove(boardId: string, columnId: string, user: UserFromJwt) {
    await this.getColumn(boardId, columnId, user.id);

    const column = await this.prisma.column.update({
      where: { id: columnId },
      data: {
        deletedAt: new Date(),
      },
    });

    return new ColumnEntity(column);
  }
}
