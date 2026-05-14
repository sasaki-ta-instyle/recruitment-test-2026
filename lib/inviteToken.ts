// 受験者ごとの個別 URL（トークン）解決ロジック。

import { prisma } from "@/lib/prisma";

export type InviteStatus =
  | "before" // openAt 前
  | "open"   // 開放中（受験可能）
  | "after"  // closeAt 以降
  | "used"   // 既に提出済み
  | "notfound"; // トークン不正

export type InviteSnapshot = {
  token: string;
  label: string;
  openAt: string | null;
  closeAt: string | null;
  message: string | null;
  status: InviteStatus;
  nowMs: number;
};

export async function getInviteSnapshot(token: string): Promise<InviteSnapshot | null> {
  if (!token || typeof token !== "string") return null;
  const row = await prisma.testInvite.findUnique({ where: { token } });
  if (!row) return null;

  const now = new Date();
  let status: InviteStatus;
  if (row.candidateId) {
    status = "used";
  } else if (row.openAt && now < row.openAt) {
    status = "before";
  } else if (row.closeAt && now >= row.closeAt) {
    status = "after";
  } else {
    status = "open";
  }

  return {
    token: row.token,
    label: row.label,
    openAt: row.openAt ? row.openAt.toISOString() : null,
    closeAt: row.closeAt ? row.closeAt.toISOString() : null,
    message: row.message,
    status,
    nowMs: now.getTime(),
  };
}

// ランダムなトークン文字列を生成（URL safe）。
export function generateToken(): string {
  const bytes = new Uint8Array(18);
  crypto.getRandomValues(bytes);
  // base64url
  let s = "";
  for (const b of bytes) s += b.toString(36).padStart(2, "0");
  return s.slice(0, 24);
}
