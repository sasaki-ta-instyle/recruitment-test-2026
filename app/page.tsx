import { Logo } from "@/app/_components/Logo";
import { WindowGate } from "@/app/_components/WindowGate";
import { getTestWindowSnapshot } from "@/lib/testWindow";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const snap = await getTestWindowSnapshot();

  return (
    <main className="app-shell">
      <div className="landing">
        <Logo className="landing-logo" height={16} />
        <h1 className="landing-title">採用カルチャーテスト 2026</h1>
        <p className="landing-sub">
          INSTYLE GROUP の働き方・価値観への適合度を測定する 60 分のテストです。
          下のボタンからテストを開始してください。
        </p>
        <div className="landing-cta">
          <WindowGate
            status={snap.status}
            openAt={snap.openAt}
            closeAt={snap.closeAt}
            message={snap.message}
            serverNowMs={snap.nowMs}
          />
        </div>
      </div>
    </main>
  );
}
