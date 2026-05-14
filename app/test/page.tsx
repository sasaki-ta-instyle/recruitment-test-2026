"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PART1, PART2, type Pole } from "@/lib/questions";
import {
  AXIS_LABELS,
  AXIS_NAMES,
  VERDICT_LABEL,
  emptyPoleScores,
  getAxisTier,
  judge,
  MATCH_LABEL,
  scoreAxes,
  type PoleScores,
} from "@/lib/scoring";

type Screen = "intro" | "p1" | "transition" | "p2" | "result";

type Part1Answer = { close: string | null; far: string | null };

type ShuffledOption = { letter: string; text: string; pole: Pole };

const TIMER_SEC = 45;
const TOTAL_SEC = 60 * 60;

function fmtMS(sec: number): string {
  sec = Math.max(0, Math.floor(sec));
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function fisherYates<T>(arr: T[]): T[] {
  const next = [...arr];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export default function TestPage() {
  const [screen, setScreen] = useState<Screen>("intro");
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState(false);

  // Part 1 state
  const [shuffled, setShuffled] = useState<ShuffledOption[][]>([]);
  const [p1Answers, setP1Answers] = useState<Part1Answer[]>(
    () => PART1.map(() => ({ close: null, far: null }))
  );
  const [p1Locked, setP1Locked] = useState<boolean[]>(() => PART1.map(() => false));
  const [p1Idx, setP1Idx] = useState(0);
  const [poleScores, setPoleScores] = useState<PoleScores>(() => emptyPoleScores());

  // Per-question timer (Part 1 only)
  const [perQRemaining, setPerQRemaining] = useState(TIMER_SEC);
  const perQTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Overall timer
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const overallTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Part 2 state
  const [p2Idx, setP2Idx] = useState(0);
  const [p2Answers, setP2Answers] = useState<string[]>(() => PART2.map(() => ""));
  const [p2TimeSpent, setP2TimeSpent] = useState<number[]>(() => PART2.map(() => 0));
  const p2EnterAtRef = useRef<number | null>(null);
  const p2PrevIdxRef = useRef<number | null>(null);

  // Submit state
  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);

  // Stop timers on unmount
  useEffect(() => {
    return () => {
      if (perQTimerRef.current) clearInterval(perQTimerRef.current);
      if (overallTimerRef.current) clearInterval(overallTimerRef.current);
    };
  }, []);

  // ── Helpers ─────────────────────────────────────────────
  const stopPerQTimer = () => {
    if (perQTimerRef.current) {
      clearInterval(perQTimerRef.current);
      perQTimerRef.current = null;
    }
  };

  const stopOverallTimer = () => {
    if (overallTimerRef.current) {
      clearInterval(overallTimerRef.current);
      overallTimerRef.current = null;
    }
  };

  const commitTime = useCallback(() => {
    if (p2PrevIdxRef.current !== null && p2EnterAtRef.current !== null) {
      const idx = p2PrevIdxRef.current;
      const delta = Math.floor((Date.now() - p2EnterAtRef.current) / 1000);
      setP2TimeSpent((arr) => {
        const next = [...arr];
        next[idx] = (next[idx] ?? 0) + delta;
        return next;
      });
    }
  }, []);

  // ── Start test ──────────────────────────────────────────
  const startTest = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setNameErr(true);
      return;
    }
    setNameErr(false);

    // Shuffle options per question
    const shuf: ShuffledOption[][] = PART1.map((q) => {
      const arr = fisherYates([...q.options]);
      return arr.map((opt, i) => ({
        letter: String.fromCharCode(65 + i),
        text: opt.text,
        pole: opt.pole,
      }));
    });
    setShuffled(shuf);

    // Reset state
    setP1Answers(PART1.map(() => ({ close: null, far: null })));
    setP1Locked(PART1.map(() => false));
    setP1Idx(0);
    setPoleScores(emptyPoleScores());
    setP2Idx(0);
    setP2Answers(PART2.map(() => ""));
    setP2TimeSpent(PART2.map(() => 0));

    startTimeRef.current = Date.now();
    setElapsed(0);
    stopOverallTimer();
    overallTimerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);

    setScreen("p1");
  };

  // ── Per-question timer for Part 1 ───────────────────────
  useEffect(() => {
    if (screen !== "p1") {
      stopPerQTimer();
      return;
    }
    if (p1Locked[p1Idx]) {
      stopPerQTimer();
      return;
    }

    setPerQRemaining(TIMER_SEC);
    stopPerQTimer();

    perQTimerRef.current = setInterval(() => {
      setPerQRemaining((r) => {
        if (r <= 1) {
          // Time-up: lock without scoring
          stopPerQTimer();
          setP1Locked((locked) => {
            const next = [...locked];
            next[p1Idx] = true;
            return next;
          });
          // advance after a short delay
          setTimeout(() => {
            advanceP1();
          }, 700);
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => stopPerQTimer();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, p1Idx, p1Locked]);

  // ── Part 1: pick handlers ───────────────────────────────
  const pickClose = (letter: string) => {
    if (p1Locked[p1Idx]) return;
    setP1Answers((arr) => {
      const next = [...arr];
      const cur = { ...(next[p1Idx] ?? { close: null, far: null }) };
      if (cur.close === letter) {
        cur.close = null;
      } else {
        cur.close = letter;
        if (cur.far === letter) cur.far = null;
      }
      next[p1Idx] = cur;
      return next;
    });
  };

  const pickFar = (letter: string) => {
    if (p1Locked[p1Idx]) return;
    setP1Answers((arr) => {
      const next = [...arr];
      const cur = { ...(next[p1Idx] ?? { close: null, far: null }) };
      if (cur.far === letter) {
        cur.far = null;
      } else {
        cur.far = letter;
        if (cur.close === letter) cur.close = null;
      }
      next[p1Idx] = cur;
      return next;
    });
  };

  const currentAnswer = p1Answers[p1Idx] ?? { close: null, far: null };
  const canAdvanceP1 =
    p1Locked[p1Idx] ||
    (!!currentAnswer.close &&
      !!currentAnswer.far &&
      currentAnswer.close !== currentAnswer.far);

  const commitP1Score = (idx: number) => {
    if (p1Locked[idx]) return;
    const a = p1Answers[idx];
    const opts = shuffled[idx];
    if (!a || !a.close || !a.far || !opts) return;
    const closeOpt = opts.find((o) => o.letter === a.close);
    const farOpt = opts.find((o) => o.letter === a.far);
    setPoleScores((ps) => {
      const next: PoleScores = { ...ps };
      if (closeOpt) next[closeOpt.pole] = (next[closeOpt.pole] ?? 0) + 1;
      if (farOpt) next[farOpt.pole] = (next[farOpt.pole] ?? 0) - 1;
      return next;
    });
    setP1Locked((locked) => {
      const next = [...locked];
      next[idx] = true;
      return next;
    });
  };

  const advanceP1 = () => {
    if (p1Idx < PART1.length - 1) {
      setP1Idx((i) => i + 1);
      window.scrollTo(0, 0);
    } else {
      stopPerQTimer();
      setScreen("transition");
    }
  };

  const onP1Next = () => {
    stopPerQTimer();
    commitP1Score(p1Idx);
    advanceP1();
  };

  // ── Part 2 navigation ───────────────────────────────────
  const enterP2 = (idx: number) => {
    commitTime();
    p2PrevIdxRef.current = idx;
    p2EnterAtRef.current = Date.now();
    setP2Idx(idx);
  };

  const startP2 = () => {
    enterP2(0);
    setScreen("p2");
  };

  const onP2Input = (val: string) => {
    setP2Answers((arr) => {
      const next = [...arr];
      next[p2Idx] = val;
      return next;
    });
  };

  const onP2Next = () => {
    if (p2Idx < PART2.length - 1) {
      enterP2(p2Idx + 1);
      window.scrollTo(0, 0);
    } else {
      void finishTest();
    }
  };

  const onP2Prev = () => {
    if (p2Idx > 0) {
      enterP2(p2Idx - 1);
      window.scrollTo(0, 0);
    }
  };

  // ── Finish + submit ─────────────────────────────────────
  const finishTest = async () => {
    commitTime();
    p2PrevIdxRef.current = null;
    p2EnterAtRef.current = null;
    stopPerQTimer();
    stopOverallTimer();
    setSubmitting(true);
    setSubmitErr(null);

    const finalElapsed = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : elapsed;

    try {
      const payload = {
        name: name.trim(),
        elapsedSec: finalElapsed,
        part1: PART1.map((q, i) => ({
          questionIndex: i,
          shuffledPoles: (shuffled[i] ?? []).map((o) => o.pole),
          closestLetter: p1Answers[i]?.close ?? null,
          farthestLetter: p1Answers[i]?.far ?? null,
          closestPole: p1Locked[i]
            ? shuffled[i]?.find((o) => o.letter === p1Answers[i]?.close)?.pole ?? null
            : null,
          farthestPole: p1Locked[i]
            ? shuffled[i]?.find((o) => o.letter === p1Answers[i]?.far)?.pole ?? null
            : null,
        })),
        part2: PART2.map((q, i) => ({
          questionId: q.id,
          bodyText: p2Answers[i] ?? "",
          charCount: (p2Answers[i] ?? "").length,
          elapsedSec: p2TimeSpent[i] ?? 0,
        })),
        poleScores,
      };

      const res = await fetch("/recruitment-test-2026/api/submit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(`Submit failed: ${res.status} ${t}`);
      }
      const data = (await res.json()) as { id: string };
      setCandidateId(data.id);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setSubmitErr(msg);
    } finally {
      setSubmitting(false);
      setScreen("result");
    }
  };

  // ── Result derived values ───────────────────────────────
  const axisNet = useMemo(
    () => scoreAxes(poleScores) as [number, number, number, number],
    [poleScores]
  );
  const tiers = useMemo(() => axisNet.map(getAxisTier), [axisNet]);
  const verdict = useMemo(() => judge(axisNet), [axisNet]);

  // ── Render: Intro ───────────────────────────────────────
  if (screen === "intro") {
    return (
      <main className="app-shell">
        <div className="landing">
          <span className="eyebrow">INSTYLE GROUP</span>
          <h1 className="landing-title">採用カルチャーテスト 2026</h1>
          <p className="landing-sub">
            Part 1（選択 20 問）と Part 2（記述 10 問）の 2 部構成、合計 60 分です。
            Part 1 は各問 45 秒。Part 2 は時間配分自由。
            <br />
            模範解答を探さず、ご自身の自然な感覚で答えてください。
          </p>
          <div style={{ maxWidth: 320, margin: "0 auto" }}>
            <input
              type="text"
              className="name-input"
              placeholder="お名前（フルネーム）"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameErr(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) startTest();
              }}
            />
            <div className={`name-error ${nameErr ? "show" : ""}`}>
              お名前を入力してください。
            </div>
            <button
              className="btn-primary"
              disabled={!name.trim()}
              onClick={startTest}
              style={{ width: "100%" }}
            >
              テストを開始する
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Render: Part 1 ──────────────────────────────────────
  if (screen === "p1") {
    const q = PART1[p1Idx];
    const opts = shuffled[p1Idx] ?? [];
    const pct = ((p1Idx + 1) / PART1.length) * 50;
    const elapsedPct = Math.min(100, (elapsed / TOTAL_SEC) * 100);
    const timerPct = (perQRemaining / TIMER_SEC) * 100;

    return (
      <main className="app-shell">
        <div className="part-header">
          <span className="part-logo">INSTYLE GROUP</span>
          <span className="part-info">
            Part 1 — {p1Idx + 1} / {PART1.length}
          </span>
        </div>
        <div className="overall-bar-wrap">
          <div className="overall-bar" style={{ width: `${elapsedPct}%` }} />
        </div>
        <div className="overall-meta">
          <span>Total</span>
          <span>経過 {fmtMS(elapsed)} / {fmtMS(TOTAL_SEC)}</span>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="quiz-body">
          <div className="q-number">
            <span className="eyebrow">
              Q{String(p1Idx + 1).padStart(2, "0")} ／ {q.axes}
            </span>
          </div>
          <div className="q-text">{q.text}</div>
          <div className="timer-bar-wrap">
            <div
              className="timer-bar"
              style={{
                width: `${timerPct}%`,
                background: perQRemaining <= 10 ? "var(--color-error)" : "var(--color-text)",
                transition: "width 1s linear",
              }}
            />
          </div>
          <div className="timer-text" style={{ color: perQRemaining <= 10 ? "var(--color-error)" : undefined }}>
            {p1Locked[p1Idx]
              ? "時間切れ（確定済み）"
              : `残り ${perQRemaining} 秒`}
          </div>
          <div className="ips-table">
            <div className="ips-row ips-header">
              <span className="ips-letter" />
              <span className="ips-text" />
              <span className="ips-pick-h">最も近い</span>
              <span className="ips-pick-h">最も遠い</span>
            </div>
            {opts.map((o) => {
              const isClose = currentAnswer.close === o.letter;
              const isFar = currentAnswer.far === o.letter;
              const cls = ["ips-row"];
              if (isClose) cls.push("is-close");
              if (isFar) cls.push("is-far");
              if (p1Locked[p1Idx]) cls.push("locked");
              return (
                <div className={cls.join(" ")} key={o.letter}>
                  <span className="ips-letter">{o.letter}</span>
                  <span className="ips-text">{o.text}</span>
                  <button
                    className="ips-pick ips-close"
                    disabled={p1Locked[p1Idx]}
                    onClick={() => pickClose(o.letter)}
                    aria-label="最も近い"
                  >
                    近い
                  </button>
                  <button
                    className="ips-pick ips-far"
                    disabled={p1Locked[p1Idx]}
                    onClick={() => pickFar(o.letter)}
                    aria-label="最も遠い"
                  >
                    遠い
                  </button>
                </div>
              );
            })}
          </div>
          <div className="ips-help">
            2つ選んでください：「最も近い」を1つ、「最も遠い」を1つ。同じ選択肢にはどちらも付けられません。
          </div>
        </div>
        <div className="quiz-nav no-prev">
          <button
            className="btn-primary"
            disabled={!canAdvanceP1}
            onClick={onP1Next}
          >
            次へ →
          </button>
        </div>
      </main>
    );
  }

  // ── Render: Transition ──────────────────────────────────
  if (screen === "transition") {
    return (
      <main className="app-shell">
        <div className="transition-content">
          <span className="eyebrow">Part 1 完了</span>
          <h2 className="transition-title">
            次は、あなたの言葉で<br />答えてください
          </h2>
          <p className="transition-desc">
            Part 2 では、INSTYLE GROUP の働き方・価値観についてあなた自身の考えをお聞きします。
            模範解答を探す必要はありません。
            <br />
            <br />
            正直に、具体的に書いてください。Part 2 は記述後も「前へ」で戻って書き直せます。
          </p>
          <button className="btn-primary" onClick={startP2}>
            続ける
          </button>
        </div>
      </main>
    );
  }

  // ── Render: Part 2 ──────────────────────────────────────
  if (screen === "p2") {
    const q = PART2[p2Idx];
    const val = p2Answers[p2Idx] ?? "";
    const elapsedPct = Math.min(100, (elapsed / TOTAL_SEC) * 100);
    const pct = 50 + ((p2Idx + 1) / PART2.length) * 50;

    return (
      <main className="app-shell">
        <div className="part-header">
          <span className="part-logo">INSTYLE GROUP</span>
          <span className="part-info">
            Part 2 — {p2Idx + 1} / {PART2.length}
          </span>
        </div>
        <div className="overall-bar-wrap">
          <div className="overall-bar" style={{ width: `${elapsedPct}%` }} />
        </div>
        <div className="overall-meta">
          <span>Total</span>
          <span>経過 {fmtMS(elapsed)} / {fmtMS(TOTAL_SEC)}</span>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="quiz-body">
          <div className="q-number">
            <span className="eyebrow">
              Part 2 — {String(p2Idx + 1).padStart(2, "0")} ／ {q.theme}
            </span>
          </div>
          <div className="essay-wrap">
            <div className="essay-q">{q.text}</div>
            <textarea
              className="essay-textarea"
              placeholder="ここに入力してください..."
              value={val}
              onChange={(e) => onP2Input(e.target.value)}
            />
            <div className="char-count">{val.length} 文字</div>
          </div>
        </div>
        <div className="quiz-nav">
          <button className="btn-secondary" disabled={p2Idx === 0} onClick={onP2Prev}>
            ← 前へ
          </button>
          <button className="btn-primary" disabled={submitting} onClick={onP2Next}>
            {p2Idx < PART2.length - 1 ? "次へ →" : submitting ? "送信中..." : "提出する →"}
          </button>
        </div>
      </main>
    );
  }

  // ── Render: Result ──────────────────────────────────────
  const totalElapsed = startTimeRef.current
    ? Math.floor((Date.now() - startTimeRef.current) / 1000)
    : elapsed;

  return (
    <main className="app-shell">
      <div className="result-header">
        <span className="result-logo">INSTYLE GROUP</span>
        <span className="eyebrow">Culture Fit Assessment</span>
      </div>

      <div className="result-hero">
        <span className="eyebrow">あなたのタイプ</span>
        <h1 className="result-type">{verdict.type.name}</h1>
        <p className="result-type-desc">{verdict.type.desc}</p>
        <span className={`verdict-badge verdict-${verdict.type.verdict}`}>
          {VERDICT_LABEL[verdict.type.verdict]}
        </span>
      </div>

      {verdict.absoluteNg && (
        <div className="flag-banner">
          <strong>絶対 NG ルール該当：</strong>「自他」「素直さ」両軸が負側のため、
          採用観点では特に注意が必要なプロファイルです。面接で前提を確認してください。
        </div>
      )}

      <div className="axis-list">
        <span className="match-pill">{MATCH_LABEL[verdict.matchStrength].label}</span>
        <p className="result-lead">
          {MATCH_LABEL[verdict.matchStrength].desc}
        </p>
        {axisNet.map((net, i) => {
          const tier = tiers[i];
          const pct = Math.max(5, Math.min(95, Math.round(((net + 20) / 40) * 100)));
          const fromCenter = net >= 0;
          const fillLeft = fromCenter ? 50 : pct;
          const fillWidth = Math.abs(pct - 50);
          return (
            <div className={`axis-row ${tier.tier}`} key={i}>
              <div className="axis-meta">
                <span>{AXIS_NAMES[i]}</span>
                <span className="axis-net">
                  {net > 0 ? "+" : ""}
                  {net}（{tier.label}）
                </span>
              </div>
              <div className="axis-bar-track">
                <div
                  className="axis-bar-fill"
                  style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
                />
              </div>
              <div className="axis-poles">
                <span>{AXIS_LABELS[i][0]}</span>
                <span>{AXIS_LABELS[i][1]}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="axis-list">
        <span className="eyebrow">受験完了情報</span>
        <p className="result-meta">
          所要時間：{fmtMS(totalElapsed)}（制限 60:00）
          <br />
          受験者ID：{candidateId ?? (submitting ? "送信中..." : submitErr ? `送信エラー（${submitErr}）` : "未送信")}
        </p>
        <p className="result-meta">
          結果は採用担当に共有されました。お疲れさまでした。
        </p>
      </div>
    </main>
  );
}
