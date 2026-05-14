"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveCandidates, deleteCandidates, unarchiveCandidates } from "./actions";

export type CandidateRow = {
  id: string;
  name: string;
  submittedAt: string;
  elapsedSec: number;
  archivedAt: string | null;
  score: {
    axisSelf: number;
    axisSunao: number;
    axisContrib: number;
    axisPositive: number;
    typeName: string;
    matchStrengthLabel: string;
    verdict: string;
    verdictLabel: string;
  } | null;
};

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}`;
}

function fmtElapsed(sec: number): string {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

function signed(n: number): string {
  return (n > 0 ? "+" : "") + n;
}

export function CandidateTable({
  rows,
  view,
}: {
  rows: CandidateRow[];
  view: "active" | "archived";
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const allSelected = rows.length > 0 && selected.size === rows.length;
  const someSelected = selected.size > 0 && selected.size < rows.length;
  const ids = Array.from(selected);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(rows.map((r) => r.id)));
    }
  }

  function runAction(
    action: (ids: string[]) => Promise<{ ok: true; count: number } | { ok: false; error: string }>,
    confirmMsg?: string,
  ) {
    if (ids.length === 0) return;
    if (confirmMsg && !window.confirm(confirmMsg)) return;
    setError(null);
    startTransition(async () => {
      const res = await action(ids);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <>
      <div className="admin-tabs no-print">
        <Link
          href="/admin"
          className={`admin-tab${view === "active" ? " is-active" : ""}`}
          aria-current={view === "active" ? "page" : undefined}
        >
          アクティブ
        </Link>
        <Link
          href="/admin?view=archived"
          className={`admin-tab${view === "archived" ? " is-active" : ""}`}
          aria-current={view === "archived" ? "page" : undefined}
        >
          アーカイブ済み
        </Link>
      </div>

      {selected.size > 0 && (
        <div className="admin-bulkbar no-print" role="status" aria-live="polite">
          <span className="admin-bulkbar-count">{selected.size} 件選択中</span>
          <div className="admin-bulkbar-actions">
            {view === "active" ? (
              <button
                type="button"
                className="btn-secondary"
                disabled={isPending}
                onClick={() => runAction(archiveCandidates, `${ids.length} 件をアーカイブしますか？`)}
              >
                アーカイブ
              </button>
            ) : (
              <button
                type="button"
                className="btn-secondary"
                disabled={isPending}
                onClick={() => runAction(unarchiveCandidates, `${ids.length} 件をアーカイブ解除しますか？`)}
              >
                アーカイブ解除
              </button>
            )}
            <button
              type="button"
              className="btn-danger"
              disabled={isPending}
              onClick={() =>
                runAction(
                  deleteCandidates,
                  `${ids.length} 件を完全に削除します。回答データもすべて消えます。よろしいですか？`,
                )
              }
            >
              削除
            </button>
          </div>
        </div>
      )}

      {error && <div className="admin-bulkbar-error">{error}</div>}

      <div className="admin-card">
        {rows.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>
            {view === "active" ? "まだ受験記録がありません。" : "アーカイブ済みの受験者はいません。"}
          </p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-checkbox-cell">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected;
                    }}
                    onChange={toggleAll}
                    aria-label="全選択"
                  />
                </th>
                <th>受験日時</th>
                <th>氏名</th>
                <th>4 軸スコア</th>
                <th>タイプ</th>
                <th>マッチ</th>
                <th>判定</th>
                <th>所要</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => {
                const s = c.score;
                const isSelected = selected.has(c.id);
                return (
                  <tr key={c.id} className={isSelected ? "is-selected" : undefined}>
                    <td className="admin-checkbox-cell">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(c.id)}
                        aria-label={`${c.name} を選択`}
                      />
                    </td>
                    <td style={{ whiteSpace: "nowrap", fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
                      {fmtDate(c.submittedAt)}
                    </td>
                    <td>
                      <Link href={`/admin/${c.id}`}>{c.name}</Link>
                    </td>
                    <td style={{ fontFamily: "var(--font-display)", fontSize: "0.8125rem" }}>
                      {s
                        ? `${signed(s.axisSelf)}/${signed(s.axisSunao)}/${signed(s.axisContrib)}/${signed(s.axisPositive)}`
                        : "—"}
                    </td>
                    <td>{s?.typeName ?? "—"}</td>
                    <td>{s?.matchStrengthLabel ?? "—"}</td>
                    <td>
                      {s ? (
                        <span className={`verdict-badge verdict-${s.verdict}`} style={{ marginTop: 0 }}>
                          {s.verdictLabel}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ fontFamily: "var(--font-display)", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                      {fmtElapsed(c.elapsedSec)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
