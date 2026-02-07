import { Exclude } from 'class-transformer';
import { Column } from 'src/generated/prisma/client';

export class ColumnEntity implements Column {
  id: string;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  deletedAt: Date | null;
  @Exclude()
  boardId: string;

  constructor(partial: Partial<ColumnEntity>) {
    Object.assign(this, partial);
  }
}
