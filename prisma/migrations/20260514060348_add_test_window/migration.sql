-- CreateTable
CREATE TABLE "TestWindow" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'singleton',
    "openAt" DATETIME,
    "closeAt" DATETIME,
    "message" TEXT,
    "updatedAt" DATETIME NOT NULL
);
