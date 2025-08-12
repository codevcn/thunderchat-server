/*
  Warnings:

  - Made the column `joined_by` on table `group_chat_members` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "group_chat_members" DROP CONSTRAINT "group_chat_members_joined_by_fkey";

-- AlterTable
ALTER TABLE "group_chat_members" ALTER COLUMN "joined_by" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_joined_by_fkey" FOREIGN KEY ("joined_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
