/*
  Warnings:

  - You are about to drop the column `invite_link` on the `group_chats` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[invite_code]` on the table `group_chats` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "group_chats_invite_link_key";

-- AlterTable
ALTER TABLE "group_chats" DROP COLUMN "invite_link",
ADD COLUMN     "invite_code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "group_chats_invite_code_key" ON "group_chats"("invite_code");
