import { TYPE_MAP, VERDICT_LABEL } from "@/lib/scoring";
import { Logo } from "@/app/_components/Logo";

export const metadata = {
  title: "面接官ガイド | INSTYLE GROUP 採用カルチャーテスト 2026",
  robots: { index: false, follow: false },
};

const TYPE_ORDER = [
  "1111", "1110", "1101", "1100",
  "1011", "1010", "1001", "1000",
  "0111", "0110", "0101", "0100",
  "0011", "0010", "0001", "0000",
];

export default function InterviewerGuidePage() {
  return (
    <main className="wide-shell">
      <header style={{ marginBottom: 24 }}>
        <Logo height={14} />
        <h1 style={{ fontSize: "1.625rem", marginTop: 8 }}>採用カルチャーテスト 2026 面接官ガイド</h1>
        <p style={{ fontSize: "0.9375rem", color: "var(--color-text-muted)", marginTop: 8, lineHeight: 1.8 }}>
          v6（ipsative 4 選択肢 × 4 軸 × 16 タイプ）。Part 1 は性格傾向の自動判定、Part 2 は INSTYLE 思想との接続度の人手採点。
        </p>
      </header>

      {/* Section 1: 採点の基本方針 */}
      <section className="guide-section" id="section-policy">
        <span className="eyebrow">Section 1</span>
        <h2>採点の基本方針</h2>
        <p className="section-desc">
          このテストは「正解探し」ではなく、入社後の働き方・チームへの影響を予測するためのパーソナリティ診断です。
          Part 1 は <b>ipsative 形式（4 選択肢から「最も近い」と「最も遠い」を 1 つずつ選ぶ）</b>で 4 軸の傾向を測り、16 タイプに分類します。
          Part 2 は記述で INSTYLE の思想との接続度を見ます。
        </p>

        <h3>4 軸の意味</h3>
        <ul>
          <li><b>軸 1 — 自他軸（自責 ↔ 他責）：</b>問題が起きたとき「自分の動き」を先に見るか、「外の動き」を先に見るか。</li>
          <li><b>軸 2 — 素直軸（素直 ↔ 素直じゃない）：</b>フィードバックや変化を受け止めて動くか、前提を検証してから動くか。<b>最重要軸</b>。</li>
          <li><b>軸 3 — 貢献軸（貢献あり ↔ 貢献なし）：</b>「自分の成果」より「チームの成果」を先に置けるか。</li>
          <li><b>軸 4 — ポジネガ軸（ポジ ↔ ネガ）：</b>可能性ベースで考えるか、リスクベースで考えるか。職種・役割で活きる場面が異なる。</li>
        </ul>

        <h3>採点ロジック（4 ステップ）</h3>
        <ol>
          <li><b>STEP 1 — 極スコア集計：</b>「最も近い」で選ばれた選択肢の極に <b>+1</b>、「最も遠い」で選ばれた選択肢の極に <b>−1</b>。残り 2 つは 0。各極は 20 問のうち 10 回登場、−10 〜 +10 点。</li>
          <li><b>STEP 2 — 軸ネット計算：</b>軸ごとに「正極スコア − 負極スコア」。範囲 −20 〜 +20 点。</li>
          <li><b>STEP 3 — 判定区分：</b>軸ネットを 5 区分にマッピング（下表）。</li>
          <li><b>STEP 4 — 16 タイプ特定：</b>各軸の符号で 4 ビット化、16 タイプに分類。中立軸（−4〜+4）は Part 2 で確認。</li>
        </ol>

        <h3>判定区分（5 tier）</h3>
        <table className="guide-table">
          <thead>
            <tr><th>区分</th><th>軸ネット</th><th>意味</th></tr>
          </thead>
          <tbody>
            <tr><td>強い正極</td><td>+10 〜 +20</td><td>正極の傾向が強い</td></tr>
            <tr><td>正極寄り</td><td>+5 〜 +9</td><td>正極寄りの傾向あり</td></tr>
            <tr><td>中立</td><td>−4 〜 +4</td><td>判定保留。Part 2 で重点確認</td></tr>
            <tr><td>負極寄り</td><td>−5 〜 −9</td><td>負極寄りの傾向あり</td></tr>
            <tr><td>強い負極</td><td>−10 〜 −20</td><td>負極の傾向が強い</td></tr>
          </tbody>
        </table>

        <h3>マッチ強度（Part 1 結果の信頼度）</h3>
        <ul>
          <li><b>強いマッチ：</b>4 軸すべて ±10 以上。Part 1 単独で採用判断に使える。</li>
          <li><b>明確なマッチ：</b>4 軸すべて ±5 以上（中立なし）。Part 1 単独で判断の基礎に使える。</li>
          <li><b>中立軸あり：</b>1 軸が中立。その軸は Part 2 で確認。</li>
          <li><b>弱いマッチ：</b>2 軸が中立。Part 2 で重点的に確認が必要。</li>
          <li><b>判定保留：</b>3〜4 軸が中立。Part 1 単独では判定困難。Part 2 が判断の主軸。</li>
        </ul>
        <p style={{ background: "var(--color-surface-2)", padding: "12px 16px", borderRadius: "var(--r)", margin: "12px 0" }}>
          <b>運用の原則：</b>Part 1 単独で採用判断に使えるのは「強いマッチ」「明確なマッチ」のみ。中立軸が 1 つでもある場合は Part 2 を必ず通して総合判断。
          Part 1 の役割は<b>「クリアな合格枠とクリアな NG 枠を切り出す装置」</b>。
        </p>

        <h3>絶対 NG ルール</h3>
        <p style={{ background: "rgba(181, 70, 43, 0.10)", color: "var(--color-error)", padding: "12px 16px", borderRadius: "var(--r)", margin: "12px 0" }}>
          <b>NG ゾーン：</b>16 タイプの「自他＝− × 素直＝−」象限（00**：0000・0001・0010・0011）は採用見送り。
          問題が起きたとき外に原因を求め、指摘も受け取れず、組織への影響が最大化する組み合わせ。
        </p>

        <h3>採点プロセス（推奨手順）</h3>
        <ol>
          <li>結果画面で <b>16 タイプ判定／4 軸スコア／マッチ強度</b> を確認。</li>
          <li>NG ゾーン（00**）に入っていないかを最優先で確認。入っていればここで判定終了。</li>
          <li>マッチ強度を見る。「強い／明確」なら Part 1 のみで判断可、それ以外は Part 2 を通す。</li>
          <li>Part 2 の <b>回答量・時間配分</b>（各問の文字数と滞在秒数）を一度通読し、全体像をつかむ。</li>
          <li>Part 2 を各問 10 / 7 / 4 / 0 で採点し、100 点満点で集計。</li>
          <li>16 タイプ判定と Part 2 スコアを組み合わせて最終所見。</li>
        </ol>
      </section>

      {/* Section 2: 判定マトリクス */}
      <section className="guide-section" id="section-matrix">
        <span className="eyebrow">Section 2</span>
        <h2>判定マトリクス（16 タイプ俯瞰）</h2>
        <p className="section-desc">
          タイプコードは <b>[自他][素直][貢献][ポジネガ]</b> の 4 ビット。1 = 正極（自責 / 素直 / 貢献あり / ポジ）、0 = 負極。
        </p>
        <table className="guide-table">
          <thead>
            <tr>
              <th>コード</th>
              <th>タイプ名</th>
              <th>判定</th>
              <th>説明</th>
            </tr>
          </thead>
          <tbody>
            {TYPE_ORDER.map((key) => {
              const t = TYPE_MAP[key];
              return (
                <tr key={key}>
                  <td style={{ fontFamily: "var(--font-display)", fontWeight: 700 }}>{key}</td>
                  <td>{t.name}</td>
                  <td>
                    <span className={`verdict-badge verdict-${t.verdict}`} style={{ marginTop: 0 }}>
                      {VERDICT_LABEL[t.verdict]}
                    </span>
                  </td>
                  <td style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>{t.desc}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      {/* Section 3: Part 2 採点基準 */}
      <section className="guide-section" id="section-part2">
        <span className="eyebrow">Section 3</span>
        <h2>Part 2 採点基準（記述 10 問）</h2>
        <p className="section-desc">
          各問 10 点満点で 4 段階：<b>10（思想接続済み）／7（理解あり）／4（理解浅い）／0（不適合・無回答）</b>。
          10 問合計 100 点。Part 1 の判定と組み合わせて最終所見を出す。
        </p>
        <table className="guide-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>テーマ</th>
              <th>採点の観点</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>c1</td><td>働き方の理解</td><td>「責任の取れる範囲が自由の範囲」を自分の経験と接続できているか</td></tr>
            <tr><td>c2</td><td>オープンコミュニケーションの覚悟</td><td>言いにくいことを公式の場で伝えた具体的経験があるか、入社後も保てる自信があるか</td></tr>
            <tr><td>c5</td><td>オープンコミュニケーションへの約束</td><td>陰口でなく公式の場で言うことを、自分にとって難易度評価できているか</td></tr>
            <tr><td>c4</td><td>INSTYLE GROUP との違和感</td><td>違和感を率直に出せているか／違和感ゼロは思考停止サインなので注意</td></tr>
            <tr><td>c8</td><td>仕事とお金の順番</td><td>お金とやりがいの順番について自分の言葉で語れるか</td></tr>
            <tr><td>c3</td><td>貢献へのコミット</td><td>「自分の成果」ではなく「チームへの貢献」を具体的に描けるか</td></tr>
            <tr><td>c9</td><td>フリーライダーへの向き合い方</td><td>「自分ばかり損」と感じたときの動き方が、INSTYLE 文化と整合するか</td></tr>
            <tr><td>c7</td><td>学ぶ姿勢</td><td>月の読書冊数、最近の本の内容と感想で学習習慣を確認</td></tr>
            <tr><td>c10</td><td>5年後へのコミット</td><td>未来から逆算する習慣、日々の行動への落とし込みがあるか</td></tr>
            <tr><td>c6</td><td>ネガ・ポジ傾向</td><td>「いい一日」の捉え方からポジ/ネガの素のバイアスを確認</td></tr>
          </tbody>
        </table>
      </section>

      {/* Section 4: 回答量・時間配分 */}
      <section className="guide-section" id="section-time">
        <span className="eyebrow">Section 4</span>
        <h2>回答量・時間配分の読み方</h2>
        <h3>読み方のフレーム</h3>
        <ul>
          <li><b>文字数：</b>Part 2 の各問の文字数は <code>受験者ダッシュボード</code> から確認。300〜500 字を目安、700 字超は「整理しすぎ／用意した答え」の可能性を疑う。100 字未満は「思考停止／回避」のサイン。</li>
          <li><b>滞在秒数：</b>1 問 30 秒未満で書き終えている場合、用意してきた回答／コピペの疑い。逆に 5 分以上滞在は迷い・葛藤を示唆。</li>
          <li><b>順序効果：</b>後半（c9・c7・c10）で文字数が極端に落ちる候補者は集中力不足、または前半に消耗するタイプ。</li>
        </ul>
        <h3>特定のパターン</h3>
        <ul>
          <li><b>「全問同じ書き口」：</b>テンプレ的に書いている。思想接続が浅い可能性。</li>
          <li><b>「c4 違和感ゼロ」：</b>違和感ゼロは思考停止サイン。具体例なしの「全部納得です」は減点。</li>
          <li><b>「c2 経験ゼロ」：</b>言いにくいことを伝えた経験が一切ないのは、文化フィット観点で弱い。</li>
        </ul>
      </section>

      {/* Section 5: 採点シート（印刷可） */}
      <section className="guide-section" id="section-sheet">
        <span className="eyebrow">Section 5</span>
        <h2>採点シート（印刷可）</h2>
        <p className="section-desc">
          紙面で採点する場合の記入フォーム。ブラウザの印刷機能（Cmd+P / Ctrl+P）で A4 1 枚に収まるよう調整済み。
        </p>
        <table className="guide-table">
          <tbody>
            <tr><td style={{ width: "30%" }}>候補者氏名</td><td style={{ height: 36 }}></td></tr>
            <tr><td>受験日時</td><td style={{ height: 36 }}></td></tr>
            <tr><td>16 タイプ判定</td><td style={{ height: 36 }}></td></tr>
            <tr><td>4 軸スコア</td><td style={{ height: 36 }}>自他＿＿ / 素直＿＿ / 貢献＿＿ / ポジネガ＿＿</td></tr>
            <tr><td>マッチ強度</td><td style={{ height: 36 }}>強い / 明確 / 中立軸あり / 弱い / 判定保留</td></tr>
            <tr><td>絶対 NG 判定</td><td style={{ height: 36 }}>該当 / 非該当</td></tr>
            <tr><td>Part 2 合計（100 点満点）</td><td style={{ height: 36 }}></td></tr>
            <tr><td>所見・メモ</td><td style={{ height: 96 }}></td></tr>
            <tr><td>面接担当</td><td style={{ height: 36 }}></td></tr>
          </tbody>
        </table>
      </section>

      <footer style={{ marginTop: 32, padding: 16, fontSize: "0.8125rem", color: "var(--color-text-muted)", textAlign: "center" }} className="no-print">
        <p>受験者の生データは <a href="/recruitment-test-2026/admin">受験者ダッシュボード</a> から確認できます。</p>
      </footer>
    </main>
  );
}
