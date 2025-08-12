-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'NOTIFY';

-- AlterTable
ALTER TABLE "group_chat_members" ADD COLUMN     "joined_by" INTEGER;

-- AddForeignKey
ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_joined_by_fkey" FOREIGN KEY ("joined_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
