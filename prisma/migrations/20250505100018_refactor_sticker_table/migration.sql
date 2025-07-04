/*
  Warnings:

  - You are about to drop the column `thumbnail_url` on the `stickers` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "DirectMessageType" AS ENUM ('TEXT', 'STICKER');

-- AlterTable
ALTER TABLE "direct_messages" ADD COLUMN     "type" "DirectMessageType" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "stickers" DROP COLUMN "thumbnail_url";
