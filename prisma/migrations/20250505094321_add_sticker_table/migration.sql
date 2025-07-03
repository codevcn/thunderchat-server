-- CreateEnum
CREATE TYPE "StickerCategory" AS ENUM ('CAT', 'FACE');

-- CreateTable
CREATE TABLE "stickers" (
    "id" SERIAL NOT NULL,
    "category_id" INTEGER NOT NULL,
    "sticker_name" VARCHAR(50) NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "thumbnail_url" VARCHAR(255),
    "category" "StickerCategory" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stickers_pkey" PRIMARY KEY ("id")
);
