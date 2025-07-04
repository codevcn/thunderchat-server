/*
  Warnings:

  - You are about to drop the column `message_mappings` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "users" DROP COLUMN "message_mappings";

-- CreateTable
CREATE TABLE "MessageMapping" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mappings" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MessageMapping_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MessageMapping_user_id_key" ON "MessageMapping"("user_id");

-- AddForeignKey
ALTER TABLE "MessageMapping" ADD CONSTRAINT "MessageMapping_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
