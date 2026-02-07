import { Exclude } from 'class-transformer';
import { Task } from 'src/generated/prisma/client';

export class TaskEntity implements Task {
  id: string;
  title: string;
  description: string | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;

  @Exclude()
  columnId: string;

  constructor(partial: Partial<TaskEntity>) {
    Object.assign(this, partial);
  }
}
