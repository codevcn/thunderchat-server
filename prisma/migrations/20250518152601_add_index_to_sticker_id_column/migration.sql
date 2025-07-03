-- CreateIndex
CREATE INDEX "greeting_stickers_sticker_id_idx" ON "greeting_stickers"("sticker_id");

-- AddForeignKey
ALTER TABLE "direct_messages" ADD CONSTRAINT "direct_messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
