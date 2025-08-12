-- DropForeignKey
ALTER TABLE "pinned_chats" DROP CONSTRAINT "pinned_chats_direct_chat_id_fkey";

-- AlterTable
ALTER TABLE "pinned_chats" ADD COLUMN     "group_chat_id" INTEGER,
ALTER COLUMN "direct_chat_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "pinned_chats" ADD CONSTRAINT "pinned_chats_direct_chat_id_fkey" FOREIGN KEY ("direct_chat_id") REFERENCES "direct_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_chats" ADD CONSTRAINT "pinned_chats_group_chat_id_fkey" FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
