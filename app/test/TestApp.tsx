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
import { Logo } from "@/app/_components/Logo";

type Screen = "intro" | "p1" | "transition" | "p2" | "result";

type Part1Answer = { close: string | null; far: string | null };

type ShuffledOption = { letter: string; text: string; pole: Pole };

const TIMER_SEC = 45;
const TOTAL_SEC = 60 * 60;
const STORAGE_KEY = "recruitment-test-2026:state-v1";

type PersistedState = {
  screen: Screen;
  name: string;
  shuffled: ShuffledOption[][];
  p1Answers: Part1Answer[];
  p1Locked: boolean[];
  p1Idx: number;
  poleScores: PoleScores;
  p2Idx: number;
  p2Answers: string[];
  p2TimeSpent: number[];
  startTimeMs: number | null;
  timeUp: boolean;
};

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

export default function TestApp({
  closeAtIso = null,
  serverNowMs = Date.now(),
  inviteToken = null,
  prefilledName = "",
}: {
  closeAtIso?: string | null;
  serverNowMs?: number;
  inviteToken?: string | null;
  prefilledName?: string;
} = {}) {
  // 受験時間窓の終了時刻（closeAt）に到達したら強制提出
  const windowCloseMs = closeAtIso ? new Date(closeAtIso).getTime() : null;
  const serverClientOffset = Date.now() - serverNowMs;
  // クライアントの time が closeAt を過ぎたら force finish
  const [screen, setScreen] = useState<Screen>("intro");
  const [name, setName] = useState(prefilledName);
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
  // 重複送信防止（state は非同期反映なので確実にロックするためのフラグ）
  const finishRequestedRef = useRef(false);
  // 60 分タイムアップで自動送信されたかどうか
  const [timeUp, setTimeUp] = useState(false);

  // Stop timers on unmount
  useEffect(() => {
    return () => {
      if (perQTimerRef.current) clearInterval(perQTimerRef.current);
      if (overallTimerRef.current) clearInterval(overallTimerRef.current);
    };
  }, []);

  // ── タブ可視状態が変わったとき、壁時計から elapsed を再計算 ───
  // モバイル等で背景化中は setInterval が止まる/間引かれるため、
  // visibilitychange / pageshow / focus で復帰時に即時補正する。
  useEffect(() => {
    if (typeof document === "undefined") return;
    const recompute = () => {
      if (!startTimeRef.current) return;
      const e = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setElapsed(Math.min(e, TOTAL_SEC));
    };
    const onVis = () => {
      if (document.visibilityState === "visible") recompute();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", recompute);
    window.addEventListener("focus", recompute);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", recompute);
      window.removeEventListener("focus", recompute);
    };
  }, []);

  // ── localStorage 永続化：マウント時に復元 ─────────────
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") {
      setHydrated(true);
      return;
    }
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const s = JSON.parse(raw) as PersistedState;
        // 既に提出済みの結果画面 state はリセット
        if (s.screen === "result") {
          window.localStorage.removeItem(STORAGE_KEY);
        } else if (s.screen === "intro") {
          // intro までしか進んでいない場合は名前だけ復元（任意）
          if (s.name) setName(s.name);
        } else {
          // p1 / transition / p2 のいずれかから再開
          setName(s.name);
          setShuffled(s.shuffled);
          setP1Answers(s.p1Answers);
          setP1Locked(s.p1Locked);
          setP1Idx(s.p1Idx);
          setPoleScores(s.poleScores);
          setP2Idx(s.p2Idx);
          setP2Answers(s.p2Answers);
          setP2TimeSpent(s.p2TimeSpent);
          setTimeUp(s.timeUp);
          if (typeof s.startTimeMs === "number") {
            startTimeRef.current = s.startTimeMs;
            const e = Math.floor((Date.now() - s.startTimeMs) / 1000);
            setElapsed(Math.min(e, TOTAL_SEC));
            // 全体タイマーを再開
            stopOverallTimer();
            overallTimerRef.current = setInterval(() => {
              if (!startTimeRef.current) return;
              const cur = Math.floor((Date.now() - startTimeRef.current) / 1000);
              setElapsed(Math.min(cur, TOTAL_SEC));
            }, 1000);
          }
          setScreen(s.screen);
        }
      }
    } catch {
      // 破損した state は無視して新規開始
    } finally {
      setHydrated(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── localStorage 永続化：state 変更で書き込み ─────────
  useEffect(() => {
    if (!hydrated) return;
    if (typeof window === "undefined") return;
    // result 画面到達後は state を捨てる（次の受験者のため）
    if (screen === "result") {
      try {
        window.localStorage.removeItem(STORAGE_KEY);
      } catch {}
      return;
    }
    // intro 画面で名前未入力なら保存しない
    if (screen === "intro" && !name) return;
    try {
      const state: PersistedState = {
        screen,
        name,
        shuffled,
        p1Answers,
        p1Locked,
        p1Idx,
        poleScores,
        p2Idx,
        p2Answers,
        p2TimeSpent,
        startTimeMs: startTimeRef.current,
        timeUp,
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // QuotaExceeded など。失敗しても続行
    }
  }, [hydrated, screen, name, shuffled, p1Answers, p1Locked, p1Idx, poleScores, p2Idx, p2Answers, p2TimeSpent, timeUp]);

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
    finishRequestedRef.current = false;
    setTimeUp(false);

    startTimeRef.current = Date.now();
    setElapsed(0);
    stopOverallTimer();
    overallTimerRef.current = setInterval(() => {
      if (!startTimeRef.current) return;
      const e = Math.floor((Date.now() - startTimeRef.current) / 1000);
      // 上限 60 分でキャップ。実時刻は startTimeRef から再計算可能だが、
      // 表示と「制限到達検知」を兼ねるためここで打ち切る。
      setElapsed(Math.min(e, TOTAL_SEC));
    }, 1000);

    setScreen("p1");
  };

  // ── 60 分タイムアップで自動提出 ──────────────────────
  useEffect(() => {
    if (elapsed < TOTAL_SEC) return;
    if (finishRequestedRef.current) return;
    if (screen !== "p1" && screen !== "p2" && screen !== "transition") return;
    setTimeUp(true);
    void finishTest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, screen]);

  // ── 受験時間窓 closeAt 到達でも自動提出 ───────────────
  useEffect(() => {
    if (!windowCloseMs) return;
    if (finishRequestedRef.current) return;
    if (screen !== "p1" && screen !== "p2" && screen !== "transition") return;
    const tick = () => {
      const nowMs = Date.now() - serverClientOffset;
      if (nowMs >= windowCloseMs) {
        setTimeUp(true);
        void finishTest();
      }
    };
    tick();
    const i = setInterval(tick, 1000);
    // 背景化から復帰したときに即座に closeAt を再評価
    const onVis = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", tick);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", tick);
      window.removeEventListener("focus", tick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen, windowCloseMs, serverClientOffset]);

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
      const ok = window.confirm(
        "提出すると、この後は回答を編集できません。提出してよろしいですか？",
      );
      if (!ok) return;
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
    if (finishRequestedRef.current) return;
    finishRequestedRef.current = true;
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
        inviteToken,
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
          <Logo className="landing-logo" height={16} />
          <h1 className="landing-title">採用カルチャーテスト</h1>
          <p className="landing-sub">
            Part 1（選択 20 問）と Part 2（記述 10 問）の 2 部構成、合計 60 分です。
            Part 1 は各問 45 秒。Part 2 は時間配分自由。
            <br />
            模範解答を探さず、ご自身の自然な感覚で答えてください。
          </p>
          <div className="landing-cta">
            <input
              type="text"
              className="name-input"
              placeholder="お名前（フルネーム）"
              autoComplete="name"
              inputMode="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (e.target.value.trim()) setNameErr(false);
              }}
              /* Enter は IME 変換確定で誤って次ページに進まないよう無効化。
                 開始は「テストを開始する」ボタンのみ。 */
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
          <Logo height={12} />
          <span className="part-info">
            Part 1 — {p1Idx + 1} / {PART1.length}
          </span>
        </div>
        <div className="overall-bar-wrap">
          <div className="overall-bar" style={{ width: `${elapsedPct}%` }} />
        </div>
        <div className="overall-meta">
          <span>Total</span>
          <span>経過 {fmtMS(Math.min(elapsed, TOTAL_SEC))} / {fmtMS(TOTAL_SEC)}</span>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="quiz-body">
          <div className="q-number">
            <span className="eyebrow">
              Q{String(p1Idx + 1).padStart(2, "0")}
            </span>
          </div>
          <div className="q-text">{q.text}</div>
          <div className="ips-help">
            2つ選んでください：「最も近い」を1つ、「最も遠い」を1つ。同じ選択肢にはどちらも付けられません。
          </div>
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
            ここからは、<br />ご自身の言葉で書いてください
          </h2>
          <p className="transition-desc">
            Part 2 は INSTYLE GROUP の働き方・価値観に対する
            <strong>あなた自身の考えを記述してもらうセクション</strong>です。
            全 10 問あり、各設問に文字数や 1 問あたりの時間制限はありません
            （Part 1 と合わせて合計 60 分）。
            <br />
            <br />
            模範解答を探す必要はありません。<strong>あなた自身の経験と言葉で、正直に・具体的に</strong>
            書いてください。整った日本語よりも、自分で考えたことが伝わる文章を歓迎します。
            <br />
            <br />
            「前へ」ボタンで戻って書き直すこともできます。途中でブラウザを閉じても、
            次に開いたときに続きから再開できます。
          </p>
          <button className="btn-primary" onClick={startP2}>
            Part 2 を始める
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
          <Logo height={12} />
          <span className="part-info">
            Part 2 — {p2Idx + 1} / {PART2.length}
          </span>
        </div>
        <div className="overall-bar-wrap">
          <div className="overall-bar" style={{ width: `${elapsedPct}%` }} />
        </div>
        <div className="overall-meta">
          <span>Total</span>
          <span>経過 {fmtMS(Math.min(elapsed, TOTAL_SEC))} / {fmtMS(TOTAL_SEC)}</span>
        </div>
        <div className="progress-bar-wrap">
          <div className="progress-bar" style={{ width: `${pct}%` }} />
        </div>
        <div className="quiz-body">
          <div className="essay-progress" aria-label={`Part 2 進捗 ${p2Idx + 1} / ${PART2.length}`}>
            <span className="essay-progress-label">記述</span>
            <span className="essay-progress-current">{p2Idx + 1}</span>
            <span className="essay-progress-of">／ {PART2.length}</span>
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
  const totalElapsed = Math.min(
    TOTAL_SEC,
    startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current) / 1000)
      : elapsed,
  );

  return (
    <main className="app-shell">
      <div className="result-header">
        <Logo height={14} />
        <span className="eyebrow">Culture Fit Assessment</span>
      </div>

      <div className="result-hero">
        <span className="eyebrow">受験完了</span>
        <h1 className="result-type">ご回答ありがとうございました</h1>
        <p className="result-type-desc">
          結果の判定は採用担当のみで取り扱います。受験者画面には判定内容を表示しません。
        </p>
      </div>

      {timeUp && (
        <div className="flag-banner">
          <strong>制限時間 60 分に到達：</strong>その時点までの回答内容で自動的に提出されました。
        </div>
      )}

      <div className="axis-list">
        <span className="eyebrow">受験完了情報</span>
        <p className="result-meta">
          所要時間：{fmtMS(totalElapsed)}（制限 60:00）
          <br />
          受験者ID：{candidateId ?? (submitting ? "送信中..." : submitErr ? `送信エラー（${submitErr}）` : "未送信")}
        </p>
        <p className="result-meta">
          ご回答は採用担当に共有されました。お疲れさまでした。
          {inviteToken &&
            "この受験 URL は提出済みのため、再度アクセスしてもテストは表示されません。"}
        </p>
      </div>
    </main>
  );
}
