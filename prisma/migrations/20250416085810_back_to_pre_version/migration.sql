/*
  Warnings:

  - You are about to drop the column `last_message_sent` on the `direct_chats` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "direct_chats" DROP COLUMN "last_message_sent";
