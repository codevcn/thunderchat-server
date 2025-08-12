-- CreateEnum
CREATE TYPE "FriendRequestsStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MessageStatusEnum" AS ENUM ('SENT', 'SEEN');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'STICKER', 'MEDIA', 'PIN_NOTICE');

-- CreateEnum
CREATE TYPE "GroupChatRole" AS ENUM ('ADMIN', 'MEMBER');

-- CreateEnum
CREATE TYPE "AppRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "ReportCategory" AS ENUM ('SENSITIVE_CONTENT', 'BOTHER', 'FRAUD', 'OTHER');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "ViolationActionType" AS ENUM ('WARNING', 'TEMPORARY_BAN', 'PERMANENT_BAN');

-- CreateEnum
CREATE TYPE "MessageMediaType" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT');

-- CreateTable
CREATE TABLE "message_mappings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "mappings" TEXT,
    "key" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "AppRole" NOT NULL DEFAULT 'USER',

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "birthday" DATE,
    "about" TEXT,
    "avatar" TEXT,
    "user_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "direct_chats" (
    "id" SERIAL NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sent_message_id" INTEGER,

    CONSTRAINT "direct_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pinned_chats" (
    "id" SERIAL NOT NULL,
    "direct_chat_id" INTEGER NOT NULL,
    "pinned_by" INTEGER NOT NULL,
    "pinned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pinned_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" SERIAL NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" INTEGER NOT NULL,
    "recipient_id" INTEGER,
    "direct_chat_id" INTEGER,
    "group_chat_id" INTEGER,
    "type" "MessageType" NOT NULL DEFAULT 'TEXT',
    "status" "MessageStatusEnum" NOT NULL,
    "sticker_id" INTEGER,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reply_to_id" INTEGER,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "is_violated" BOOLEAN NOT NULL DEFAULT false,
    "media_id" INTEGER,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "message_medias" (
    "id" SERIAL NOT NULL,
    "url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "file_name" TEXT NOT NULL,
    "thumbnail_url" TEXT NOT NULL,
    "type" "MessageMediaType" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "message_medias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pinned_messages" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "direct_chat_id" INTEGER,
    "group_chat_id" INTEGER,
    "pinned_by" INTEGER NOT NULL,
    "pinned_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pinned_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friends" (
    "id" SERIAL NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "friend_requests" (
    "id" SERIAL NOT NULL,
    "sender_id" INTEGER NOT NULL,
    "recipient_id" INTEGER NOT NULL,
    "status" "FriendRequestsStatus" NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stickers" (
    "id" SERIAL NOT NULL,
    "sticker_name" VARCHAR(50) NOT NULL,
    "image_url" VARCHAR(255) NOT NULL,
    "category_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stickers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "greeting_stickers" (
    "id" SERIAL NOT NULL,
    "sticker_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "greeting_stickers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sticker_categories" (
    "id" SERIAL NOT NULL,
    "id_name" VARCHAR(255) NOT NULL,
    "thumbnail_url" VARCHAR(255) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sticker_categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_chats" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "creator_id" INTEGER NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_sent_message_id" INTEGER,

    CONSTRAINT "group_chats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_chat_members" (
    "id" SERIAL NOT NULL,
    "group_chat_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "joined_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" "GroupChatRole" NOT NULL DEFAULT 'MEMBER',

    CONSTRAINT "group_chat_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_settings" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "only_receive_friend_message" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "user_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violation_reports" (
    "id" SERIAL NOT NULL,
    "reporter_user_id" INTEGER NOT NULL,
    "reported_user_id" INTEGER NOT NULL,
    "report_category" "ReportCategory" NOT NULL,
    "reason_text" TEXT,
    "report_status" "ReportStatus" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violation_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_images" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "image_url" TEXT NOT NULL,

    CONSTRAINT "report_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "violation_actions" (
    "id" SERIAL NOT NULL,
    "action_reason" TEXT NOT NULL,
    "action_type" "ViolationActionType" NOT NULL,
    "banned_until" TIMESTAMP(3),
    "report_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violation_actions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reported_messages" (
    "id" SERIAL NOT NULL,
    "message_id" INTEGER NOT NULL,
    "message_type" "MessageType" NOT NULL,
    "message_content" TEXT NOT NULL,
    "report_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reported_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "message_mappings_user_id_key" ON "message_mappings"("user_id");

-- CreateIndex
CREATE INDEX "message_mappings_user_id_idx" ON "message_mappings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "direct_chats_last_sent_message_id_key" ON "direct_chats"("last_sent_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "direct_chats_creator_id_recipient_id_key" ON "direct_chats"("creator_id", "recipient_id");

-- CreateIndex
CREATE UNIQUE INDEX "messages_media_id_key" ON "messages"("media_id");

-- CreateIndex
CREATE UNIQUE INDEX "message_medias_url_key" ON "message_medias"("url");

-- CreateIndex
CREATE UNIQUE INDEX "stickers_image_url_key" ON "stickers"("image_url");

-- CreateIndex
CREATE UNIQUE INDEX "greeting_stickers_sticker_id_key" ON "greeting_stickers"("sticker_id");

-- CreateIndex
CREATE INDEX "greeting_stickers_sticker_id_idx" ON "greeting_stickers"("sticker_id");

-- CreateIndex
CREATE UNIQUE INDEX "sticker_categories_id_name_key" ON "sticker_categories"("id_name");

-- CreateIndex
CREATE UNIQUE INDEX "sticker_categories_thumbnail_url_key" ON "sticker_categories"("thumbnail_url");

-- CreateIndex
CREATE INDEX "sticker_categories_id_name_idx" ON "sticker_categories"("id_name");

-- CreateIndex
CREATE UNIQUE INDEX "group_chats_last_sent_message_id_key" ON "group_chats"("last_sent_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "group_chat_members_group_chat_id_user_id_key" ON "group_chat_members"("group_chat_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_settings_user_id_key" ON "user_settings"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "violation_actions_report_id_key" ON "violation_actions"("report_id");

-- AddForeignKey
ALTER TABLE "message_mappings" ADD CONSTRAINT "message_mappings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_chats" ADD CONSTRAINT "direct_chats_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_chats" ADD CONSTRAINT "direct_chats_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_chats" ADD CONSTRAINT "direct_chats_last_sent_message_id_fkey" FOREIGN KEY ("last_sent_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_chats" ADD CONSTRAINT "pinned_chats_direct_chat_id_fkey" FOREIGN KEY ("direct_chat_id") REFERENCES "direct_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_chats" ADD CONSTRAINT "pinned_chats_pinned_by_fkey" FOREIGN KEY ("pinned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_direct_chat_id_fkey" FOREIGN KEY ("direct_chat_id") REFERENCES "direct_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sticker_id_fkey" FOREIGN KEY ("sticker_id") REFERENCES "stickers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_reply_to_id_fkey" FOREIGN KEY ("reply_to_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "message_medias"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_group_chat_id_fkey" FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_direct_chat_id_fkey" FOREIGN KEY ("direct_chat_id") REFERENCES "direct_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_pinned_by_fkey" FOREIGN KEY ("pinned_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pinned_messages" ADD CONSTRAINT "pinned_messages_group_chat_id_fkey" FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friends" ADD CONSTRAINT "friends_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "friend_requests" ADD CONSTRAINT "friend_requests_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stickers" ADD CONSTRAINT "stickers_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "sticker_categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "greeting_stickers" ADD CONSTRAINT "greeting_stickers_sticker_id_fkey" FOREIGN KEY ("sticker_id") REFERENCES "stickers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_creator_id_fkey" FOREIGN KEY ("creator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chats" ADD CONSTRAINT "group_chats_last_sent_message_id_fkey" FOREIGN KEY ("last_sent_message_id") REFERENCES "messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_group_chat_id_fkey" FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_chat_members" ADD CONSTRAINT "group_chat_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_reports" ADD CONSTRAINT "violation_reports_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_reports" ADD CONSTRAINT "violation_reports_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_images" ADD CONSTRAINT "report_images_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "violation_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "violation_actions" ADD CONSTRAINT "violation_actions_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "violation_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reported_messages" ADD CONSTRAINT "reported_messages_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "messages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reported_messages" ADD CONSTRAINT "reported_messages_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "violation_reports"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
