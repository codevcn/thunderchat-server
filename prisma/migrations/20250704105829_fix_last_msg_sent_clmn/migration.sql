/*
  Warnings:

  - Made the column `last_sent_message_id` on table `direct_chats` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "DirectMessageType" ADD VALUE 'VIDEO';
ALTER TYPE "DirectMessageType" ADD VALUE 'IMAGE';

-- DropForeignKey
ALTER TABLE "direct_chats" DROP CONSTRAINT "direct_chats_last_sent_message_id_fkey";

-- AlterTable
ALTER TABLE "direct_chats" ALTER COLUMN "last_sent_message_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "direct_chats" ADD CONSTRAINT "direct_chats_last_sent_message_id_fkey" FOREIGN KEY ("last_sent_message_id") REFERENCES "direct_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
