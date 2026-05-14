-- CreateTable
CREATE TABLE "TestInvite" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "openAt" DATETIME,
    "closeAt" DATETIME,
    "message" TEXT,
    "candidateId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TestInvite_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "TestInvite_token_key" ON "TestInvite"("token");

-- CreateIndex
CREATE UNIQUE INDEX "TestInvite_candidateId_key" ON "TestInvite"("candidateId");

-- CreateIndex
CREATE INDEX "TestInvite_token_idx" ON "TestInvite"("token");

-- CreateIndex
CREATE INDEX "TestInvite_createdAt_idx" ON "TestInvite"("createdAt");
