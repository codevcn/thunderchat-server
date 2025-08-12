/*
  Warnings:

  - The values [CANCELLED] on the enum `JoinRequestStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "JoinRequestStatus_new" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
ALTER TABLE "group_join_requests" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "group_join_requests" ALTER COLUMN "status" TYPE "JoinRequestStatus_new" USING ("status"::text::"JoinRequestStatus_new");
ALTER TYPE "JoinRequestStatus" RENAME TO "JoinRequestStatus_old";
ALTER TYPE "JoinRequestStatus_new" RENAME TO "JoinRequestStatus";
DROP TYPE "JoinRequestStatus_old";
ALTER TABLE "group_join_requests" ALTER COLUMN "status" SET DEFAULT 'PENDING';
COMMIT;
