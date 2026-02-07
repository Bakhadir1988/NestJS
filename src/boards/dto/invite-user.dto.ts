import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from 'src/generated/prisma/enums';

export class InviteUserDto {
  @IsEmail({}, { message: 'Пожалуйста, введите корректный email.' })
  @IsNotEmpty({ message: 'Email не может быть пустым.' })
  email: string;

  @IsEnum(Role, {
    message: 'Роль должна быть одной из: OWNER, MEMBER, VIEWER.',
  })
  @IsNotEmpty({ message: 'Роль не может быть пустой.' })
  role: Role;
}
