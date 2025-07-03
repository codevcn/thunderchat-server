/*
  Warnings:

  - You are about to drop the column `category` on the `stickers` table. All the data in the column will be lost.
  - Added the required column `category_id` to the `stickers` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "stickers_category_idx";

-- AlterTable
ALTER TABLE "stickers" DROP COLUMN "category",
ADD COLUMN     "category_id" INTEGER NOT NULL;

-- DropEnum
DROP TYPE "StickerCategory";

-- CreateTable
CREATE TABLE "sticker_categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sticker_categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sticker_categories_name_key" ON "sticker_categories"("name");

-- CreateIndex
CREATE INDEX "stickers_category_id_idx" ON "stickers"("category_id");

-- AddForeignKey
ALTER TABLE "stickers" ADD CONSTRAINT "stickers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "sticker_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
