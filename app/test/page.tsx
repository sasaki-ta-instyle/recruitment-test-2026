import Link from "next/link";
import { getTestWindowSnapshot } from "@/lib/testWindow";
import { Logo } from "@/app/_components/Logo";
import TestApp from "./TestApp";

export const dynamic = "force-dynamic";

export default async function TestPage() {
  const snap = await getTestWindowSnapshot();

  if (snap.status !== "open") {
    return (
      <main className="app-shell">
        <div className="landing">
          <Logo className="landing-logo" height={16} />
          <h1 className="landing-title">採用カルチャーテスト 2026</h1>
          <p className="landing-sub">
            {snap.status === "before" &&
              "テストの開始時刻になっていません。トップページからお戻りください。"}
            {snap.status === "after" &&
              "テストの受験時間は終了しました。担当者にご連絡ください。"}
            {snap.status === "closed" &&
              "現在このテストはクローズされています。担当者からの案内をお待ちください。"}
          </p>
          <div className="landing-cta">
            <Link
              href="/"
              className="btn-secondary"
              style={{ textAlign: "center", textDecoration: "none" }}
            >
              トップへ戻る
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return <TestApp closeAtIso={snap.closeAt} serverNowMs={snap.nowMs} />;
}
