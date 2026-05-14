"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createInvite, deleteInvite, regenerateInviteToken } from "./actions";

export type InviteRow = {
  id: string;
  token: string;
  label: string;
  openAt: string | null;
  closeAt: string | null;
  message: string | null;
  candidateId: string | null;
  createdAt: string;
};

function isoToLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function statusOf(row: InviteRow, nowMs: number): { label: string; cls: string } {
  if (row.candidateId) return { label: "提出済", cls: "is-used" };
  const openMs = row.openAt ? new Date(row.openAt).getTime() : null;
  const closeMs = row.closeAt ? new Date(row.closeAt).getTime() : null;
  if (openMs && nowMs < openMs) return { label: "開始前", cls: "is-before" };
  if (closeMs && nowMs >= closeMs) return { label: "終了", cls: "is-after" };
  return { label: "受験可能", cls: "is-open" };
}

export function InvitesClient({
  rows,
  baseUrl,
  nowMs,
}: {
  rows: InviteRow[];
  baseUrl: string;
  nowMs: number;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [label, setLabel] = useState("");
  const [openAt, setOpenAt] = useState("");
  const [closeAt, setCloseAt] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function reset() {
    setLabel("");
    setOpenAt("");
    setCloseAt("");
    setMessage("");
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createInvite({
        label,
        openAt: openAt || null,
        closeAt: closeAt || null,
        message: message || null,
      });
      if (res.ok) {
        reset();
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  function onDelete(id: string) {
    if (!window.confirm("この受験 URL を削除します。提出済の場合は受験者本人のデータは残ります。よろしいですか？")) return;
    startTransition(async () => {
      const res = await deleteInvite(id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  function onRegen(id: string) {
    if (!window.confirm("URL（トークン）を再発行します。以前の URL は無効になります。よろしいですか？")) return;
    startTransition(async () => {
      const res = await regenerateInviteToken(id);
      if (res.ok) router.refresh();
      else setError(res.error);
    });
  }

  async function copy(id: string, token: string) {
    const url = `${baseUrl}/test?t=${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      window.prompt("URL をコピーしてください", url);
    }
  }

  return (
    <>
      <section className="admin-card">
        <h2 className="admin-section-title">新規発行</h2>
        <form className="settings-form" onSubmit={submit}>
          <label className="settings-field">
            <span className="settings-label">受験者名 / 識別ラベル</span>
            <input
              className="settings-input"
              type="text"
              required
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="例：山田 花子（候補者）"
            />
          </label>
          <div className="settings-grid">
            <label className="settings-field">
              <span className="settings-label">受験開始</span>
              <input
                className="settings-input"
                type="datetime-local"
                value={openAt}
                onChange={(e) => setOpenAt(e.target.value)}
              />
            </label>
            <label className="settings-field">
              <span className="settings-label">受験終了</span>
              <input
                className="settings-input"
                type="datetime-local"
                value={closeAt}
                onChange={(e) => setCloseAt(e.target.value)}
              />
            </label>
          </div>
          <label className="settings-field">
            <span className="settings-label">メッセージ（任意・受験者画面に表示）</span>
            <textarea
              className="settings-textarea"
              rows={2}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="例：本日 14:00〜15:00 です。落ち着いて取り組んでください。"
            />
          </label>
          <div className="settings-actions">
            <button type="submit" className="btn-primary" disabled={isPending || !label.trim()}>
              {isPending ? "発行中..." : "受験 URL を発行"}
            </button>
            {error && <span className="settings-status settings-status-error">{error}</span>}
          </div>
        </form>
      </section>

      <section className="admin-card">
        <h2 className="admin-section-title">発行済みの URL</h2>
        {rows.length === 0 ? (
          <p style={{ color: "var(--color-text-muted)" }}>まだ発行されていません。</p>
        ) : (
          <table className="admin-table invites-table">
            <thead>
              <tr>
                <th>ラベル</th>
                <th>開始</th>
                <th>終了</th>
                <th>状態</th>
                <th>URL</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const url = `${baseUrl}/test?t=${r.token}`;
                const s = statusOf(r, nowMs);
                return (
                  <tr key={r.id}>
                    <td>
                      <strong>{r.label}</strong>
                      {r.candidateId && (
                        <>
                          {" "}
                          <Link href={`/admin/${r.candidateId}`}>詳細</Link>
                        </>
                      )}
                    </td>
                    <td className="invites-meta">{r.openAt ? new Date(r.openAt).toLocaleString("ja-JP") : "—"}</td>
                    <td className="invites-meta">{r.closeAt ? new Date(r.closeAt).toLocaleString("ja-JP") : "—"}</td>
                    <td>
                      <span className={`invites-pill invites-pill-${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="invites-url">
                      <code>{url}</code>
                    </td>
                    <td className="invites-actions">
                      <button type="button" className="btn-secondary invites-btn-sm" onClick={() => copy(r.id, r.token)}>
                        {copiedId === r.id ? "コピー済" : "コピー"}
                      </button>
                      <button type="button" className="btn-secondary invites-btn-sm" onClick={() => onRegen(r.id)} disabled={isPending}>
                        URL 再発行
                      </button>
                      <button type="button" className="btn-danger invites-btn-sm" onClick={() => onDelete(r.id)} disabled={isPending}>
                        削除
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
