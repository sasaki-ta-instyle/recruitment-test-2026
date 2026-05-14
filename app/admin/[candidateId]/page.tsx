import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PART1, PART2 } from "@/lib/questions";
import {
  AXIS_LABELS,
  AXIS_NAMES,
  MATCH_LABEL,
  VERDICT_LABEL,
  getAxisTier,
  type MatchStrength,
  type Verdict,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";

function fmtElapsed(sec: number): string {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ candidateId: string }>;
}) {
  const { candidateId } = await params;
  const c = await prisma.candidate.findUnique({
    where: { id: candidateId },
    include: {
      score: true,
      part1Answers: { orderBy: { questionIndex: "asc" } },
      part2Answers: true,
    },
  });
  if (!c) notFound();

  const axisNet: [number, number, number, number] = c.score
    ? [c.score.axisSelf, c.score.axisSunao, c.score.axisContrib, c.score.axisPositive]
    : [0, 0, 0, 0];
  const tiers = axisNet.map(getAxisTier);

  return (
    <main className="wide-shell">
      <p className="no-print" style={{ marginBottom: 12 }}>
        <Link href="/admin">← 一覧に戻る</Link>
      </p>

      <header style={{ marginBottom: 24 }}>
        <span className="eyebrow">受験者詳細</span>
        <h1 style={{ fontSize: "1.5rem", marginTop: 6 }}>{c.name}</h1>
        <p style={{ fontSize: "0.875rem", color: "var(--color-text-muted)", marginTop: 6 }}>
          提出 {new Date(c.submittedAt).toLocaleString("ja-JP")} ・ 所要 {fmtElapsed(c.elapsedSec)}
        </p>
      </header>

      {c.score && (
        <div className="admin-card">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: "1.25rem" }}>{c.score.typeName}</h2>
            <span className={`verdict-badge verdict-${c.score.verdict}`} style={{ marginTop: 0 }}>
              {VERDICT_LABEL[c.score.verdict as Verdict] ?? c.score.verdict}
            </span>
            <span className="match-pill">{MATCH_LABEL[c.score.matchStrength as MatchStrength]?.label}</span>
            {c.score.absoluteNg && (
              <span className="verdict-badge verdict-ng">絶対 NG 該当</span>
            )}
          </div>
          {axisNet.map((net, i) => {
            const tier = tiers[i];
            const pct = Math.max(5, Math.min(95, Math.round(((net + 20) / 40) * 100)));
            const fillLeft = net >= 0 ? 50 : pct;
            const fillWidth = Math.abs(pct - 50);
            return (
              <div className={`axis-row ${tier.tier}`} key={i}>
                <div className="axis-meta">
                  <span>{AXIS_NAMES[i]}</span>
                  <span className="axis-net">{(net > 0 ? "+" : "") + net}（{tier.label}）</span>
                </div>
                <div className="axis-bar-track">
                  <div className="axis-bar-fill" style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }} />
                </div>
                <div className="axis-poles">
                  <span>{AXIS_LABELS[i][0]}</span>
                  <span>{AXIS_LABELS[i][1]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <section className="admin-card">
        <h2 style={{ fontSize: "1.125rem", marginBottom: 12 }}>Part 1 回答（ipsative）</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>軸</th>
              <th>設問</th>
              <th>最も近い</th>
              <th>最も遠い</th>
            </tr>
          </thead>
          <tbody>
            {PART1.map((q, i) => {
              const a = c.part1Answers.find((p) => p.questionIndex === i);
              return (
                <tr key={q.id}>
                  <td style={{ fontFamily: "var(--font-display)" }}>Q{String(i + 1).padStart(2, "0")}</td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{q.axes}</td>
                  <td style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>{q.text}</td>
                  <td style={{ fontSize: "0.8125rem", color: a?.closestPole ? "var(--color-info)" : "var(--color-text-muted)" }}>
                    {a?.closestPole ?? (a?.closestLetter ? `${a.closestLetter}（未確定）` : "—")}
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: a?.farthestPole ? "var(--color-error)" : "var(--color-text-muted)" }}>
                    {a?.farthestPole ?? (a?.farthestLetter ? `${a.farthestLetter}（未確定）` : "—")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2 style={{ fontSize: "1.125rem", marginBottom: 12 }}>Part 2 記述</h2>
        {PART2.map((q) => {
          const a = c.part2Answers.find((p) => p.questionId === q.id);
          return (
            <div key={q.id} style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--color-surface-2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                <span className="eyebrow">{q.id} ／ {q.theme}</span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  {a ? `${a.charCount} 字 ・ ${fmtElapsed(a.elapsedSec)}` : "未回答"}
                </span>
              </div>
              <div style={{ fontSize: "0.9375rem", marginBottom: 8 }}>{q.text}</div>
              <div style={{ fontSize: "0.875rem", lineHeight: 1.85, whiteSpace: "pre-wrap", background: "var(--color-bg)", padding: "12px 14px", borderRadius: "var(--r)" }}>
                {a?.bodyText ?? "（無回答）"}
              </div>
            </div>
          );
        })}
      </section>
    </main>
  );
}
