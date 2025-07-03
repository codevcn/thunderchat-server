-- CreateTable
CREATE TABLE "greeting_stickers" (
    "id" SERIAL NOT NULL,
    "sticker_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greeting_stickers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "greeting_stickers_sticker_id_key" ON "greeting_stickers"("sticker_id");

-- AddForeignKey
ALTER TABLE "greeting_stickers" ADD CONSTRAINT "greeting_stickers_sticker_id_fkey" FOREIGN KEY ("sticker_id") REFERENCES "stickers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
