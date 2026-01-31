import { Module } from '@nestjs/common';
import { ApiKeyGuard } from 'src/auth/guards/api-key.guard';

import { BoardsController } from './boards.controller';

@Module({
  controllers: [BoardsController],
  providers: [ApiKeyGuard],
})
export class BoardsModule {}
