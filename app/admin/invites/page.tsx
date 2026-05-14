import Link from "next/link";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { InvitesClient, type InviteRow } from "./InvitesClient";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "受験 URL 発行 | INSTYLE GROUP 採用カルチャーテスト",
  robots: { index: false, follow: false },
};

export default async function AdminInvitesPage() {
  const invites = await prisma.testInvite.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { candidate: { select: { serialNo: true } } },
  });

  const rows: InviteRow[] = invites.map((i) => ({
    id: i.id,
    serialNo: i.serialNo,
    token: i.token,
    label: i.label,
    openAt: i.openAt ? i.openAt.toISOString() : null,
    closeAt: i.closeAt ? i.closeAt.toISOString() : null,
    message: i.message,
    candidateId: i.candidateId,
    candidateSerialNo: i.candidate?.serialNo ?? null,
    createdAt: i.createdAt.toISOString(),
  }));

  // 受験者用 URL を組み立てる。リバースプロキシ越しでも正しい origin を引くため
  // x-forwarded-* ヘッダを優先。
  const h = await headers();
  const proto = h.get("x-forwarded-proto") ?? "https";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "app.instyle.group";
  const baseUrl = `${proto}://${host}/recruitment-test-2026`;

  return (
    <main className="wide-shell">
      <div className="no-print admin-detail-nav" style={{ marginBottom: 12 }}>
        <Link href="/admin">← 受験者ダッシュボード</Link>
      </div>

      <header className="admin-detail-header">
        <span className="eyebrow">受験 URL 発行</span>
        <h1 className="admin-detail-name">受験者ごとの個別 URL</h1>
        <p className="admin-detail-meta">
          受験者ごとに専用の URL とテスト時間窓を発行します。トップページの全体設定とは独立して動作し、
          異なる時間帯の複数受験を同時に運用できます。提出後は同じ URL を再利用できません
          （必要に応じて「URL 再発行」で新しいトークンに切り替え）。
        </p>
      </header>

      <InvitesClient rows={rows} baseUrl={baseUrl} nowMs={Date.now()} />
    </main>
  );
}
