/*
  Warnings:

  - You are about to drop the `greeting_stickers` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "greeting_stickers" DROP CONSTRAINT "greeting_stickers_sticker_id_fkey";

-- DropTable
DROP TABLE "greeting_stickers";
