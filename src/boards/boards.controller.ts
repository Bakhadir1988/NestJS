import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth-guard';
import { type RequestWithUser, UserFromJwt } from 'src/auth/interfaces';
import { PaginationQueryDto } from 'src/common/dto/pagination-query.dto';

import { BoardsService } from './boards.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { UpdateBoardDto } from './dto/update-board.dto';

@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  async create(
    @Body() createBoard: CreateBoardDto,
    @Request() req: RequestWithUser,
  ) {
    const user = req.user as UserFromJwt;
    return this.boardsService.create(createBoard, user);
  }

  @Get()
  async findMany(
    @Request() request: RequestWithUser,
    @Query() paginationQuery: PaginationQueryDto,
  ) {
    const user = request.user;
    return this.boardsService.findMany(user, paginationQuery);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() request: RequestWithUser) {
    const user = request.user;
    return this.boardsService.findOne(id, user);
  }

  @Delete(':id')
  async delete(@Param('id') id: string, @Request() request: RequestWithUser) {
    const user = request.user;
    await this.boardsService.delete(id, user);

    return { message: `Board id ${id} user ${user.id} deleted successfully` };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateBoard: UpdateBoardDto,
    @Request() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.boardsService.update(id, updateBoard, user);
  }

  @Post(':id/members')
  async inviteMember(
    @Param('id') boardId: string,
    @Body() inviteMemeber: InviteUserDto,
    @Request() request: RequestWithUser,
  ) {
    const user = request.user;
    return this.boardsService.inviteMember(boardId, inviteMemeber, user);
  }
}
