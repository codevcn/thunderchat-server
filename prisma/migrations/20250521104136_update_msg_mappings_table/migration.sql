/*
  Warnings:

  - You are about to alter the column `key` on the `message_mappings` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "message_mappings" ALTER COLUMN "key" SET DATA TYPE VARCHAR(255);
