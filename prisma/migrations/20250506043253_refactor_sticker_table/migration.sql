/*
  Warnings:

  - You are about to drop the column `category_id` on the `stickers` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "stickers_category_id_idx";

-- AlterTable
ALTER TABLE "stickers" DROP COLUMN "category_id";

-- CreateIndex
CREATE INDEX "stickers_category_idx" ON "stickers"("category");
