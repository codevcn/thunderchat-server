-- CreateEnum
CREATE TYPE "GroupChatRole" AS ENUM ('ADMIN', 'MEMBER');

-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'AUDIO';

-- AlterTable
ALTER TABLE "group_chat_members" ADD COLUMN     "role" "GroupChatRole" NOT NULL DEFAULT 'MEMBER';
