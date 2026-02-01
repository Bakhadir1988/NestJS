// src/boards/dto/update-board.dto.ts
import { IsOptional, IsString } from 'class-validator';

export class UpdateBoardDto {
  @IsString()
  @IsOptional() // <-- Позволяет этому полю отсутствовать в запросе
  name?: string;
}
