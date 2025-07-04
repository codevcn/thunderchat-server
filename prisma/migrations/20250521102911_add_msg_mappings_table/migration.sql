-- CreateTable
CREATE TABLE "message_mappings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mappings" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_mappings_user_id_key" ON "message_mappings"("user_id");

-- AddForeignKey
ALTER TABLE "message_mappings" ADD CONSTRAINT "message_mappings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
