/*
  Warnings:

  - You are about to drop the column `block_type` on the `blocked_users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "blocked_users" DROP COLUMN "block_type";

-- DropEnum
DROP TYPE "BlockType";
