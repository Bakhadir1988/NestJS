import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateHabitDto {
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @IsString()
  @IsOptional()
  readonly description?: string;

  @IsBoolean()
  readonly completed: boolean;
}
