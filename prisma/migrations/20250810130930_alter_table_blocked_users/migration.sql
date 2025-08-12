/*
  Warnings:

  - A unique constraint covering the columns `[invite_link]` on the table `group_chats` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "blocked_users" ADD COLUMN     "group_chat_id" INTEGER;

-- AlterTable
ALTER TABLE "group_chats" ADD COLUMN     "invite_link" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "group_chats_invite_link_key" ON "group_chats"("invite_link");

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_group_chat_id_fkey" FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
