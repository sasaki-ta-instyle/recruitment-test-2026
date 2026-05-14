"use server";

import { prisma } from "@/lib/prisma";

function parseLocalDateTime(value: string | null): Date | null {
  if (!value) return null;
  // <input type="datetime-local"> から来る "YYYY-MM-DDTHH:mm" をローカル時刻として解釈
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d;
}

export async function saveTestWindow(input: {
  openAt: string | null;
  closeAt: string | null;
  message: string | null;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const openAt = parseLocalDateTime(input.openAt);
    const closeAt = parseLocalDateTime(input.closeAt);

    if (openAt && closeAt && closeAt <= openAt) {
      return { ok: false, error: "終了時刻は開始時刻より後にしてください" };
    }

    const message = (input.message ?? "").slice(0, 1000) || null;

    await prisma.testWindow.upsert({
      where: { id: "singleton" },
      update: { openAt, closeAt, message },
      create: { id: "singleton", openAt, closeAt, message },
    });
    // / と /test と /admin/settings はすべて dynamic = "force-dynamic"
    // のため、明示的な revalidatePath は不要。client 側の router.refresh()
    // で /admin/settings 自身は再フェッチされる。
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function clearTestWindow(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await prisma.testWindow.upsert({
      where: { id: "singleton" },
      update: { openAt: null, closeAt: null, message: null },
      create: { id: "singleton", openAt: null, closeAt: null, message: null },
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
