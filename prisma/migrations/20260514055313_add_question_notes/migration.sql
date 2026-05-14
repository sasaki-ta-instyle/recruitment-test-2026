-- CreateTable
CREATE TABLE "QuestionNote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "QuestionNote_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "QuestionNote_candidateId_idx" ON "QuestionNote"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionNote_candidateId_scope_key" ON "QuestionNote"("candidateId", "scope");
