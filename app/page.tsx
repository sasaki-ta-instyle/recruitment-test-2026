import Link from "next/link";

export default function HomePage() {
  return (
    <main className="app-shell">
      <div className="landing">
        <span className="eyebrow">INSTYLE GROUP</span>
        <h1 className="landing-title">採用カルチャーテスト 2026</h1>
        <p className="landing-sub">
          INSTYLE GROUP の働き方・価値観への適合度を測定する 60 分のテストです。
          受験者の方は「テストを開始する」へ。面接官・採用担当の方は専用ガイドへどうぞ。
        </p>
        <div className="landing-cta">
          <Link href="/test" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
            テストを開始する
          </Link>
          <Link href="/interviewer-guide" className="btn-secondary" style={{ textAlign: "center", textDecoration: "none" }}>
            面接官ガイド（要認証）
          </Link>
        </div>
      </div>
    </main>
  );
}
