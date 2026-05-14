// テスト受験時間窓のユーティリティ。
// シングルトンの TestWindow 行を読み、現在の状態を判定する。

import { prisma } from "@/lib/prisma";

export type WindowStatus =
  | "before"   // openAt 前（カウントダウン表示）
  | "open"     // openAt〜closeAt の間（受験可能）
  | "after"    // closeAt 以降（終了）
  | "closed";  // openAt / closeAt 未設定（常時クローズ）

export type TestWindowSnapshot = {
  openAt: string | null;    // ISO
  closeAt: string | null;   // ISO
  message: string | null;
  status: WindowStatus;
  nowMs: number;            // サーバ側現在時刻（クライアントのカウントダウン基準）
};

export async function getTestWindowSnapshot(): Promise<TestWindowSnapshot> {
  const row = await prisma.testWindow.findUnique({ where: { id: "singleton" } });
  const now = new Date();
  const nowMs = now.getTime();
  const openAt = row?.openAt ?? null;
  const closeAt = row?.closeAt ?? null;
  const message = row?.message ?? null;

  let status: WindowStatus = "closed";
  if (openAt && closeAt) {
    if (now < openAt) status = "before";
    else if (now < closeAt) status = "open";
    else status = "after";
  } else if (openAt && !closeAt) {
    status = now >= openAt ? "open" : "before";
  } else if (!openAt && closeAt) {
    status = now < closeAt ? "open" : "after";
  } else {
    status = "closed";
  }

  return {
    openAt: openAt ? openAt.toISOString() : null,
    closeAt: closeAt ? closeAt.toISOString() : null,
    message,
    status,
    nowMs,
  };
}

export function isWindowOpen(s: TestWindowSnapshot): boolean {
  return s.status === "open";
}
