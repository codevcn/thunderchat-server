/*
  Warnings:

  - You are about to drop the column `add_member` on the `group_chat_permissions` table. All the data in the column will be lost.
  - You are about to drop the column `remove_member` on the `group_chat_permissions` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "group_chat_permissions" DROP COLUMN "add_member",
DROP COLUMN "remove_member",
ADD COLUMN     "share_invite_code" BOOLEAN NOT NULL DEFAULT true;
