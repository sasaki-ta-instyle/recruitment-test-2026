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

const PER_PAGE = 100;

type SearchParams = Promise<{ view?: string; page?: string }>;

export default async function AdminPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const view: "active" | "archived" = sp.view === "archived" ? "archived" : "active";
  const rawPage = parseInt(sp.page ?? "1", 10);
  const where = view === "archived" ? { archivedAt: { not: null } } : { archivedAt: null };

  const total = await prisma.candidate.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PER_PAGE));
  const page = Math.min(Math.max(1, isNaN(rawPage) ? 1 : rawPage), totalPages);

  const candidates = await prisma.candidate.findMany({
    where,
    include: { score: true },
    orderBy: { submittedAt: "desc" },
    skip: (page - 1) * PER_PAGE,
    take: PER_PAGE,
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

  const startIdx = total === 0 ? 0 : (page - 1) * PER_PAGE + 1;
  const endIdx = (page - 1) * PER_PAGE + rows.length;
  const baseQuery = view === "archived" ? "&view=archived" : "";

  return (
    <main className="wide-shell">
      <header className="admin-detail-header">
        <span className="eyebrow">管理者</span>
        <h1 className="admin-detail-name" style={{ fontSize: "1.5rem", fontWeight: 500 }}>
          受験者ダッシュボード
        </h1>
        <p className="admin-detail-meta">
          {view === "active"
            ? `受験者一覧（${total} 件）。氏名をクリックで詳細ページへ。`
            : `アーカイブ済みの受験者一覧（${total} 件）。`}
        </p>
        <div className="admin-toolbar">
          <Link className="admin-link" href="/admin/invites">受験 URL 発行</Link>
          <Link className="admin-link" href="/admin/settings">受験時間の管理</Link>
          <Link className="admin-link" href="/admin/reference">採点リファレンス</Link>
          <Link className="admin-link" href="/interviewer-guide">面接官ガイド</Link>
          <CsvDownloadButton count={total} />
        </div>
      </header>

      <CandidateTable rows={rows} view={view} />

      {totalPages > 1 && (
        <nav className="admin-pagination" aria-label="ページネーション">
          <span className="admin-pagination-meta">
            {startIdx}〜{endIdx} 件目 ／ 全 {total} 件
          </span>
          <div className="admin-pagination-controls">
            {page > 1 ? (
              <Link
                className="admin-link"
                href={`/admin?page=${page - 1}${baseQuery}`}
              >
                ← 前へ
              </Link>
            ) : (
              <span className="admin-link admin-link-disabled">← 前へ</span>
            )}
            <span className="admin-pagination-current">
              {page} / {totalPages}
            </span>
            {page < totalPages ? (
              <Link
                className="admin-link"
                href={`/admin?page=${page + 1}${baseQuery}`}
              >
                次へ →
              </Link>
            ) : (
              <span className="admin-link admin-link-disabled">次へ →</span>
            )}
          </div>
        </nav>
      )}
    </main>
  );
}
