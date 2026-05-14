import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VERDICT_LABEL, MATCH_LABEL, type Verdict, type MatchStrength } from "@/lib/scoring";
import { CandidateTable, type CandidateRow } from "./CandidateTable";
import { CsvDownloadButton } from "./CsvDownloadButton";

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
    serialNo: c.serialNo,
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
        <span className="eyebrow">管理者</span>
        <h1 className="admin-detail-name" style={{ fontSize: "1.5rem", fontWeight: 500 }}>
          受験者ダッシュボード
        </h1>
        <p className="admin-detail-meta">
          {view === "active"
            ? "直近 200 件の受験者を表示。氏名をクリックで詳細ページへ。"
            : "アーカイブ済みの受験者一覧。"}
        </p>
        <div className="admin-toolbar">
          <Link className="admin-link" href="/admin/invites">受験 URL 発行</Link>
          <Link className="admin-link" href="/admin/settings">受験時間の管理</Link>
          <Link className="admin-link" href="/admin/reference">採点リファレンス</Link>
          <Link className="admin-link" href="/interviewer-guide">面接官ガイド</Link>
          <CsvDownloadButton count={candidates.length} />
        </div>
      </header>

      <CandidateTable rows={rows} view={view} />
    </main>
  );
}
