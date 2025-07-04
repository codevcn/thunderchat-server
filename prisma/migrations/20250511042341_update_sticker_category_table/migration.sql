/*
  Warnings:

  - Added the required column `thumbnail_url` to the `sticker_categories` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "sticker_categories" ADD COLUMN     "thumbnail_url" VARCHAR(512) NOT NULL;

-- AlterTable
ALTER TABLE "stickers" ALTER COLUMN "image_url" SET DATA TYPE VARCHAR(512);
