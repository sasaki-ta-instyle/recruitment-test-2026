"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

function fmtCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const sec = Math.floor(ms / 1000);
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

function fmtJP(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * 開始前ステータス用のライブカウントダウン。
 * openAt に到達したらサーバ側の再評価を促すため router.refresh() する。
 * モバイルでタブを背景化したあとに復帰したときも visibilitychange/focus で
 * 即時再計算する。
 */
export function BeforeCountdown({
  openAt,
  closeAt,
  serverNowMs,
}: {
  openAt: string;
  closeAt: string | null;
  serverNowMs: number;
}) {
  const [offset] = useState(() => Date.now() - serverNowMs);
  const [, setTick] = useState(0);
  const router = useRouter();

  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 1000);
    const recompute = () => setTick((t) => t + 1);
    const onVis = () => {
      if (document.visibilityState === "visible") recompute();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", recompute);
    window.addEventListener("focus", recompute);
    return () => {
      clearInterval(i);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", recompute);
      window.removeEventListener("focus", recompute);
    };
  }, []);

  const nowMs = Date.now() - offset;
  const openMs = new Date(openAt).getTime();
  const remaining = openMs - nowMs;

  // openAt に到達したらサーバ再フェッチで /test がテスト画面に切り替わる
  useEffect(() => {
    if (remaining <= 0) {
      router.refresh();
    }
  }, [remaining, router]);

  return (
    <div className="window-state window-state-before">
      <span className="eyebrow">開始まで</span>
      <div className="window-countdown" aria-live="polite">
        {fmtCountdown(remaining)}
      </div>
      <p className="window-window-info">
        開始予定：{fmtJP(openAt)}
        {closeAt && (
          <>
            <br />
            終了予定：{fmtJP(closeAt)}
          </>
        )}
      </p>
    </div>
  );
}
