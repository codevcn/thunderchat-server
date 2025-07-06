/*
  Warnings:

  - A unique constraint covering the columns `[group_chat_id,user_id]` on the table `group_chat_members` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "group_chat_members_group_chat_id_user_id_key" ON "group_chat_members"("group_chat_id", "user_id");
