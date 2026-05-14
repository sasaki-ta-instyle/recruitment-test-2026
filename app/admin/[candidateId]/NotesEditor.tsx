"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveInterviewerName, saveNotes } from "./actions";

export function NotesEditor({
  candidateId,
  initialNotes,
  initialInterviewer,
}: {
  candidateId: string;
  initialNotes: string;
  initialInterviewer: string;
}) {
  const [value, setValue] = useState(initialNotes);
  const [interviewer, setInterviewer] = useState(initialInterviewer);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intvTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedNotesRef = useRef<string>(initialNotes);
  const lastSavedNameRef = useRef<string>(initialInterviewer);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intvTimerRef.current) clearTimeout(intvTimerRef.current);
    };
  }, []);

  function persistNotes(next: string) {
    if (next === lastSavedNotesRef.current) return;
    setStatus("saving");
    startTransition(async () => {
      const res = await saveNotes({ candidateId, notes: next });
      if (res.ok) {
        lastSavedNotesRef.current = next;
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      } else {
        setStatus("error");
      }
    });
  }

  function persistInterviewer(next: string) {
    if (next === lastSavedNameRef.current) return;
    setStatus("saving");
    startTransition(async () => {
      const res = await saveInterviewerName({ candidateId, name: next });
      if (res.ok) {
        lastSavedNameRef.current = next;
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1500);
      } else {
        setStatus("error");
      }
    });
  }

  function scheduleNotes(next: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persistNotes(next), 700);
  }

  function scheduleInterviewer(next: string) {
    if (intvTimerRef.current) clearTimeout(intvTimerRef.current);
    intvTimerRef.current = setTimeout(() => persistInterviewer(next), 700);
  }

  return (
    <section className="admin-card notes-card">
      <div className="notes-header">
        <h2 className="admin-section-title" style={{ marginBottom: 0 }}>面接官メモ ／ 採点シート</h2>
        <span className={`notes-status notes-status-${status}`} aria-live="polite">
          {status === "saving" && "保存中…"}
          {status === "saved" && "保存しました"}
          {status === "error" && "保存に失敗"}
          {status === "idle" && "自動保存：入力すると即時保存されます"}
        </span>
      </div>

      <div className="notes-field">
        <label className="notes-field-label" htmlFor={`interviewer-${candidateId}`}>面接担当</label>
        <input
          id={`interviewer-${candidateId}`}
          type="text"
          className="notes-input"
          placeholder="例：佐々木 / 山田 など"
          value={interviewer}
          onChange={(e) => {
            setInterviewer(e.target.value);
            scheduleInterviewer(e.target.value);
          }}
          onBlur={() => persistInterviewer(interviewer)}
        />
        <div className="notes-print-row">
          <span className="notes-print-label">面接担当：</span>
          <span className="notes-print-value">{interviewer || "—"}</span>
        </div>
      </div>

      <div className="notes-field">
        <label className="notes-field-label" htmlFor={`notes-${candidateId}`}>所見・メモ</label>
        <textarea
          id={`notes-${candidateId}`}
          className="notes-textarea"
          placeholder="面接で確認したこと・所感・追加すべき確認事項などを自由に記入してください。入力は自動保存されます。"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            scheduleNotes(e.target.value);
          }}
          onBlur={() => persistNotes(value)}
          rows={6}
        />
        <div className="notes-print">
          {value ? (
            <p className="notes-print-body">{value}</p>
          ) : (
            <p className="notes-print-empty">（所見・メモは未記入）</p>
          )}
        </div>
      </div>
    </section>
  );
}
