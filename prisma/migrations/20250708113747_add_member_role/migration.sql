/*
  Warnings:

  - The values [AUDIO] on the enum `MessageType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "MessageType_new" AS ENUM ('TEXT', 'STICKER', 'IMAGE', 'VIDEO', 'DOCUMENT');
ALTER TABLE "direct_messages" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "group_messages" ALTER COLUMN "type" DROP DEFAULT;
ALTER TABLE "direct_messages" ALTER COLUMN "type" TYPE "MessageType_new" USING ("type"::text::"MessageType_new");
ALTER TABLE "group_messages" ALTER COLUMN "type" TYPE "MessageType_new" USING ("type"::text::"MessageType_new");
ALTER TYPE "MessageType" RENAME TO "MessageType_old";
ALTER TYPE "MessageType_new" RENAME TO "MessageType";
DROP TYPE "MessageType_old";
ALTER TABLE "direct_messages" ALTER COLUMN "type" SET DEFAULT 'TEXT';
ALTER TABLE "group_messages" ALTER COLUMN "type" SET DEFAULT 'TEXT';
COMMIT;
