import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
} from '@nestjs/common';

import { CreateHabitDto } from './dto/create-habit.dto';
import { HabitsService } from './habits.service';

@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createHabitDto: CreateHabitDto) {
    return this.habitsService.create(createHabitDto);
  }

  @Get()
  async findAll() {
    const habits = await this.habitsService.findAll();
    return habits;
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const habit = await this.habitsService.findOne(id);
    return habit;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteHabit(@Param('id', ParseIntPipe) id: number) {
    return this.habitsService.delete(id);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateHabitDto: CreateHabitDto,
  ) {
    const habit = await this.habitsService.update(id, updateHabitDto);
    return habit;
  }
}
