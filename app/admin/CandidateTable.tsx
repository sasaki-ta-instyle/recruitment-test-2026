"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveCandidates, deleteCandidates, unarchiveCandidates } from "./actions";

type SortKey =
  | "submittedAt"
  | "name"
  | "axisSum"
  | "typeName"
  | "matchStrength"
  | "verdict"
  | "elapsedSec";

const VERDICT_ORDER: Record<string, number> = {
  "good-deep": 6,
  good: 5,
  develop: 4,
  review: 3,
  warn: 2,
  ng: 1,
};
const MATCH_ORDER: Record<string, number> = {
  strong: 5,
  clear: 4,
  mid: 3,
  weak: 2,
  hold: 1,
};

export type CandidateRow = {
  id: string;
  serialNo: number | null;
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
    matchStrength: string;
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

  const [sortKey, setSortKey] = useState<SortKey>("submittedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      // 日付・所要は新しい/長い順、それ以外は昇順をデフォルトに
      setSortDir(key === "submittedAt" || key === "elapsedSec" ? "desc" : "asc");
    }
  }

  const sortedRows = useMemo(() => {
    const arr = [...rows];
    const cmp = (a: CandidateRow, b: CandidateRow) => {
      let va: number | string;
      let vb: number | string;
      switch (sortKey) {
        case "submittedAt":
          va = new Date(a.submittedAt).getTime();
          vb = new Date(b.submittedAt).getTime();
          break;
        case "name":
          va = a.name;
          vb = b.name;
          break;
        case "axisSum":
          va = a.score
            ? a.score.axisSelf + a.score.axisSunao + a.score.axisContrib + a.score.axisPositive
            : -Infinity;
          vb = b.score
            ? b.score.axisSelf + b.score.axisSunao + b.score.axisContrib + b.score.axisPositive
            : -Infinity;
          break;
        case "typeName":
          va = a.score?.typeName ?? "";
          vb = b.score?.typeName ?? "";
          break;
        case "matchStrength":
          va = a.score ? MATCH_ORDER[a.score.matchStrength] ?? 0 : 0;
          vb = b.score ? MATCH_ORDER[b.score.matchStrength] ?? 0 : 0;
          break;
        case "verdict":
          va = a.score ? VERDICT_ORDER[a.score.verdict] ?? 0 : 0;
          vb = b.score ? VERDICT_ORDER[b.score.verdict] ?? 0 : 0;
          break;
        case "elapsedSec":
          va = a.elapsedSec;
          vb = b.elapsedSec;
          break;
      }
      if (typeof va === "string" && typeof vb === "string") {
        return va.localeCompare(vb, "ja");
      }
      return (va as number) - (vb as number);
    };
    arr.sort((a, b) => {
      const v = cmp(a, b);
      return sortDir === "asc" ? v : -v;
    });
    return arr;
  }, [rows, sortKey, sortDir]);

  function arrow(key: SortKey) {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

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
                <th>#</th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("submittedAt")}>
                    受験日時{arrow("submittedAt")}
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("name")}>
                    氏名{arrow("name")}
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("axisSum")}>
                    4 軸スコア{arrow("axisSum")}
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("typeName")}>
                    タイプ{arrow("typeName")}
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("matchStrength")}>
                    マッチ{arrow("matchStrength")}
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("verdict")}>
                    判定{arrow("verdict")}
                  </button>
                </th>
                <th>
                  <button type="button" className="th-sort" onClick={() => toggleSort("elapsedSec")}>
                    所要{arrow("elapsedSec")}
                  </button>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((c) => {
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
                    <td style={{ fontFamily: "var(--font-display)", fontWeight: 700, whiteSpace: "nowrap" }}>
                      {c.serialNo != null ? `#${String(c.serialNo).padStart(3, "0")}` : "—"}
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
