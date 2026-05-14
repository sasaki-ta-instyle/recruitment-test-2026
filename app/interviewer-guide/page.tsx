import Link from "next/link";
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
      <div className="no-print admin-detail-nav" style={{ marginBottom: 12 }}>
        <Link href="/admin">← 受験者ダッシュボード</Link>
      </div>
      <header style={{ marginBottom: 24 }}>
        <Logo height={14} />
        <h1 style={{ fontSize: "1.625rem", marginTop: 8 }}>採用カルチャーテスト 2026 面接官ガイド</h1>
        <p style={{ fontSize: "0.9375rem", color: "var(--color-text-muted)", marginTop: 8, lineHeight: 1.8 }}>
          v6（イプサティブ評価 4 選択肢 × 4 軸 × 16 タイプ）。Part 1 は性格傾向の自動判定、Part 2 は INSTYLE 思想との接続度の人手採点。
        </p>
      </header>

      {/* Section 1: 採点の基本方針 */}
      <section className="guide-section" id="section-policy">
        <span className="eyebrow">Section 1</span>
        <h2>採点の基本方針</h2>
        <p className="section-desc">
          このテストは「正解探し」ではなく、入社後の働き方・チームへの影響を予測するためのパーソナリティ診断です。
          Part 1 は <b>イプサティブ評価形式（4 選択肢から「最も近い」と「最も遠い」を 1 つずつ選ぶ）</b>で 4 軸の傾向を測り、16 タイプに分類します。
          Part 2 は記述で INSTYLE の思想との接続度を見ます。
        </p>

        <h3>4 軸の意味</h3>
        <ul>
          <li><b>軸 1 — 自他軸（自責 ↔ 他責）：</b>問題が起きたとき「自分の動き」を先に見るか、「外の動き」を先に見るか。</li>
          <li><b>軸 2 — 素直軸（素直 ↔ 素直じゃない）：</b>フィードバックや変化を受け止めて動くか、前提を検証してから動くか。<b>最重要軸</b>。</li>
          <li><b>軸 3 — 貢献軸（貢献あり ↔ 貢献なし）：</b>「自分の成果」より「チームの成果」を先に置けるか。</li>
          <li><b>軸 4 — ポジネガ軸（ポジ ↔ ネガ）：</b>可能性ベースで考えるか、リスクベースで考えるか。職種・役割で活きる場面が異なる。</li>
        </ul>

        <p style={{ background: "var(--color-surface-2)", padding: "12px 16px", borderRadius: "var(--r)", margin: "12px 0", fontSize: "0.875rem", lineHeight: 1.85 }}>
          <b>設計の核：</b>軸名は HR 内部のもの。各設問は <b>2 軸を同時に測る 4 選択肢</b>で構成され、選択肢の位置（A/B/C/D）は受験者ごとにランダムに並び替えられます。
          「最も近い／最も遠い」の<b>イプサティブ評価形式</b>により、社会的望ましさバイアスがかかりにくい設計です。
        </p>

        <h3>採点ロジック（4 ステップ）</h3>
        <ol>
          <li><b>STEP 1 — 傾向スコア集計：</b>「最も近い」で選ばれた選択肢の傾向に <b>+1</b>、「最も遠い」で選ばれた選択肢の傾向に <b>−1</b>。残り 2 つは 0。各傾向は 20 問のうち 10 回登場、−10 〜 +10 点。</li>
          <li><b>STEP 2 — 軸ネット計算：</b>軸ごとに「正の傾向スコア − 負の傾向スコア」。範囲 −20 〜 +20 点。</li>
          <li><b>STEP 3 — 判定区分：</b>軸ネットを 5 区分にマッピング（下表）。</li>
          <li><b>STEP 4 — 16 タイプ特定：</b>各軸の符号で 4 ビット化、16 タイプに分類。中立軸（−4〜+4）は Part 2 で確認。</li>
        </ol>

        <h3>判定区分（5 tier）</h3>
        <table className="guide-table">
          <thead>
            <tr><th>区分</th><th>軸ネット</th><th>意味</th></tr>
          </thead>
          <tbody>
            <tr><td>強い正の傾向</td><td>+10 〜 +20</td><td>正側の傾向が強い</td></tr>
            <tr><td>正の傾向あり</td><td>+5 〜 +9</td><td>正側に少し寄っている</td></tr>
            <tr><td>中立</td><td>−4 〜 +4</td><td>判定保留。Part 2 で重点確認</td></tr>
            <tr><td>負の傾向あり</td><td>−5 〜 −9</td><td>負側に少し寄っている</td></tr>
            <tr><td>強い負の傾向</td><td>−10 〜 −20</td><td>負側の傾向が強い</td></tr>
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
          タイプコードは <b>[自他][素直][貢献][ポジネガ]</b> の 4 ビット。1 = 正の傾向（自責 / 素直 / 貢献あり / ポジ）、0 = 負の傾向。
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
        <p className="section-desc">
          <b>面接時の使い方：</b> Part 2 は「書けたかどうか」より、
          <b>書かれた経験を口頭で深掘りしたときに、自分の言葉で具体的に語れるか</b>を確認するための材料です。
          書面の整い具合より、エピソードの一次情報（誰が・いつ・どこで・何をしたか）が出てくるか、
          解釈と判断が自分の言葉で語れるかを見ます。
          受け答えが薄ければスコアを引き下げる、用意した模範解答の暗誦に見える場合は要観察、というのが原則です。
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

      {/* Section 4: 回答量・時間配分（要約 + リファレンス誘導） */}
      <section className="guide-section" id="section-time">
        <span className="eyebrow">Section 4</span>
        <h2>回答量・時間配分の読み方</h2>
        <p className="section-desc">
          Part 2 は 50 分で 10 問すべて書ききれない想定で組まれており、
          <b>どの問にどれだけ時間を割いたか</b>、<b>どの問が短文か／空欄か</b> という出力配分そのものが
          優先順位の出方や思考の癖を映します。読み方のフレーム（濃淡が極端／均等に薄い／前半厚く後半崩れる…）と
          赤信号パターン（c3 が空欄、c4 が極端に短い 等）の一覧は
          <a href="/recruitment-test-2026/admin/reference#section-time">採点リファレンス</a>
          を参照。
        </p>
        <h3>採点と一緒に記録すべきメタ情報</h3>
        <ul>
          <li><b>文字数：</b>各問の文字数は <code>受験者ダッシュボード</code> から確認。300〜500 字を目安、700 字超は「整理しすぎ／用意した答え」の可能性を疑う。100 字未満は「思考停止／回避」のサイン。</li>
          <li><b>滞在秒数：</b>1 問 30 秒未満で書き終えている場合、用意してきた回答／コピペの疑い。逆に 5 分以上滞在は迷い・葛藤を示唆。</li>
          <li><b>順序効果：</b>後半（c9・c7・c10）で文字数が極端に落ちる候補者は集中力不足、または前半に消耗するタイプ。</li>
        </ul>
      </section>

      {/* Section 5: 判定フロー */}
      <section className="guide-section" id="section-flow">
        <span className="eyebrow">Section 5</span>
        <h2>判定フロー</h2>
        <p className="section-desc">
          テスト結果から最終判定までの動線。<b>NG ゾーン判定は Part 2 を読む前に発動</b>します。
        </p>
        <ol>
          <li>
            <b>Step 1 — Part 1 集計：</b>
            8 つの傾向スコアから 4 軸ネット（−20〜+20）を算出。タイプコード [自他][素直][貢献][ポジネガ] を作る。
          </li>
          <li>
            <b>Step 2 — NG ゾーン判定：</b>
            タイプコードが <code>00**</code> に該当（自他＝0 かつ 素直＝0）なら、貢献・ポジネガを問わず採用見送り。
            Part 2 採点せず終了。
          </li>
          <li>
            <b>Step 3 — 16 タイプ判定 &amp; マッチ強度：</b>
            タイプコードから 16 タイプを確定し、判定（採用推奨◎ / ○ / 育成△ / 要観察△ / 要警戒× / NG×）を決定。
            同時にマッチ強度（強い／明確／中立軸あり／弱い／判定保留）を確認。
          </li>
          <li>
            <b>Step 4 — マッチ強度で分岐：</b>
            <ul>
              <li><b>強いマッチ／明確なマッチ：</b>Part 1 単独で判断可、Part 2 はバックアップとして読む。</li>
              <li><b>中立軸あり以下：</b>Part 2 が判断の主軸。</li>
            </ul>
          </li>
          <li>
            <b>Step 5 — Part 2 通読：</b>採点前に全 10 問の文字量・時間配分を一度俯瞰。回答パターンから印象を取る。
          </li>
          <li>
            <b>Step 6 — Part 2 採点：</b>各問 10 / 7 / 4 / 0 で採点し、100 点満点で集計。0 点が 3 問以上ある場合は別途検討。
          </li>
          <li>
            <b>Step 7 — 総合判定 → 2 次面接：</b>
            16 タイプ × マッチ強度 × Part 2 スコア × 回答配分から、下の Section 6 から質問を 2〜3 問選んで 2 次に進める。
          </li>
        </ol>

        <h3>加点ライン目安（Part 2 スコア）</h3>
        <ul>
          <li><b>70 点以上：</b>核となる思想を理解している。タイプが要観察でも 2 次で確認する価値あり。</li>
          <li><b>40〜69 点：</b>要観察。タイプが採用推奨○以上なら 2 次必須、要観察△以下ならタイプ次第。</li>
          <li><b>40 点未満：</b>思想接続が薄い。タイプが採用推奨◎でも 2 次で深掘りが必要。</li>
        </ul>

        <h3>マッチ強度 × Part 2 の使い分け</h3>
        <ul>
          <li><b>強い／明確なマッチ：</b>Part 1 単独で採用判断の主軸。Part 2 は思想接続の確認役。</li>
          <li><b>中立軸あり：</b>中立になった軸（例：貢献軸が中立）について、Part 2 c3（貢献コミット）等で確認。</li>
          <li><b>弱いマッチ・判定保留：</b>Part 2 が判断の主軸。Part 1 はあくまで「傾向の見立て」レベル。</li>
        </ul>
      </section>

      {/* Section 6: タイプ別 2 次面接質問集 */}
      <section className="guide-section" id="section-types">
        <span className="eyebrow">Section 6</span>
        <h2>タイプ別 2 次面接質問集</h2>
        <p className="section-desc">
          1 次テスト結果からタイプ別に深掘りすべき質問を 5 問ずつ用意しました。
          1 次の懸念点を踏まえて <b>2〜3 問を選んで</b> 2 次面接で使ってください。
        </p>

        <h3>⑧ 理想の体現者（111）／ レア</h3>
        <ol>
          <li>これまでのキャリアで最大の失敗は何でしたか。そのとき、自分の中で何が足りなかったと整理しましたか。</li>
          <li>「やりたいこと」と「チームに必要なこと」がズレたとき、最近どちらを選びましたか。理由も教えてください。</li>
          <li>自分の弱みを公式の場で言われたとき、最初に頭をよぎることは何ですか。</li>
          <li>周囲が止まっている場面で、自分が動いた経験はありますか。何を考えて動きましたか。</li>
          <li>これからの 5 年で、最も伸ばしたい力は何ですか。そのために具体的に何をしていますか。</li>
        </ol>

        <h3>⑦ コア人材（110）／ 採用推奨◎</h3>
        <ol>
          <li>自分が「貢献できた」と思える瞬間を具体的に教えてください。</li>
          <li>チームの誰かが困っているのに、自分の仕事が手一杯だったとき、どうしましたか。</li>
          <li>自分の領域を越えて動いた経験はありますか。</li>
          <li>5 年後、チームの中であなたはどんな存在でいたいですか。</li>
          <li>これまで指摘されて「これは取り入れて変えた」というフィードバックは何ですか。</li>
        </ol>

        <h3>⑥ 誠実な貢献者（101）／ 採用推奨（条件付き）</h3>
        <ol>
          <li>直近で「素直になれなかった」場面はどんなときでしたか。</li>
          <li>自分のやり方を否定されたとき、最初に何を考えますか。</li>
          <li>自分の貢献意識はどこから来ていると思いますか。</li>
          <li>過去にチームと衝突した経験はありますか。どう着地させましたか。</li>
          <li>「自分が正しい」と思っていたことが間違っていたと気づいた経験を教えてください。</li>
        </ol>

        <h3>⑤ 堅実な成長型（100）／ 採用推奨（条件付き）</h3>
        <ol>
          <li>これまで一番熱心に取り組んできたことは何ですか。</li>
          <li>フィードバックを受けたとき、頭で納得するまでにどのくらい時間がかかりますか。</li>
          <li>自分の領域を越えて他人を助けた経験はありますか。</li>
          <li>チームの中での自分の役割をどう捉えていますか。</li>
          <li>「人に頼る」ということについて、どう考えますか。</li>
        </ol>

        <h3>④ 熱量型（011）／ 要観察（A）採用に近い</h3>
        <ol>
          <li>うまくいかなかったとき、自分の中に原因を探したことはありますか。</li>
          <li>直近で「これは自分の責任だな」と腹落ちした失敗はありますか。</li>
          <li>「環境のせい」と感じる場面で、自分が動いた経験はありますか。</li>
          <li>自分の判断・行動を冷静に見直す習慣はありますか。</li>
          <li>INSTYLE の「自責」の文化をどう受け止めましたか。</li>
        </ol>

        <h3>③ 明るい他責型（010）／ 要観察（B）</h3>
        <ol>
          <li>「自分が原因だった」と認めた直近の経験を教えてください。</li>
          <li>うまくいかない場面で、最初に思い浮かぶのは何ですか。</li>
          <li>自分から動くことが少ない場面はどんなときですか。</li>
          <li>チームの成果が出ないとき、自分は何をしますか。</li>
          <li>「他人のせいにしてしまった」と気づいた経験はありますか。</li>
        </ol>

        <h3>② 有能な厄介者（001）／ NG（副軸問わず）</h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          2 次面接は実施しない前提。判定確認のみ。
        </p>

        <h3>① フリーライダー（000）／ NG</h3>
        <p style={{ fontSize: "0.8125rem", color: "var(--color-text-muted)" }}>
          2 次面接は実施しない。
        </p>
      </section>

      <footer style={{ marginTop: 32, padding: 16, fontSize: "0.8125rem", color: "var(--color-text-muted)", textAlign: "center" }} className="no-print">
        <p>
          採点シートは <a href="/recruitment-test-2026/admin">受験者ダッシュボード</a>
          → 各受験者の詳細ページに統合されています。「面接官メモ ／ 採点シート」セクションに
          面接担当と所見を入力でき、「印刷 / PDF」ボタンから採点シート相当の A4 PDF を出力できます。
        </p>
      </footer>
    </main>
  );
}
