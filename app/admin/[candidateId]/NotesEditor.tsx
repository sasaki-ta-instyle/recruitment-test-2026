"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveNotes } from "./actions";

export function NotesEditor({
  candidateId,
  initial,
}: {
  candidateId: string;
  initial: string;
}) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(initial);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  function schedule(next: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persist(next), 700);
  }

  function persist(next: string) {
    if (next === lastSavedRef.current) return;
    setStatus("saving");
    startTransition(async () => {
      const res = await saveNotes({ candidateId, notes: next });
      if (res.ok) {
        lastSavedRef.current = next;
        setStatus("saved");
        // 短い時間「保存しました」を出して idle に戻す
        setTimeout(() => setStatus("idle"), 1500);
      } else {
        setStatus("error");
      }
    });
  }

  return (
    <section className="admin-card notes-card">
      <div className="notes-header">
        <h2 className="admin-section-title" style={{ marginBottom: 0 }}>面接官メモ</h2>
        <span className={`notes-status notes-status-${status}`} aria-live="polite">
          {status === "saving" && "保存中…"}
          {status === "saved" && "保存しました"}
          {status === "error" && "保存に失敗"}
          {status === "idle" && (value ? "自動保存：入力すると即時保存されます" : "")}
        </span>
      </div>
      <textarea
        className="notes-textarea"
        placeholder="面接で確認したこと・所感・追加すべき確認事項などを自由に記入してください。入力は自動保存されます。"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          schedule(e.target.value);
        }}
        onBlur={() => persist(value)}
        rows={6}
      />
      <div className="notes-print">
        {value ? (
          <p className="notes-print-body">{value}</p>
        ) : (
          <p className="notes-print-empty">（面接官メモは未記入）</p>
        )}
      </div>
    </section>
  );
}
