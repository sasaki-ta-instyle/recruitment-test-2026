"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PART2 } from "@/lib/questions";

const ALLOWED = new Set([0, 4, 7, 10]);
const VALID_QUESTION_IDS = new Set(PART2.map((q) => q.id));

export async function saveScore(input: {
  candidateId: string;
  questionId: string;
  score: number | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.candidateId || typeof input.candidateId !== "string") {
    return { ok: false, error: "invalid candidateId" };
  }
  if (!VALID_QUESTION_IDS.has(input.questionId)) {
    return { ok: false, error: "invalid questionId" };
  }
  if (input.score !== null && !ALLOWED.has(input.score)) {
    return { ok: false, error: "score must be one of 0/4/7/10 or null" };
  }

  await prisma.part2Answer.update({
    where: {
      candidateId_questionId: {
        candidateId: input.candidateId,
        questionId: input.questionId,
      },
    },
    data: { score: input.score },
  });

  revalidatePath(`/admin/${input.candidateId}`);
  return { ok: true };
}
