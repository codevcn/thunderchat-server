/*
  Warnings:

  - Added the required column `recipient_id` to the `direct_messages` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "direct_messages" ADD COLUMN     "recipient_id" INTEGER NOT NULL;
