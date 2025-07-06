/*
  Warnings:

  - The `type` column on the `direct_messages` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `creator_id` to the `group_chats` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `group_messages` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'STICKER', 'VIDEO', 'IMAGE');

-- AlterTable
ALTER TABLE "direct_messages" DROP COLUMN "type",
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT';

-- AlterTable
ALTER TABLE "group_chats" ADD COLUMN     "creator_id" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "group_messages" ADD COLUMN     "status" "MessageStatusEnum" NOT NULL,
ADD COLUMN     "sticker_url" TEXT,
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'TEXT';

-- DropEnum
DROP TYPE "DirectMessageType";

-- CreateTable
CREATE TABLE "group_chat_members" (
    "id" SERIAL NOT NULL,
    "group_chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "group_chat_members_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_group_chat_id_fkey" FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
