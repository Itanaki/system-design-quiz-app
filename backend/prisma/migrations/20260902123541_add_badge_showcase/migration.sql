-- AlterTable
ALTER TABLE "UserBadge" ADD COLUMN     "showcased" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "UserBadge_userId_showcased_idx" ON "UserBadge"("userId", "showcased");
