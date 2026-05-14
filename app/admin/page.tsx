import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VERDICT_LABEL, MATCH_LABEL, type Verdict, type MatchStrength } from "@/lib/scoring";
import { CandidateTable, type CandidateRow } from "./CandidateTable";
import { Logo } from "@/app/_components/Logo";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "受験者ダッシュボード | INSTYLE GROUP 採用カルチャーテスト",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<{ view?: string }>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const view: "active" | "archived" = sp.view === "archived" ? "archived" : "active";

  const candidates = await prisma.candidate.findMany({
    where: view === "archived" ? { archivedAt: { not: null } } : { archivedAt: null },
    include: { score: true },
    orderBy: { submittedAt: "desc" },
    take: 200,
  });

  const rows: CandidateRow[] = candidates.map((c) => ({
    id: c.id,
    name: c.name,
    submittedAt: c.submittedAt.toISOString(),
    elapsedSec: c.elapsedSec,
    archivedAt: c.archivedAt ? c.archivedAt.toISOString() : null,
    score: c.score
      ? {
          axisSelf: c.score.axisSelf,
          axisSunao: c.score.axisSunao,
          axisContrib: c.score.axisContrib,
          axisPositive: c.score.axisPositive,
          typeName: c.score.typeName,
          matchStrength: c.score.matchStrength,
          matchStrengthLabel:
            MATCH_LABEL[c.score.matchStrength as MatchStrength]?.label ?? c.score.matchStrength,
          verdict: c.score.verdict,
          verdictLabel: VERDICT_LABEL[c.score.verdict as Verdict] ?? c.score.verdict,
        }
      : null,
  }));

  return (
    <main className="wide-shell">
      <header className="admin-detail-header">
        <Logo height={14} />
        <h1 className="admin-detail-name">受験者ダッシュボード</h1>
        <p className="admin-detail-meta">
          {view === "active"
            ? "直近 200 件の受験者を表示。氏名をクリックで詳細ページへ。"
            : "アーカイブ済みの受験者一覧。"}
        </p>
        <div className="admin-toolbar">
          <Link className="admin-link" href="/admin/settings">受験設定</Link>
          <Link className="admin-link" href="/admin/reference">採点リファレンス</Link>
          <Link className="admin-link" href="/interviewer-guide">面接官ガイド</Link>
          <a className="admin-link" href="/api/admin/export.csv" download>
            CSV ダウンロード（{candidates.length} 件）
          </a>
        </div>
      </header>

      <CandidateTable rows={rows} view={view} />
    </main>
  );
}
