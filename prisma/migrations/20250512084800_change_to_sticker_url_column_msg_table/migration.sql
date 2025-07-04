/*
  Warnings:

  - You are about to drop the column `sticker_id` on the `direct_messages` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[thumbnail_url]` on the table `sticker_categories` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "direct_messages" DROP CONSTRAINT "direct_messages_sticker_id_fkey";

-- DropIndex
DROP INDEX "sticker_categories_name_key";

-- AlterTable
ALTER TABLE "direct_messages" DROP COLUMN "sticker_id",
ADD COLUMN     "sticker_url" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "sticker_categories_thumbnail_url_key" ON "sticker_categories"("thumbnail_url");

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_sticker_url_fkey" FOREIGN KEY ("sticker_url") REFERENCES "stickers"("image_url") ON DELETE SET NULL ON UPDATE CASCADE;
