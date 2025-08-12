/*
  Warnings:

  - You are about to drop the `BlockedUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BlockedUser" DROP CONSTRAINT "BlockedUser_blocked_user_id_fkey";

-- DropForeignKey
ALTER TABLE "BlockedUser" DROP CONSTRAINT "BlockedUser_blocker_user_id_fkey";

-- DropTable
DROP TABLE "BlockedUser";

-- CreateTable
CREATE TABLE "blocked_users" (
    "id" SERIAL NOT NULL,
    "blocker_user_id" INTEGER NOT NULL,
    "blocked_user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_user_id_fkey" FOREIGN KEY ("blocked_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocker_user_id_fkey" FOREIGN KEY ("blocker_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
