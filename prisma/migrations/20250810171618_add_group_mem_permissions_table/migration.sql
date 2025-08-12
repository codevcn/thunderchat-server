-- CreateTable
CREATE TABLE "group_member_permissions" (
    "id" SERIAL NOT NULL,
    "group_chat_id" INTEGER NOT NULL,
    "send_message" BOOLEAN NOT NULL DEFAULT true,
    "pin_message" BOOLEAN NOT NULL DEFAULT true,
    "add_member" BOOLEAN NOT NULL DEFAULT true,
    "remove_member" BOOLEAN NOT NULL DEFAULT true,
    "update_info" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "group_member_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "group_member_permissions_group_chat_id_key" ON "group_member_permissions"("group_chat_id");

-- AddForeignKey
ALTER TABLE "group_member_permissions" ADD CONSTRAINT "group_member_permissions_group_chat_id_fkey" FOREIGN KEY ("group_chat_id") REFERENCES "group_chats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
