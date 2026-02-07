import { Exclude } from 'class-transformer';
import { User } from 'src/generated/prisma/client';

export class UserEntity implements User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  password: string;

  constructor(partials: Partial<UserEntity>) {
    Object.assign(this, partials);
  }
}
