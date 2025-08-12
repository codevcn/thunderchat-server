-- CreateEnum
CREATE TYPE "BlockType" AS ENUM ('MESSAGE');

-- AlterTable
ALTER TABLE "blocked_users" ADD COLUMN     "block_type" "BlockType" NOT NULL DEFAULT 'MESSAGE';
