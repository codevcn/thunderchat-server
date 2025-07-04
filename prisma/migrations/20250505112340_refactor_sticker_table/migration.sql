/*
  Warnings:

  - A unique constraint covering the columns `[image_url]` on the table `stickers` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "stickers_category_id_idx" ON "stickers"("category_id");

-- CreateIndex
CREATE UNIQUE INDEX "stickers_image_url_key" ON "stickers"("image_url");
