"use client";

import { useState } from "react";

/**
 * CSV ダウンロードは <a href download> だと Safari / iOS が Basic 認証
 * ヘッダーを送らず 401 の HTML レスポンスをそのまま保存してしまう
 * （ファイル名が "export.html" になる）ため、fetch + Blob で明示的に
 * クレデンシャルを送って受け取り、Blob URL から download をトリガする。
 */
export function CsvDownloadButton({ count }: { count: number }) {
  const [busy, setBusy] = useState(false);

  async function onClick() {
    if (busy) return;
    setBusy(true);
    try {
      const res = await fetch("/recruitment-test-2026/api/admin/export.csv", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        alert(`CSV のダウンロードに失敗しました（${res.status}）。ページを再読み込みしてもう一度お試しください。`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const disposition = res.headers.get("Content-Disposition") || "";
      const m = disposition.match(/filename="([^"]+)"/);
      a.download =
        m?.[1] ||
        `recruitment-test-2026_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Safari がダウンロードを開始する前に revoke すると壊れるため少し遅らせる
      setTimeout(() => URL.revokeObjectURL(url), 1500);
    } catch (e) {
      alert(`CSV のダウンロードに失敗しました：${(e as Error).message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      className="admin-link"
      onClick={onClick}
      disabled={busy}
    >
      {busy ? "ダウンロード中…" : `CSV ダウンロード（${count} 件）`}
    </button>
  );
}
