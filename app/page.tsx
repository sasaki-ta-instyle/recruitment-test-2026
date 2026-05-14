import Link from "next/link";
import { Logo } from "@/app/_components/Logo";

export default function HomePage() {
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
          <Link href="/test" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
            テストを開始する
          </Link>
        </div>
      </div>
    </main>
  );
}
