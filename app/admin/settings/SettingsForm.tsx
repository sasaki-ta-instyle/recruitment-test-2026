"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { clearTestWindow, saveTestWindow } from "./actions";

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  // datetime-local には秒なしのローカル時刻 "YYYY-MM-DDTHH:mm" を渡す
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SettingsForm({
  openAtIso,
  closeAtIso,
  message,
}: {
  openAtIso: string | null;
  closeAtIso: string | null;
  message: string | null;
}) {
  const [openAt, setOpenAt] = useState(isoToLocalInput(openAtIso));
  const [closeAt, setCloseAt] = useState(isoToLocalInput(closeAtIso));
  const [msg, setMsg] = useState(message ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorText, setErrorText] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorText(null);
    startTransition(async () => {
      const res = await saveTestWindow({
        openAt: openAt || null,
        closeAt: closeAt || null,
        message: msg || null,
      });
      if (res.ok) {
        setStatus("saved");
        router.refresh();
        setTimeout(() => setStatus("idle"), 1500);
      } else {
        setStatus("error");
        setErrorText(res.error);
      }
    });
  }

  function onClear() {
    if (!window.confirm("受験時間の設定をすべて解除します（テスト常時クローズ状態に戻る）。よろしいですか？")) return;
    setStatus("saving");
    startTransition(async () => {
      await clearTestWindow();
      setOpenAt("");
      setCloseAt("");
      setMsg("");
      setStatus("saved");
      router.refresh();
      setTimeout(() => setStatus("idle"), 1500);
    });
  }

  return (
    <form className="settings-form" onSubmit={submit}>
      <div className="settings-grid">
        <label className="settings-field">
          <span className="settings-label">受験開始</span>
          <input
            type="datetime-local"
            value={openAt}
            onChange={(e) => setOpenAt(e.target.value)}
            className="settings-input"
          />
        </label>
        <label className="settings-field">
          <span className="settings-label">受験終了</span>
          <input
            type="datetime-local"
            value={closeAt}
            onChange={(e) => setCloseAt(e.target.value)}
            className="settings-input"
          />
        </label>
      </div>
      <label className="settings-field">
        <span className="settings-label">受験者画面のメッセージ（任意）</span>
        <textarea
          className="settings-textarea"
          rows={3}
          placeholder="例：本日 14:00〜15:00 まで採用カルチャーテストを実施します。"
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
        />
      </label>
      <div className="settings-actions">
        <button type="submit" className="btn-primary" disabled={isPending}>
          {status === "saving" ? "保存中..." : "保存"}
        </button>
        <button type="button" className="btn-secondary" disabled={isPending} onClick={onClear}>
          設定を解除
        </button>
        <span className={`settings-status settings-status-${status}`} aria-live="polite">
          {status === "saved" && "保存しました"}
          {status === "error" && errorText && `エラー：${errorText}`}
        </span>
      </div>
    </form>
  );
}
