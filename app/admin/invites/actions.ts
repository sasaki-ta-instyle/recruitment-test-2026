"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/inviteToken";

function parseLocal(v: string | null): Date | null {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

export async function createInvite(input: {
  label: string;
  openAt: string | null;
  closeAt: string | null;
  message: string | null;
}): Promise<{ ok: true; id: string; token: string } | { ok: false; error: string }> {
  try {
    const label = (input.label ?? "").trim().slice(0, 200);
    if (!label) return { ok: false, error: "受験者名（label）が必要です" };
    const openAt = parseLocal(input.openAt);
    const closeAt = parseLocal(input.closeAt);
    if (openAt && closeAt && closeAt <= openAt) {
      return { ok: false, error: "終了時刻は開始時刻より後にしてください" };
    }
    const message = (input.message ?? "").slice(0, 1000) || null;

    const token = generateToken();
    const row = await prisma.testInvite.create({
      data: { token, label, openAt, closeAt, message },
    });
    revalidatePath("/admin/invites");
    return { ok: true, id: row.id, token: row.token };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function deleteInvite(id: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!id || typeof id !== "string") return { ok: false, error: "invalid id" };
    await prisma.testInvite.delete({ where: { id } });
    revalidatePath("/admin/invites");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function regenerateInviteToken(
  id: string,
): Promise<{ ok: true; token: string } | { ok: false; error: string }> {
  try {
    if (!id || typeof id !== "string") return { ok: false, error: "invalid id" };
    const token = generateToken();
    const row = await prisma.testInvite.update({
      where: { id },
      data: { token, candidateId: null },
    });
    revalidatePath("/admin/invites");
    return { ok: true, token: row.token };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function updateInvite(input: {
  id: string;
  label?: string;
  openAt?: string | null;
  closeAt?: string | null;
  message?: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    if (!input.id) return { ok: false, error: "invalid id" };
    const data: {
      label?: string;
      openAt?: Date | null;
      closeAt?: Date | null;
      message?: string | null;
    } = {};
    if (input.label !== undefined) {
      const l = input.label.trim().slice(0, 200);
      if (!l) return { ok: false, error: "label は空にできません" };
      data.label = l;
    }
    if (input.openAt !== undefined) data.openAt = parseLocal(input.openAt);
    if (input.closeAt !== undefined) data.closeAt = parseLocal(input.closeAt);
    if (input.message !== undefined) {
      data.message = (input.message ?? "").slice(0, 1000) || null;
    }
    if (data.openAt && data.closeAt && data.closeAt <= data.openAt) {
      return { ok: false, error: "終了時刻は開始時刻より後にしてください" };
    }
    await prisma.testInvite.update({ where: { id: input.id }, data });
    revalidatePath("/admin/invites");
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
