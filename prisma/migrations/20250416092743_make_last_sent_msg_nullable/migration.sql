-- DropForeignKey
ALTER TABLE "direct_chats" DROP CONSTRAINT "direct_chats_last_sent_message_id_fkey";

-- AlterTable
ALTER TABLE "direct_chats" ALTER COLUMN "last_sent_message_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "direct_chats" ADD CONSTRAINT "direct_chats_last_sent_message_id_fkey" FOREIGN KEY ("last_sent_message_id") REFERENCES "direct_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
