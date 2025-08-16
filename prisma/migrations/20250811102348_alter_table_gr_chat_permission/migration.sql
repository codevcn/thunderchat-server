/*
  Warnings:

  - You are about to drop the `greeting_stickers` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[invite_code]` on the table `group_chats` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `joined_by` to the `group_chat_members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
ALTER TYPE "MessageType" ADD VALUE 'NOTIFY';

-- DropForeignKey
ALTER TABLE "greeting_stickers" DROP CONSTRAINT "greeting_stickers_sticker_id_fkey";

-- DropForeignKey
ALTER TABLE "pinned_chats" DROP CONSTRAINT "pinned_chats_direct_chat_id_fkey";

-- AlterTable
ALTER TABLE "group_chat_members" ADD COLUMN     "joined_by" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "group_chats" ADD COLUMN     "invite_code" TEXT;

-- AlterTable
ALTER TABLE "pinned_chats" ADD COLUMN     "group_chat_id" INTEGER,
ALTER COLUMN "direct_chat_id" DROP NOT NULL;

-- DropTable
DROP TABLE "greeting_stickers";

-- CreateTable
CREATE TABLE "blocked_users" (
    "id" SERIAL NOT NULL,
    "blocker_user_id" INTEGER NOT NULL,
    "blocked_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "group_chat_id" INTEGER,

    CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_chat_permissions" (
    "id" SERIAL NOT NULL,
    "group_chat_id" INTEGER NOT NULL,
    "send_message" BOOLEAN NOT NULL DEFAULT true,
    "pin_message" BOOLEAN NOT NULL DEFAULT true,
    "share_invite_code" BOOLEAN NOT NULL DEFAULT true,
    "update_info" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "group_chat_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_chat_permissions_group_chat_id_key" ON "group_chat_permissions"("group_chat_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_chats_invite_code_key" ON "group_chats"("invite_code");

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocker_user_id_fkey" FOREIGN KEY ("blocker_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_group_chat_id_fkey" FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_chats" ADD CONSTRAINT "pinned_chats_direct_chat_id_fkey" FOREIGN KEY ("direct_chat_id") REFERENCES "direct_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_chats" ADD CONSTRAINT "pinned_chats_group_chat_id_fkey" FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_permissions" ADD CONSTRAINT "group_chat_permissions_group_chat_id_fkey" FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_joined_by_fkey" FOREIGN KEY ("joined_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
