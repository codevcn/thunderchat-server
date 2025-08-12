/*
  Warnings:

  - Changed the type of `message_type` on the `reported_messages` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReportedMessageType" AS ENUM ('TEXT', 'STICKER', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT');

-- AlterTable
ALTER TABLE "reported_messages" DROP COLUMN "message_type",
ADD COLUMN     "message_type" "ReportedMessageType" NOT NULL;
