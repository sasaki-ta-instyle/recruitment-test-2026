"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PART2 } from "@/lib/questions";

const ALLOWED = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
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
    return { ok: false, error: "score must be an integer 0–10 or null" };
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

const SCOPE_REGEX = /^(part1:(?:[0-9]|1[0-9])|part2:c(?:10|[1-9]))$/;

export async function saveQuestionNote(input: {
  candidateId: string;
  scope: string;
  body: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.candidateId || typeof input.candidateId !== "string") {
    return { ok: false, error: "invalid candidateId" };
  }
  if (!SCOPE_REGEX.test(input.scope)) {
    return { ok: false, error: "invalid scope" };
  }
  const body = (input.body ?? "").slice(0, 4000);
  if (body.length === 0) {
    // 空文字なら削除（既存があれば）
    await prisma.questionNote.deleteMany({
      where: { candidateId: input.candidateId, scope: input.scope },
    });
  } else {
    await prisma.questionNote.upsert({
      where: {
        candidateId_scope: {
          candidateId: input.candidateId,
          scope: input.scope,
        },
      },
      update: { body },
      create: {
        candidateId: input.candidateId,
        scope: input.scope,
        body,
      },
    });
  }
  return { ok: true };
}

export async function saveInterviewerName(input: {
  candidateId: string;
  name: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.candidateId || typeof input.candidateId !== "string") {
    return { ok: false, error: "invalid candidateId" };
  }
  const trimmed = (input.name ?? "").trim().slice(0, 200);
  await prisma.candidate.update({
    where: { id: input.candidateId },
    data: { interviewerName: trimmed.length === 0 ? null : trimmed },
  });
  return { ok: true };
}

export async function saveNotes(input: {
  candidateId: string;
  notes: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.candidateId || typeof input.candidateId !== "string") {
    return { ok: false, error: "invalid candidateId" };
  }
  const trimmed = (input.notes ?? "").slice(0, 20000);
  await prisma.candidate.update({
    where: { id: input.candidateId },
    data: { interviewerNotes: trimmed.length === 0 ? null : trimmed },
  });
  // 採点シートの一部なので path を invalidate するが、autosave 中の
  // 連続更新を避けるためここでは revalidate しない（保存だけ）。
  return { ok: true };
}
