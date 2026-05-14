"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      className="admin-link"
      onClick={() => window.print()}
      aria-label="このページを印刷または PDF に保存"
    >
      印刷 / PDF
    </button>
  );
}
