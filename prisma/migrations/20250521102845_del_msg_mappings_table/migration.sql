/*
  Warnings:

  - You are about to drop the `MessageMapping` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "MessageMapping" DROP CONSTRAINT "MessageMapping_user_id_fkey";

-- DropTable
DROP TABLE "MessageMapping";
