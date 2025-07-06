/*
  Warnings:

  - A unique constraint covering the columns `[last_sent_message_id]` on the table `group_chats` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "direct_chats" DROP CONSTRAINT "direct_chats_last_sent_message_id_fkey";

-- AlterTable
ALTER TABLE "direct_chats" ALTER COLUMN "last_sent_message_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "group_chats" ADD COLUMN     "last_sent_message_id" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "group_chats_last_sent_message_id_key" ON "group_chats"("last_sent_message_id");

-- AddForeignKey
ALTER TABLE "direct_chats" ADD CONSTRAINT "direct_chats_last_sent_message_id_fkey" FOREIGN KEY ("last_sent_message_id") REFERENCES "direct_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_last_sent_message_id_fkey" FOREIGN KEY ("last_sent_message_id") REFERENCES "group_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
