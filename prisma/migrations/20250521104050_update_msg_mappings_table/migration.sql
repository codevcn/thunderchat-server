/*
  Warnings:

  - Added the required column `key` to the `message_mappings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "message_mappings" ADD COLUMN     "key" TEXT NOT NULL;
