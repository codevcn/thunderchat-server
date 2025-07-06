/*
  Warnings:

  - Made the column `name` on table `group_chats` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "group_chats" ALTER COLUMN "name" SET NOT NULL;
