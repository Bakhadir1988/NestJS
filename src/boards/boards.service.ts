import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserFromJwt } from 'src/auth/interfaces';
import { PrismaService } from 'src/prisma/prisma.service';

import { CreateBoardDto } from './dto/create-board.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { BoardEntity } from './entities/board.entity';

@Injectable()
export class BoardsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    createBoardDto: CreateBoardDto,
    user: UserFromJwt,
  ): Promise<BoardEntity> {
    const newBoard = await this.prisma.board.create({
      data: {
        ...createBoardDto,
        user: {
          // Используем connect для создания связи
          connect: {
            id: user.id,
          },
        },
      },
    });

    return new BoardEntity(newBoard);
  }

  async findMany(user: UserFromJwt) {
    const boards = await this.prisma.board.findMany({
      where: {
        userId: user.id,
      },
    });
    return boards.map((board) => new BoardEntity(board));
  }

  async findOne(id: number, user: UserFromJwt) {
    const board = await this.prisma.board.findUnique({
      where: {
        id,
      },
    });
    if (!board) {
      throw new NotFoundException(`Board with ID ${id} not found`);
    }
    if (board.userId !== user.id) {
      throw new ForbiddenException(
        'You are not authorized to access this board',
      );
    }
    return new BoardEntity(board);
  }

  async delete(id: number, user: UserFromJwt) {
    const result = await this.prisma.board.deleteMany({
      where: {
        id: id,
        userId: user.id,
      },
    });

    // deleteMany возвращает { count: ... }
    if (result.count === 0) {
      // Если ничего не удалено, значит доски не было или она чужая
      throw new NotFoundException(`Board with ID #${id} not found.`);
    }
  }

  async update(
    id: number,
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
