"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Status = "before" | "open" | "after" | "closed";

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
 * トップページの「テストを開始する」CTA に、受験時間窓のゲートをかける。
 * - before: カウントダウン表示、ボタンは無効化
 * - open: 通常 CTA。残り時間も表示
 * - after / closed: 受験不可メッセージ
 */
export function WindowGate({
  status: initialStatus,
  openAt,
  closeAt,
  message,
  serverNowMs,
}: {
  status: Status;
  openAt: string | null;
  closeAt: string | null;
  message: string | null;
  serverNowMs: number;
}) {
  // クライアントとサーバの時刻ずれを最小化するため、サーバ側の現在時刻を基準に
  // クライアント時計との差分（offset）を保持
  const [offset] = useState(() => Date.now() - serverNowMs);
  const [, setTick] = useState(0);

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
  const openMs = openAt ? new Date(openAt).getTime() : null;
  const closeMs = closeAt ? new Date(closeAt).getTime() : null;

  let status: Status = initialStatus;
  if (openMs && closeMs) {
    if (nowMs < openMs) status = "before";
    else if (nowMs < closeMs) status = "open";
    else status = "after";
  } else if (openMs && !closeMs) {
    status = nowMs >= openMs ? "open" : "before";
  } else if (!openMs && closeMs) {
    status = nowMs < closeMs ? "open" : "after";
  } else {
    status = "closed";
  }

  return (
    <div className="window-gate">
      {message && status !== "closed" && (
        <p className="window-message">{message}</p>
      )}

      {status === "before" && openMs && (
        <div className="window-state window-state-before">
          <span className="eyebrow">開始まで</span>
          <div className="window-countdown" aria-live="polite">
            {fmtCountdown(openMs - nowMs)}
          </div>
          <p className="window-window-info">
            開始予定：{fmtJP(openAt)}
            {closeAt && <><br />終了予定：{fmtJP(closeAt)}</>}
          </p>
        </div>
      )}

      {status === "open" && (
        <>
          <Link href="/test" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
            テストを開始する
          </Link>
          {closeMs && (
            <p className="window-remaining">
              受験可能時間 残り {fmtCountdown(closeMs - nowMs)}
            </p>
          )}
        </>
      )}

      {status === "after" && (
        <div className="window-state window-state-after">
          <span className="eyebrow">受験終了</span>
          <p>このテストの受験時間は終了しました。担当者にご連絡ください。</p>
        </div>
      )}

      {status === "closed" && (
        <div className="window-state window-state-closed">
          <span className="eyebrow">受験準備中</span>
          <p>このテストはまだ開始されていません。担当者からの案内をお待ちください。</p>
        </div>
      )}
    </div>
  );
}
