/*
  Warnings:

  - You are about to alter the column `thumbnail_url` on the `sticker_categories` table. The data in that column could be lost. The data in that column will be cast from `VarChar(2000)` to `VarChar(255)`.
  - You are about to alter the column `image_url` on the `stickers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(2000)` to `VarChar(255)`.
  - You are about to drop the column `username` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "sticker_categories" ALTER COLUMN "thumbnail_url" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "stickers" ALTER COLUMN "image_url" SET DATA TYPE VARCHAR(255);

-- AlterTable
ALTER TABLE "users" DROP COLUMN "username";
