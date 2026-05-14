import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { VERDICT_LABEL, MATCH_LABEL, type Verdict, type MatchStrength } from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "受験者ダッシュボード | INSTYLE GROUP 採用カルチャーテスト",
  robots: { index: false, follow: false },
};

function fmtDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

function fmtElapsed(sec: number): string {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default async function AdminPage() {
  const candidates = await prisma.candidate.findMany({
    include: { score: true },
    orderBy: { submittedAt: "desc" },
    take: 200,
  });

  return (
    <main className="wide-shell">
      <header style={{ marginBottom: 24 }}>
        <span className="eyebrow">INSTYLE GROUP</span>
        <h1 style={{ fontSize: "1.5rem", marginTop: 8 }}>受験者ダッシュボード</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: 8 }}>
          直近 200 件の受験者を表示。氏名をクリックで詳細ページへ。
        </p>
      </header>

      <div className="admin-card">
        {candidates.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>まだ受験記録がありません。</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>受験日時</th>
                <th>氏名</th>
                <th>4 軸スコア</th>
                <th>タイプ</th>
                <th>マッチ</th>
                <th>判定</th>
                <th>所要</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => {
                const s = c.score;
                return (
                  <tr key={c.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {fmtDate(c.submittedAt)}
                    </td>
                    <td>
                      <Link href={`/admin/${c.id}`}>{c.name}</Link>
                    </td>
                    <td style={{ fontFamily: "var(--font-display)", fontSize: "0.8125rem" }}>
                      {s
                        ? `${signed(s.axisSelf)}/${signed(s.axisSunao)}/${signed(s.axisContrib)}/${signed(s.axisPositive)}`
                        : "—"}
                    </td>
                    <td>{s?.typeName ?? "—"}</td>
                    <td>{s ? MATCH_LABEL[s.matchStrength as MatchStrength]?.label ?? s.matchStrength : "—"}</td>
                    <td>
                      {s ? (
                        <span className={`verdict-badge verdict-${s.verdict}`} style={{ marginTop: 0 }}>
                          {VERDICT_LABEL[s.verdict as Verdict] ?? s.verdict}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {fmtElapsed(c.elapsedSec)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}

function signed(n: number): string {
  return (n > 0 ? "+" : "") + n;
}
