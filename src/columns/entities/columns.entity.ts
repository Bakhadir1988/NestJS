import { Exclude } from 'class-transformer';

export class ColumnEntity {
  id: number;
  name: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  deletedAt: Date | null;

  constructor(partial: Partial<ColumnEntity>) {
    Object.assign(this, partial);
  }
}
