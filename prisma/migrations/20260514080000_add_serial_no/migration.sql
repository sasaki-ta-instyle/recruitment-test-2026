-- AlterTable: add serialNo to Candidate and TestInvite, backfill by createdAt-ish order.

-- Candidate.serialNo
ALTER TABLE "Candidate" ADD COLUMN "serialNo" INTEGER;
UPDATE "Candidate" SET "serialNo" = (
  SELECT row_num FROM (
    SELECT "id" AS cid, ROW_NUMBER() OVER (ORDER BY "submittedAt" ASC) AS row_num FROM "Candidate"
  ) WHERE cid = "Candidate"."id"
);
CREATE UNIQUE INDEX "Candidate_serialNo_key" ON "Candidate"("serialNo");

-- TestInvite.serialNo
ALTER TABLE "TestInvite" ADD COLUMN "serialNo" INTEGER;
UPDATE "TestInvite" SET "serialNo" = (
  SELECT row_num FROM (
    SELECT "id" AS iid, ROW_NUMBER() OVER (ORDER BY "createdAt" ASC) AS row_num FROM "TestInvite"
  ) WHERE iid = "TestInvite"."id"
);
CREATE UNIQUE INDEX "TestInvite_serialNo_key" ON "TestInvite"("serialNo");
