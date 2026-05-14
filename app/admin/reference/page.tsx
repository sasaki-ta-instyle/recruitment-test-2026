import Link from "next/link";
import { PART1, PART2 } from "@/lib/questions";
import {
  AXIS_LABELS,
  AXIS_NAMES,
  MATCH_LABEL,
  TYPE_MAP,
  VERDICT_LABEL,
  type MatchStrength,
  type Verdict,
} from "@/lib/scoring";

export const dynamic = "force-static";

const PART2_RUBRIC: Array<{ score: number; label: string; desc: string }> = [
  {
    score: 10,
    label: "強い適合",
    desc: "問いの本質を理解し、自分の経験や視点で具体的に語れている。INSTYLE の価値観と矛盾しない。",
  },
  {
    score: 7,
    label: "適合",
    desc: "概ね問いに答えており、姿勢として違和感はない。具体性はやや薄いがフォローアップで深掘れる。",
  },
  {
    score: 4,
    label: "要観察",
    desc: "問いの意図を取り違えている／一般論で逃げている／INSTYLE の前提と部分的にズレている。面接で要確認。",
  },
  {
    score: 0,
    label: "不適合",
    desc: "問いに答えていない、白紙に近い、または INSTYLE の価値観と明らかに対立する。NG 判定の論拠となる。",
  },
];

export default function AdminReferencePage() {
  const bitsKeys = Object.keys(TYPE_MAP).sort().reverse();

  return (
    <main className="wide-shell">
      <p className="no-print" style={{ marginBottom: 12 }}>
        <Link href="/admin">← 一覧に戻る</Link>
      </p>

      <header style={{ marginBottom: 24 }}>
        <span className="eyebrow">採点リファレンス</span>
        <h1 style={{ fontSize: "1.5rem", marginTop: 6 }}>
          INSTYLE GROUP カルチャーテスト 2026 — 採点リファレンス
        </h1>
        <p className="ref-lead">
          Part 1（イプサティブ評価）の設問と極、4 軸ネット→16 タイプ判定、マッチ強度、Part 2（記述）の採点ルーブリックをまとめたリファレンスです。
          面接前に印刷して持ち込むことを想定しています。
        </p>
      </header>

      <section className="admin-card">
        <h2 className="ref-h2">Part 1 設問</h2>
        <p className="ref-desc">
          各設問は 4 つの選択肢（A〜D）から「最も近い」を +1、「最も遠い」を −1 とするイプサティブ評価形式。
          各選択肢は 8 つの極のいずれかに割り当てられている。
        </p>
        <table className="admin-table ref-table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>#</th>
              <th style={{ width: 140 }}>軸</th>
              <th>設問</th>
              <th>A</th>
              <th>B</th>
              <th>C</th>
              <th>D</th>
            </tr>
          </thead>
          <tbody>
            {PART1.map((q, i) => (
              <tr key={q.id}>
                <td className="ref-q-no">Q{String(i + 1).padStart(2, "0")}</td>
                <td className="ref-axes">{q.axes}</td>
                <td className="ref-q-text">{q.text}</td>
                {q.options.map((opt, j) => (
                  <td key={j} className="ref-opt">
                    <div>{opt.text}</div>
                    <div className="ref-pole">［{opt.pole}］</div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2 className="ref-h2">採点ロジック</h2>
        <ol className="ref-steps">
          <li>
            <strong>STEP 1：極カウント</strong> — 各設問で「最も近い」を選んだ極に +1、「最も遠い」を選んだ極に −1。20 問通して 8 極のカウントを集計する。
          </li>
          <li>
            <strong>STEP 2：4 軸ネット</strong> — 対極ペアの差分。
            <ul className="ref-ul">
              {AXIS_NAMES.map((name, i) => (
                <li key={i}>
                  <span className="ref-axis-name">{name}</span> ＝ {AXIS_LABELS[i][1]} − {AXIS_LABELS[i][0]}
                </li>
              ))}
            </ul>
            （理論上のレンジは −20 〜 +20。実際は ±15 前後に収まることが多い。）
          </li>
          <li>
            <strong>STEP 3：軸ティア判定</strong>
            <ul className="ref-ul">
              <li>+10 以上：強い正極</li>
              <li>+5〜+9：正極寄り</li>
              <li>−4〜+4：中立</li>
              <li>−5〜−9：負極寄り</li>
              <li>−10 以下：強い負極</li>
            </ul>
          </li>
          <li>
            <strong>STEP 4：16 タイプ判定</strong> — 各軸の符号（正＝1／負＝0）を 4 桁ビットにし、下表で型名と判定を引く。
          </li>
          <li>
            <strong>STEP 5：マッチ強度</strong> — 中立軸の数と ±10 到達数でクリアさを 5 段階に分類する。
          </li>
          <li>
            <strong>絶対 NG ルール</strong> — 自他軸 × 素直軸の両方が負側のとき、自動的に「絶対 NG 該当」フラグを立てる。
          </li>
        </ol>
      </section>

      <section className="admin-card">
        <h2 className="ref-h2">16 タイプ判定表</h2>
        <p className="ref-desc">
          ビット列の順序は <strong>自他 / 素直 / 貢献 / ポジネガ</strong>（1＝正極、0＝負極）。
        </p>
        <table className="admin-table ref-table">
          <thead>
            <tr>
              <th style={{ width: 80 }}>ビット</th>
              <th style={{ width: 200 }}>タイプ名</th>
              <th style={{ width: 110 }}>判定</th>
              <th>説明</th>
            </tr>
          </thead>
          <tbody>
            {bitsKeys.map((bits) => {
              const t = TYPE_MAP[bits];
              return (
                <tr key={bits}>
                  <td className="ref-bits">{bits}</td>
                  <td className="ref-type-name">{t.name}</td>
                  <td>
                    <span className={`verdict-badge verdict-${t.verdict}`} style={{ marginTop: 0 }}>
                      {VERDICT_LABEL[t.verdict as Verdict]}
                    </span>
                  </td>
                  <td className="ref-type-desc">{t.desc}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2 className="ref-h2">マッチ強度</h2>
        <table className="admin-table ref-table">
          <thead>
            <tr>
              <th style={{ width: 140 }}>強度</th>
              <th>条件と意味</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(MATCH_LABEL) as MatchStrength[]).map((k) => (
              <tr key={k}>
                <td className="ref-match">{MATCH_LABEL[k].label}</td>
                <td className="ref-type-desc">{MATCH_LABEL[k].desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2 className="ref-h2">Part 2 採点ルーブリック</h2>
        <p className="ref-desc">
          記述 10 問を 1 問あたり 10/7/4/0 点で採点（最大 100 点）。面接官が候補者詳細画面で選択した値が DB に保存される。
        </p>
        <table className="admin-table ref-table">
          <thead>
            <tr>
              <th style={{ width: 64 }}>点</th>
              <th style={{ width: 120 }}>区分</th>
              <th>判定基準</th>
            </tr>
          </thead>
          <tbody>
            {PART2_RUBRIC.map((r) => (
              <tr key={r.score}>
                <td className="ref-score-cell">{r.score}</td>
                <td className="ref-match">{r.label}</td>
                <td className="ref-type-desc">{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <h3 className="ref-h3">設問一覧</h3>
        <table className="admin-table ref-table">
          <thead>
            <tr>
              <th style={{ width: 56 }}>ID</th>
              <th style={{ width: 160 }}>テーマ</th>
              <th>設問</th>
            </tr>
          </thead>
          <tbody>
            {PART2.map((q) => (
              <tr key={q.id}>
                <td className="ref-q-no">{q.id}</td>
                <td className="ref-axes">{q.theme}</td>
                <td className="ref-q-text">{q.text}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-card" id="section-time">
        <h2 className="ref-h2">Part 2 回答量・時間配分の読み方</h2>
        <p className="ref-desc">
          Part 2 は 50 分で 10 問すべて書ききれない想定で組まれています。文字数の指定もありません。
          どの問にどれだけ時間を割いたか、どの問が短文か／空欄か、その出力配分そのものが
          「優先順位の出方」「思考の癖」を映します。
        </p>

        <h3 className="ref-h3">読み方のフレーム</h3>
        <ul className="ref-steps" style={{ paddingLeft: 22 }}>
          <li>
            <strong>濃淡が極端な人：</strong>1〜2 問だけに長文を書き、残りはほぼ空欄。
            → 興味と無関心の差が大きい人。価値観の優先順位が明快なタイプ。
          </li>
          <li>
            <strong>均等に薄い人：</strong>全問とも同じくらいの長さで表面的。
            → 「全部答えなければ」というプレッシャー優先。深掘りを避ける癖がある可能性。
          </li>
          <li>
            <strong>前半に厚く、後半が崩れる人：</strong>時間配分が下手だが、最初の問題には誠実に向き合っている。改善で伸びる可能性。
          </li>
          <li>
            <strong>後半に時間を残し、最後の Q10 まで丁寧な人：</strong>全体を見て配分できる人。ペース感覚と俯瞰力がある。
          </li>
          <li>
            <strong>長く書いているが薄い人：</strong>表面の言葉が多く、自分の経験や具体例に降りていない。建前・AI・テンプレを疑う。
          </li>
          <li>
            <strong>短くても刺さる人：</strong>1 段落で本質を捉える人。これは高評価。文字量と評価点は別。
          </li>
        </ul>

        <h3 className="ref-h3">赤信号パターン</h3>
        <ul className="ref-steps" style={{ paddingLeft: 22 }}>
          <li>
            <strong>c1〜c5（オープンコミュニケーション系）まで時間を使い、c3・c9・c10 がほぼ空欄。</strong>
            → 表面的に企業文化に寄せる作業を優先しており、「自分ごと」（貢献・5 年後）を後回しにする傾向。
          </li>
          <li>
            <strong>c3（貢献）が極端に短い／空欄。</strong>→ 貢献軸の自覚が薄い決定打になり得る。
          </li>
          <li>
            <strong>c7（読書）が短く、c10（5 年後）も短い。</strong>→ 学習・成長への投資意識が低い可能性。
          </li>
          <li>
            <strong>c4（違和感）の文字数が他と比べて極端に短い。</strong>→ 違和感を言語化できない＝自己認識が浅い。
          </li>
        </ul>

        <h3 className="ref-h3">採点シートへの記録</h3>
        <p className="ref-desc">
          受験者詳細の「面接官メモ」や設問ごとのコメント欄に、各設問の点数に加えて
          <strong>所要時間と文字数の所感</strong>を 1 行ずつ書き残すと、2 次面接の話題の起点になります。
          例：「c3 が 30 秒・空欄」「c10 に 12 分かけて 800 字」のような事実を残す。
        </p>
      </section>
    </main>
  );
}
