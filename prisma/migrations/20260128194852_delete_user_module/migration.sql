/*
  Warnings:

  - You are about to drop the column `userId` on the `Habit` table. All the data in the column will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Habit" DROP CONSTRAINT "Habit_userId_fkey";

-- AlterTable
ALTER TABLE "Habit" DROP COLUMN "userId";

-- DropTable
DROP TABLE "User";
