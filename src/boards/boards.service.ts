import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserFromJwt } from 'src/auth/interfaces';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateBoardDto } from './dto/create-board.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardEntity } from './entities/board.entity';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  public async checkAccess(boardId: string, userId: string) {
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

  async create(
    createBoardDto: CreateBoardDto,
    user: UserFromJwt,
  ): Promise<BoardEntity> {
    const newBoard = await this.prisma.board.create({
      data: {
        // Явно указываем поля для Board
        name: createBoardDto.name,

        // А вот и магия:
        memberships: {
          create: {
            userId: user.id, // ID текущего пользователя
            role: 'OWNER', // Создатель доски - всегда OWNER
          },
        },
      },
    });

    return new BoardEntity(newBoard);
  }

  async findMany(user: UserFromJwt, paginationQuery: PaginationQueryDto) {
    const { page, limit, search } = paginationQuery;
    const skip = (page - 1) * limit;

    const where = {
      memberships: {
        some: {
          userId: user.id,
        },
      },
      deletedAt: null,
    };

    if (search) {
      where['name'] = {
        contains: search,
        mode: 'insensitive',
      };
    }

    const [total, boards] = await this.prisma.$transaction([
      this.prisma.board.count({
        where,
      }),
      this.prisma.board.findMany({
        where,
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: boards.map((board) => new BoardEntity(board)),
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOne(id: string, user: UserFromJwt) {
    const board = await this.prisma.board.findFirst({
      where: {
        id,
        deletedAt: null,

        // Фильтр по связи:
        memberships: {
          some: {
            userId: user.id,
          },
        },
      },
    });
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    return new BoardEntity(board);
  }

  async inviteMember(
    boardId: string,
    inviteUser: InviteUserDto,
    user: UserFromJwt,
  ) {
    // Шаг 1.1: Найти членство текущего пользователя (кто приглашает)
    const membership = await this.prisma.boardMembership.findFirst({
      where: {
        boardId,
        userId: user.id,
      },
    });

    // Шаг 1.2: Проверить права. Либо членства нет, либо роль не 'OWNER'
    if (!membership || membership.role !== 'OWNER') {
      throw new ForbiddenException(
        'You do not have permission to invite members to this board.',
      );
    }
    // Шаг 2: Найти пользователя, которого приглашают
    const invitee = await this.prisma.user.findUnique({
      where: {
        email: inviteUser.email,
      },
    });

    if (!invitee) {
      throw new NotFoundException('User not found');
    }

    // Шаг 3: Проверка на само-приглашение
    if (invitee.id === user.id) {
      throw new BadRequestException('Cannot invite yourself');
    }

    // Шаг 4: Проверка на дубликат
    const existingMembership = await this.prisma.boardMembership.findFirst({
      where: {
        userId: invitee.id,
        boardId: boardId,
      },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already a member');
    }

    // Шаг 5: Создание новой записи в таблице boardMembership
    return await this.prisma.boardMembership.create({
      data: {
        userId: invitee.id,
        boardId: boardId,
        role: inviteUser.role,
      },
    });
  }

  async delete(id: string, user: UserFromJwt) {
    const result = await this.prisma.board.updateMany({
      where: {
        id: id,
        memberships: {
          some: {
            userId: user.id,
          },
        },
        deletedAt: null,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    // updateMany возвращает { count: ... }
    if (result.count === 0) {
      // Если ничего не удалено, значит доски не было или она чужая
      throw new NotFoundException(`Board with ID #${id} not found.`);
    }
  }

  async update(
    id: string,
    updateBoardDto: UpdateBoardDto,
    user: UserFromJwt,
  ): Promise<BoardEntity> {
    // 1. Сначала проверяем права и существование доски.
    // Этот метод сам выбросит 404 или 403, если что-то не так.
    await this.findOne(id, user);

    // 2. Если findOne не выбросил ошибку, значит все в порядке, можно обновлять.
    const updatedBoard = await this.prisma.board.update({
      where: { id },
      data: updateBoardDto,
    });

    return new BoardEntity(updatedBoard);
  }
}
