"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveScore } from "./actions";
import { aiScorePart2 } from "./aiScore";
import { QuestionNoteEditor } from "./QuestionNoteEditor";

type Part2Question = { id: string; theme: string; text: string };
type Part2AnswerLite = {
  questionId: string;
  bodyText: string;
  charCount: number;
  elapsedSec: number;
  score: number | null;
  aiScore: number | null;
  aiReason: string | null;
  aiScoredAt: string | null;
};

const SCORE_OPTIONS = [10, 7, 4, 0] as const;
const MAX_TOTAL = 100;

function fmtElapsed(sec: number): string {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export function Part2Section({
  candidateId,
  questions,
  answers,
  notesByScope,
}: {
  candidateId: string;
  questions: Part2Question[];
  answers: Part2AnswerLite[];
  notesByScope: Record<string, string>;
}) {
  const initial: Record<string, number | null> = {};
  for (const q of questions) {
    const a = answers.find((x) => x.questionId === q.id);
    initial[q.id] = a?.score ?? null;
  }
  const [scores, setScores] = useState<Record<string, number | null>>(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const router = useRouter();
  const [aiBusy, setAiBusy] = useState(false);
  const [aiMsg, setAiMsg] = useState<string | null>(null);

  const aiScoredCount = answers.filter((a) => a.aiScore !== null).length;
  const aiTotal = answers.reduce<number>(
    (sum, a) => sum + (typeof a.aiScore === "number" ? a.aiScore : 0),
    0,
  );

  function runAiScoring() {
    if (aiBusy) return;
    if (!window.confirm("Claude による Part 2 の AI 採点を実行します。Anthropic API を消費しますがよろしいですか？")) return;
    setAiBusy(true);
    setAiMsg("採点中... 最大 1 分ほどかかります");
    startTransition(async () => {
      const res = await aiScorePart2({ candidateId });
      if (res.ok) {
        setAiMsg(`完了：${res.scored} / ${res.total} 問の AI 採点を更新しました`);
        router.refresh();
        setTimeout(() => setAiMsg(null), 5000);
      } else {
        setAiMsg(`エラー：${res.error}`);
      }
      setAiBusy(false);
    });
  }

  const total = Object.values(scores).reduce<number>(
    (sum, v) => sum + (typeof v === "number" ? v : 0),
    0,
  );
  const answeredCount = Object.values(scores).filter((v) => v !== null).length;

  function handlePick(questionId: string, raw: number) {
    const next = scores[questionId] === raw ? null : raw;
    const prev = scores[questionId] ?? null;
    setScores((s) => ({ ...s, [questionId]: next }));
    setPending(questionId);
    setError(null);

    startTransition(async () => {
      const res = await saveScore({ candidateId, questionId, score: next });
      if (!res.ok) {
        setScores((s) => ({ ...s, [questionId]: prev }));
        setError(`保存失敗：${res.error}`);
      }
      setPending(null);
    });
  }

  return (
    <section className="admin-card">
      <div className="part2-header">
        <h2 className="part2-title">Part 2 記述・採点</h2>
        <div className="part2-totals-group">
          <div className="score-total" aria-live="polite">
            <span className="score-total-label">合計</span>
            <span className="score-total-value">
              {total}
              <span className="score-total-max"> / {MAX_TOTAL}</span>
            </span>
            <span className="score-total-meta">
              採点済 {answeredCount} / {questions.length}
            </span>
          </div>
          <div className="part2-ai-summary">
            <span className="score-total-label">AI 合計</span>
            <span className="score-total-value">
              {aiTotal}
              <span className="score-total-max"> / {MAX_TOTAL}</span>
            </span>
            <span className="score-total-meta">
              AI 採点済 {aiScoredCount} / {questions.length}
            </span>
          </div>
        </div>
        <button
          type="button"
          className="btn-secondary part2-ai-button no-print"
          onClick={runAiScoring}
          disabled={aiBusy}
        >
          {aiBusy ? "AI 採点中…" : "Claude で AI 採点"}
        </button>
      </div>

      {aiMsg && <div className="part2-ai-status no-print">{aiMsg}</div>}
      {error && <div className="part2-error">{error}</div>}

      {questions.map((q) => {
        const a = answers.find((p) => p.questionId === q.id);
        const current = scores[q.id];
        const isPending = pending === q.id;
        return (
          <div key={q.id} className="part2-row">
            <div className="part2-row-head">
              <span className="eyebrow">
                {q.id} ／ {q.theme}
              </span>
              <span className="part2-meta">
                {a ? `${a.charCount} 字 ・ ${fmtElapsed(a.elapsedSec)}` : "未回答"}
              </span>
            </div>
            <div className="part2-question">{q.text}</div>
            <div className="part2-body">{a?.bodyText ?? "（無回答）"}</div>

            <div className="score-picker" role="radiogroup" aria-label={`${q.id} 採点`}>
              {SCORE_OPTIONS.map((v) => {
                const selected = current === v;
                return (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    className={`score-button${selected ? " is-selected" : ""}`}
                    onClick={() => handlePick(q.id, v)}
                    disabled={isPending}
                  >
                    {v}
                  </button>
                );
              })}
              <span className="score-picker-state">
                {isPending ? "保存中…" : current === null ? "未採点" : `${current} 点`}
              </span>
            </div>

            {a?.aiScore != null && (
              <div className="part2-ai-result">
                <div className="part2-ai-head">
                  <span className="part2-ai-label">AI 採点</span>
                  <span className="part2-ai-score">{a.aiScore} 点</span>
                  {a.aiScoredAt && (
                    <span className="part2-ai-time">
                      （{new Date(a.aiScoredAt).toLocaleString("ja-JP")}）
                    </span>
                  )}
                </div>
                {a.aiReason && <p className="part2-ai-reason">{a.aiReason}</p>}
              </div>
            )}

            <div className="part2-note">
              <QuestionNoteEditor
                candidateId={candidateId}
                scope={`part2:${q.id}`}
                initial={notesByScope[q.id] ?? ""}
                placeholder="この設問への所感・追加で確認したい点（自動保存）"
                rows={2}
              />
            </div>
          </div>
        );
      })}
    </section>
  );
}
