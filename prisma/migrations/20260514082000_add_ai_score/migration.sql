-- AlterTable: Claude による Part2 自動採点を保存するカラムを追加。
ALTER TABLE "Part2Answer" ADD COLUMN "aiScore" INTEGER;
ALTER TABLE "Part2Answer" ADD COLUMN "aiReason" TEXT;
ALTER TABLE "Part2Answer" ADD COLUMN "aiScoredAt" DATETIME;
