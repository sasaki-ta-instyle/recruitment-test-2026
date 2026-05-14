import Link from "next/link";
import { getTestWindowSnapshot } from "@/lib/testWindow";
import { getInviteSnapshot } from "@/lib/inviteToken";
import { Logo } from "@/app/_components/Logo";
import TestApp from "./TestApp";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ t?: string }>;

function ClosedLanding({
  status,
  fromToken = false,
}: {
  status: "before" | "after" | "closed" | "used" | "notfound";
  fromToken?: boolean;
}) {
  const message: Record<typeof status, string> = {
    before: "テストの開始時刻になっていません。担当者からの案内をお待ちください。",
    after: "テストの受験時間は終了しました。担当者にご連絡ください。",
    closed: "現在このテストはクローズされています。担当者からの案内をお待ちください。",
    used: "この URL のテストは既に提出済みです。受験は 1 回のみです。",
    notfound: "この URL は無効です。担当者からの案内をお待ちください。",
  };

  return (
    <main className="app-shell">
      <div className="landing">
        <Logo className="landing-logo" height={16} />
        <h1 className="landing-title">採用カルチャーテスト 2026</h1>
        <p className="landing-sub">{message[status]}</p>
        {!fromToken && (
          <div className="landing-cta">
            <Link
              href="/"
              className="btn-secondary"
              style={{ textAlign: "center", textDecoration: "none" }}
            >
              トップへ戻る
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}

export default async function TestPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const token = sp.t;

  // ── token 指定があれば個別 invite を解決（全体設定より優先）
  if (token) {
    const invite = await getInviteSnapshot(token);
    if (!invite) return <ClosedLanding status="notfound" fromToken />;
    if (invite.status !== "open") return <ClosedLanding status={invite.status} fromToken />;
    return (
      <TestApp
        closeAtIso={invite.closeAt}
        serverNowMs={invite.nowMs}
        inviteToken={invite.token}
        prefilledName={invite.label}
      />
    );
  }

  // ── 通常の全体ウィンドウ
  const snap = await getTestWindowSnapshot();
  if (snap.status !== "open") return <ClosedLanding status={snap.status} />;
  return <TestApp closeAtIso={snap.closeAt} serverNowMs={snap.nowMs} />;
}
