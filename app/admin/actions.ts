"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

type Result = { ok: true; count: number } | { ok: false; error: string };

function sanitizeIds(input: string[]): string[] {
  if (!Array.isArray(input)) return [];
  return input.filter((v) => typeof v === "string" && v.length > 0 && v.length < 64);
}

export async function archiveCandidates(ids: string[]): Promise<Result> {
  const safe = sanitizeIds(ids);
  if (safe.length === 0) return { ok: false, error: "no ids" };
  const res = await prisma.candidate.updateMany({
    where: { id: { in: safe } },
    data: { archivedAt: new Date() },
  });
  revalidatePath("/admin");
  return { ok: true, count: res.count };
}

export async function unarchiveCandidates(ids: string[]): Promise<Result> {
  const safe = sanitizeIds(ids);
  if (safe.length === 0) return { ok: false, error: "no ids" };
  const res = await prisma.candidate.updateMany({
    where: { id: { in: safe } },
    data: { archivedAt: null },
  });
  revalidatePath("/admin");
  return { ok: true, count: res.count };
}

export async function deleteCandidates(ids: string[]): Promise<Result> {
  const safe = sanitizeIds(ids);
  if (safe.length === 0) return { ok: false, error: "no ids" };
  // Part1Answer / Part2Answer / Score は schema.prisma で onDelete: Cascade
  const res = await prisma.candidate.deleteMany({
    where: { id: { in: safe } },
  });
  revalidatePath("/admin");
  return { ok: true, count: res.count };
}
