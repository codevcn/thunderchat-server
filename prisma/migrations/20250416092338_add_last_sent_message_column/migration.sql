/*
  Warnings:

  - A unique constraint covering the columns `[last_sent_message_id]` on the table `direct_chats` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "direct_chats" ADD COLUMN     "last_sent_message_id" INTEGER NOT NULL DEFAULT 80;

-- CreateIndex
CREATE UNIQUE INDEX "direct_chats_last_sent_message_id_key" ON "direct_chats"("last_sent_message_id");

-- AddForeignKey
ALTER TABLE "direct_chats" ADD CONSTRAINT "direct_chats_last_sent_message_id_fkey" FOREIGN KEY ("last_sent_message_id") REFERENCES "direct_messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
