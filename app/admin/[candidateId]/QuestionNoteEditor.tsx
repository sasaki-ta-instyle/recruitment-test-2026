"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { saveQuestionNote } from "./actions";

export function QuestionNoteEditor({
  candidateId,
  scope,
  initial,
  placeholder,
  rows = 2,
}: {
  candidateId: string;
  scope: string;
  initial: string;
  placeholder?: string;
  rows?: number;
}) {
  const [value, setValue] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [, startTransition] = useTransition();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>(initial);

  useEffect(() => () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  function persist(next: string) {
    if (next === lastSavedRef.current) return;
    setStatus("saving");
    startTransition(async () => {
      const res = await saveQuestionNote({ candidateId, scope, body: next });
      if (res.ok) {
        lastSavedRef.current = next;
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 1200);
      } else {
        setStatus("error");
      }
    });
  }

  function schedule(next: string) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => persist(next), 700);
  }

  return (
    <div className={`qn-editor qn-editor-${status}`}>
      <textarea
        className="qn-textarea"
        rows={rows}
        placeholder={placeholder ?? "コメント・所感（自動保存）"}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          schedule(e.target.value);
        }}
        onBlur={() => persist(value)}
      />
      {value && (
        <div className="qn-print-body">{value}</div>
      )}
    </div>
  );
}
