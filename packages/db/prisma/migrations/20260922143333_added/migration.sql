/*
  Warnings:

  - Added the required column `rating` to the `UserRating` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "UserRating" ADD COLUMN     "rating" INTEGER NOT NULL;
