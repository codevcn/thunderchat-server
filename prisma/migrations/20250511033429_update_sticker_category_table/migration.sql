/*
  Warnings:

  - You are about to alter the column `id_name` on the `sticker_categories` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(255)`.

*/
-- AlterTable
ALTER TABLE "sticker_categories" ALTER COLUMN "id_name" SET DATA TYPE VARCHAR(255);
