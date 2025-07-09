-- CreateEnum
CREATE TYPE "GroupChatRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'AUDIO';

-- AlterTable
ALTER TABLE "direct_messages" ADD COLUMN     "reply_to_id" INTEGER;

-- AlterTable
ALTER TABLE "group_chat_members" ADD COLUMN     "role" "GroupChatRole" NOT NULL DEFAULT 'MEMBER';

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "direct_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;
