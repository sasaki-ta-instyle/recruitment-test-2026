import Link from "next/link";
import { getTestWindowSnapshot } from "@/lib/testWindow";
import { SettingsForm } from "./SettingsForm";

export const dynamic = "force-dynamic";
export const metadata = {
  title: "受験設定 | INSTYLE GROUP 採用カルチャーテスト",
  robots: { index: false, follow: false },
};

const STATUS_LABEL: Record<string, string> = {
  before: "開始前（カウントダウン中）",
  open: "受験可能",
  after: "終了",
  closed: "クローズ（未設定）",
};

export default async function AdminSettingsPage() {
  const snap = await getTestWindowSnapshot();

  return (
    <main className="wide-shell">
      <div className="no-print admin-detail-nav" style={{ marginBottom: 12 }}>
        <Link href="/admin">← 受験者ダッシュボード</Link>
      </div>

      <header className="admin-detail-header">
        <span className="eyebrow">設定</span>
        <h1 className="admin-detail-name">受験時間の管理</h1>
        <p className="admin-detail-meta">
          「テストを開始する」ボタンを有効化する期間を設定します。設定がない・期間外のときは
          トップページから受験を開始できません。終了時刻に到達した場合、進行中の受験は
          その時点までの回答で自動提出されます。
        </p>
      </header>

      <section className="admin-card">
        <h2 className="admin-section-title">現在の状態</h2>
        <p>
          <strong>{STATUS_LABEL[snap.status]}</strong>
          {snap.openAt && (
            <>
              <br />開始: {new Date(snap.openAt).toLocaleString("ja-JP")}
            </>
          )}
          {snap.closeAt && (
            <>
              <br />終了: {new Date(snap.closeAt).toLocaleString("ja-JP")}
            </>
          )}
        </p>
      </section>

      <section className="admin-card">
        <h2 className="admin-section-title">受験時間の設定</h2>
        <SettingsForm
          openAtIso={snap.openAt}
          closeAtIso={snap.closeAt}
          message={snap.message}
        />
      </section>
    </main>
  );
}
