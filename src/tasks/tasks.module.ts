import { Module } from '@nestjs/common';
import { BoardsModule } from 'src/boards/boards.module';

import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  controllers: [TasksController],
  providers: [TasksService],
  imports: [BoardsModule],
})
export class TasksModule {}
