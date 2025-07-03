/*
  Warnings:

  - A unique constraint covering the columns `[id_name]` on the table `sticker_categories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_name` to the `sticker_categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sticker_categories" ADD COLUMN     "id_name" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "sticker_categories_id_name_key" ON "sticker_categories"("id_name");
