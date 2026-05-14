-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "elapsedSec" INTEGER NOT NULL DEFAULT 0
);

-- CreateTable
CREATE TABLE "Part1Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "questionIndex" INTEGER NOT NULL,
    "shuffledPoles" TEXT NOT NULL,
    "closestLetter" TEXT,
    "farthestLetter" TEXT,
    "closestPole" TEXT,
    "farthestPole" TEXT,
    CONSTRAINT "Part1Answer_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Part2Answer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL DEFAULT 0,
    "elapsedSec" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Part2Answer_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Score" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "candidateId" TEXT NOT NULL,
    "axisSelf" INTEGER NOT NULL,
    "axisSunao" INTEGER NOT NULL,
    "axisContrib" INTEGER NOT NULL,
    "axisPositive" INTEGER NOT NULL,
    "bitKey" TEXT NOT NULL,
    "typeName" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "matchStrength" TEXT NOT NULL,
    "absoluteNg" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "Score_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "Candidate_submittedAt_idx" ON "Candidate"("submittedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Part1Answer_candidateId_questionIndex_key" ON "Part1Answer"("candidateId", "questionIndex");

-- CreateIndex
CREATE UNIQUE INDEX "Part2Answer_candidateId_questionId_key" ON "Part2Answer"("candidateId", "questionId");

-- CreateIndex
CREATE UNIQUE INDEX "Score_candidateId_key" ON "Score"("candidateId");
