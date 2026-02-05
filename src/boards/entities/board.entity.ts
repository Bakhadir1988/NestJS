import { Exclude } from 'class-transformer';
import { Board } from 'src/generated/prisma/client';

export class BoardEntity implements Board {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  userId: number;
  @Exclude()
  deletedAt: Date | null;

  constructor(partial: Partial<BoardEntity>) {
    Object.assign(this, partial);
  }
}
