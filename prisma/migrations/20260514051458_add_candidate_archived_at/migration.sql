-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN "archivedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Candidate_archivedAt_idx" ON "Candidate"("archivedAt");
