import { Module } from '@nestjs/common';
import { BoardsModule } from 'src/boards/boards.module';

import { ColumnsController } from './columns.controller';
import { ColumnsService } from './columns.service';

@Module({
  controllers: [ColumnsController],
  providers: [ColumnsService],
  imports: [BoardsModule],
  exports: [ColumnsService],
})
export class ColumnsModule {}
