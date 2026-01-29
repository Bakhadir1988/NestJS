/*
  Warnings:

  - You are about to drop the column `ownerId` on the `Habit` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Habit" DROP CONSTRAINT "Habit_ownerId_fkey";

-- AlterTable
ALTER TABLE "Habit" DROP COLUMN "ownerId";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "password";
