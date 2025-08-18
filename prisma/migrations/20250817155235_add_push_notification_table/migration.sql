-- CreateTable
CREATE TABLE "push_notification_subscriptions" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "expiration_time" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "push_notification_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "push_notification_subscriptions_endpoint_key" ON "push_notification_subscriptions"("endpoint");

-- CreateIndex
CREATE INDEX "push_notification_subscriptions_user_id_idx" ON "push_notification_subscriptions"("user_id");

-- AddForeignKey
ALTER TABLE "push_notification_subscriptions" ADD CONSTRAINT "push_notification_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
