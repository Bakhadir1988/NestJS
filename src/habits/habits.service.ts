// import { Injectable } from '@nestjs/common';
// import { PrismaService } from 'src/prisma/prisma.service';

// import { CreateHabitDto } from './dto/create-habit.dto';

// @Injectable()
// export class HabitsService {
//   constructor(private prisma: PrismaService) {}

//   async create(createHabitDto: CreateHabitDto) {
//     const habit = await this.prisma.habit.create({
//       data: createHabitDto,
//     });
//     return habit;
//   }

//   async findOne(id: number) {
//     const habit = await this.prisma.habit.findUnique({
//       where: { id },
//     });
//     return habit;
//   }

//   async findAll() {
//     const habits = await this.prisma.habit.findMany();
//     return habits;
//   }

//   async delete(id: number) {
//     await this.prisma.habit.delete({
//       where: { id },
//     });
//   }

//   async update(id: number, updateHabitDto: CreateHabitDto) {
//     const habit = await this.prisma.habit.update({
//       where: { id },
//       data: updateHabitDto,
//     });
//     return habit;
//   }
// }
