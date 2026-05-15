import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PART1, PART2, type Part1Question } from "@/lib/questions";
import {
  AXIS_DISPLAY_ORDER,
  AXIS_LABELS,
  AXIS_NAMES,
  MATCH_LABEL,
  VERDICT_LABEL,
  getAxisTier,
  type MatchStrength,
  type Verdict,
} from "@/lib/scoring";
import {
  computeFinalVerdict,
  FINAL_VERDICT_DESC,
  FINAL_VERDICT_LABEL,
} from "@/lib/finalVerdict";
import { Part2Section } from "./Part2Section";
import { PrintButton } from "./PrintButton";
import { NotesEditor } from "./NotesEditor";
import { QuestionNoteEditor } from "./QuestionNoteEditor";

export const dynamic = "force-dynamic";

function fmtElapsed(sec: number): string {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

// PART1[i].options の定義順 = 固定 A/B/C/D。
// 受験者が見た shuffledPoles の letter ではなく、pole から逆引きして
// 「リファレンス上の固定 letter」を返す。
function fixedLetterByPole(q: Part1Question, pole: string | null): string | null {
  if (!pole) return null;
  const idx = q.options.findIndex((o) => o.pole === pole);
  return idx >= 0 ? String.fromCharCode(65 + idx) : null;
}

// time-out 等で pole が null だが letter（受験者が見た位置）と
// shuffledPoles が残っているケースのフォールバック。
function fixedLetterByShuffled(
  q: Part1Question,
  shuffledPolesJson: string,
  shuffledLetter: string | null,
): string | null {
  if (!shuffledLetter) return null;
  let arr: string[] = [];
  try {
    arr = JSON.parse(shuffledPolesJson) as string[];
  } catch {
    return null;
  }
  const idx = shuffledLetter.charCodeAt(0) - 65;
  const pole = arr[idx];
  return pole ? fixedLetterByPole(q, pole) : null;
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
      questionNotes: true,
      invite: { select: { id: true, serialNo: true, label: true } },
    },
  });
  if (!c) notFound();

  const noteByScope = new Map<string, string>();
  for (const n of c.questionNotes) {
    noteByScope.set(n.scope, n.body);
  }

  const axisNet: [number, number, number, number] = c.score
    ? [c.score.axisSelf, c.score.axisSunao, c.score.axisContrib, c.score.axisPositive]
    : [0, 0, 0, 0];
  const tiers = axisNet.map(getAxisTier);

  // Part 2 人手採点合計（採点済の問のスコアを集計）
  const part2HumanScore = c.part2Answers.reduce<number>(
    (sum, a) => sum + (typeof a.score === "number" ? a.score : 0),
    0,
  );
  const part2HumanAnswered = c.part2Answers.filter((a) => a.score !== null).length;
  // Part 2 AI 採点合計
  const part2AiScore = c.part2Answers.reduce<number>(
    (sum, a) => sum + (typeof a.aiScore === "number" ? a.aiScore : 0),
    0,
  );
  const part2AiAnswered = c.part2Answers.filter((a) => a.aiScore !== null).length;

  const finalResult = computeFinalVerdict({
    part1Verdict: (c.score?.verdict as Verdict) ?? null,
    absoluteNg: c.score?.absoluteNg ?? false,
    part2Score: part2HumanScore,
    part2Answered: part2HumanAnswered,
  });
  const aiFinalResult = computeFinalVerdict({
    part1Verdict: (c.score?.verdict as Verdict) ?? null,
    absoluteNg: c.score?.absoluteNg ?? false,
    part2Score: part2AiScore,
    part2Answered: part2AiAnswered,
  });
  const verdictsDiverge =
    finalResult.verdict !== null &&
    aiFinalResult.verdict !== null &&
    finalResult.verdict !== aiFinalResult.verdict;
  // 総合判定バッジに使う verdict 色マッピング
  const FINAL_BADGE_VERDICT: Record<string, Verdict> = {
    "accept-strong": "good-deep",
    accept: "good",
    "review-positive": "develop",
    review: "review",
    "review-negative": "review",
    reject: "ng",
  };

  return (
    <main className="wide-shell">
      <div className="no-print admin-detail-nav" style={{ marginBottom: 12 }}>
        <Link href="/admin">← 一覧に戻る</Link>
        <div className="admin-detail-nav-actions">
          <PrintButton />
          <Link className="admin-link" href="/admin/reference">採点リファレンス →</Link>
        </div>
      </div>

      <header className="admin-detail-header">
        <span className="eyebrow">
          受験者詳細
          {c.serialNo != null && (
            <> ／ <strong style={{ fontFamily: "var(--font-display)" }}>受験 #{String(c.serialNo).padStart(3, "0")}</strong></>
          )}
          {c.invite && (
            <>
              {" ／ "}
              <Link href="/admin/invites" style={{ color: "inherit" }}>
                発行 URL #{c.invite.serialNo != null ? String(c.invite.serialNo).padStart(3, "0") : "—"}（{c.invite.label}）
              </Link>
            </>
          )}
        </span>
        <h1 className="admin-detail-name">{c.name}</h1>
        <p className="admin-detail-meta">
          提出 {new Date(c.submittedAt).toLocaleString("ja-JP")} ・ 所要 {fmtElapsed(c.elapsedSec)}
        </p>
      </header>

      {c.score && (
        <div className="admin-card">
          <div className="admin-summary-row">
            <h2 className="admin-summary-type">{c.score.typeName}</h2>
            <span className={`verdict-badge verdict-${c.score.verdict}`} style={{ marginTop: 0 }}>
              {VERDICT_LABEL[c.score.verdict as Verdict] ?? c.score.verdict}
            </span>
            <span className="match-pill">{MATCH_LABEL[c.score.matchStrength as MatchStrength]?.label}</span>
            {c.score.absoluteNg && (
              <span className="verdict-badge verdict-ng">絶対 NG 該当</span>
            )}
          </div>
          <div className="admin-axes-grid">
            {AXIS_DISPLAY_ORDER.map((i) => {
              const net = axisNet[i];
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
        </div>
      )}

      <section className="admin-card final-verdict-card">
        <div className="final-verdict-header">
          <h2 className="admin-section-title" style={{ marginBottom: 0 }}>総合判定</h2>
          {verdictsDiverge && (
            <span className="final-verdict-divergence">人手 / AI で判定が分かれています</span>
          )}
        </div>

        <div className="final-verdict-inputs">
          <div className="final-verdict-cell">
            <span className="final-verdict-label">Part 1 タイプ</span>
            <span className="final-verdict-value">
              {c.score?.typeName ?? "—"}
              {c.score && (
                <span className={`verdict-badge verdict-${c.score.verdict}`} style={{ marginTop: 0, marginLeft: 8 }}>
                  {VERDICT_LABEL[c.score.verdict as Verdict]}
                </span>
              )}
            </span>
          </div>
          <div className="final-verdict-cell">
            <span className="final-verdict-label">Part 2 人手合計</span>
            <span className="final-verdict-value">
              <strong style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)" }}>
                {part2HumanScore}
              </strong>{" "}
              / 100
              <span className="final-verdict-meta" style={{ marginLeft: 8 }}>
                （採点済 {part2HumanAnswered} / 10）
              </span>
            </span>
          </div>
          <div className="final-verdict-cell">
            <span className="final-verdict-label">Part 2 AI 合計</span>
            <span className="final-verdict-value">
              <strong style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)" }}>
                {part2AiScore}
              </strong>{" "}
              / 100
              <span className="final-verdict-meta" style={{ marginLeft: 8 }}>
                （AI 採点済 {part2AiAnswered} / 10）
              </span>
            </span>
          </div>
        </div>

        <div className="final-verdict-grid">
          <div className="final-verdict-pane final-verdict-pane-human">
            <div className="final-verdict-pane-head">
              <span className="final-verdict-pane-label">人手ベース総合判定</span>
              {finalResult.verdict ? (
                <span
                  className={`verdict-badge verdict-${FINAL_BADGE_VERDICT[finalResult.verdict]}`}
                  style={{ marginTop: 0 }}
                >
                  {FINAL_VERDICT_LABEL[finalResult.verdict]}
                </span>
              ) : (
                <span className="match-pill">未確定</span>
              )}
            </div>
            <p className="final-verdict-reason">{finalResult.reason}</p>
            {finalResult.verdict && (
              <p className="final-verdict-desc">{FINAL_VERDICT_DESC[finalResult.verdict]}</p>
            )}
          </div>

          <div className="final-verdict-pane final-verdict-pane-ai">
            <div className="final-verdict-pane-head">
              <span className="final-verdict-pane-label">AI ベース総合判定</span>
              {aiFinalResult.verdict ? (
                <span
                  className={`verdict-badge verdict-${FINAL_BADGE_VERDICT[aiFinalResult.verdict]}`}
                  style={{ marginTop: 0 }}
                >
                  {FINAL_VERDICT_LABEL[aiFinalResult.verdict]}
                </span>
              ) : (
                <span className="match-pill">未確定</span>
              )}
            </div>
            <p className="final-verdict-reason">{aiFinalResult.reason}</p>
            {aiFinalResult.verdict && (
              <p className="final-verdict-desc">{FINAL_VERDICT_DESC[aiFinalResult.verdict]}</p>
            )}
          </div>
        </div>
      </section>

      <section className="admin-card">
        <h2 className="admin-section-title">Part 1 回答（イプサティブ評価）</h2>
        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>軸</th>
              <th>設問</th>
              <th>最も近い</th>
              <th>最も遠い</th>
              <th>コメント</th>
            </tr>
          </thead>
          <tbody>
            {PART1.map((q, i) => {
              const a = c.part1Answers.find((p) => p.questionIndex === i);
              const closeFixedLetter = a?.closestPole
                ? fixedLetterByPole(q, a.closestPole)
                : a
                  ? fixedLetterByShuffled(q, a.shuffledPoles, a.closestLetter ?? null)
                  : null;
              const farFixedLetter = a?.farthestPole
                ? fixedLetterByPole(q, a.farthestPole)
                : a
                  ? fixedLetterByShuffled(q, a.shuffledPoles, a.farthestLetter ?? null)
                  : null;
              const closeText = a?.closestPole
                ? q.options.find((o) => o.pole === a.closestPole)?.text ?? null
                : null;
              const farText = a?.farthestPole
                ? q.options.find((o) => o.pole === a.farthestPole)?.text ?? null
                : null;
              return (
                <tr key={q.id}>
                  <td style={{ fontFamily: "var(--font-display)", whiteSpace: "nowrap" }}>Q{String(i + 1).padStart(2, "0")}</td>
                  <td style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", whiteSpace: "nowrap" }}>{q.axes}</td>
                  <td style={{ fontSize: "0.8125rem", lineHeight: 1.6 }}>{q.text}</td>
                  <td>
                    <div className={`answer-cell ${a?.closestPole ? "is-close" : ""}`}>
                      {closeFixedLetter ? (
                        <span className="opt-letter opt-letter-close">{closeFixedLetter}</span>
                      ) : (
                        <span className="opt-letter opt-letter-empty">—</span>
                      )}
                      <div className="opt-body">
                        <div className="opt-pole">
                          {a?.closestPole ?? (a?.closestLetter ? "（未確定）" : "—")}
                        </div>
                        {closeText && <div className="opt-text">{closeText}</div>}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={`answer-cell ${a?.farthestPole ? "is-far" : ""}`}>
                      {farFixedLetter ? (
                        <span className="opt-letter opt-letter-far">{farFixedLetter}</span>
                      ) : (
                        <span className="opt-letter opt-letter-empty">—</span>
                      )}
                      <div className="opt-body">
                        <div className="opt-pole">
                          {a?.farthestPole ?? (a?.farthestLetter ? "（未確定）" : "—")}
                        </div>
                        {farText && <div className="opt-text">{farText}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="qn-cell">
                    <QuestionNoteEditor
                      candidateId={c.id}
                      scope={`part1:${i}`}
                      initial={noteByScope.get(`part1:${i}`) ?? ""}
                      rows={2}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <Part2Section
        candidateId={c.id}
        questions={PART2}
        answers={c.part2Answers.map((a) => ({
          questionId: a.questionId,
          bodyText: a.bodyText,
          charCount: a.charCount,
          elapsedSec: a.elapsedSec,
          score: a.score,
          aiScore: a.aiScore,
          aiReason: a.aiReason,
          aiScoredAt: a.aiScoredAt ? a.aiScoredAt.toISOString() : null,
        }))}
        notesByScope={Object.fromEntries(
          PART2.map((q) => [q.id, noteByScope.get(`part2:${q.id}`) ?? ""]),
        )}
      />

      <NotesEditor
        candidateId={c.id}
        initialNotes={c.interviewerNotes ?? ""}
        initialInterviewer={c.interviewerName ?? ""}
      />
    </main>
  );
}
