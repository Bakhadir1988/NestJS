import { Module } from '@nestjs/common';

import { HabitsController } from './habits.controller';
import { HabitsService } from './habits.service';

@Module({
  providers: [HabitsService],
  controllers: [HabitsController],
})
export class HabitsModule {}
