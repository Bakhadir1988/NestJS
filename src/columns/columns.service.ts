import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserFromJwt } from 'src/auth/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateColumnDto } from './dto/create-column.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { ColumnEntity } from './entities/columns.entity';

@Injectable()
export class ColumnsService {
  constructor(private readonly prisma: PrismaService) {}

  // Проверка доступа к доске
  private async checkAccess(boardId: number, userId: number) {
    const membership = await this.prisma.boardMembership.findUnique({
      where: {
        userId_boardId: {
          userId: userId,
          boardId,
        },
      },
    });

    if (!membership) {
      throw new ForbiddenException('User is not a member of the board');
    }
  }

  // Поиск колонки по id
  private async getColumn(boardId: number, columnId: number, userId: number) {
    // 1. Вызов await this.checkAccess(boardId, userId)
    await this.checkAccess(boardId, userId);
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
    boardId: number,
    createColumn: CreateColumnDto,
    user: UserFromJwt,
  ) {
    await this.checkAccess(boardId, user.id);

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

  async findAll(boardId: number, user: UserFromJwt) {
    await this.checkAccess(boardId, user.id);

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
    boardId: number,
    columnId: number,
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

  async remove(boardId: number, columnId: number, user: UserFromJwt) {
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
