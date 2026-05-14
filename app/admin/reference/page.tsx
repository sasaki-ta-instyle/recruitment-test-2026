import { Fragment } from "react";
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
    label: "合格",
    desc: "INSTYLE の思想と接続し、具体的で、自責の視点があり、経験が実在する。",
  },
  {
    score: 7,
    label: "方向は正しい",
    desc: "方向は正しいが、具体性・深さ・思想接続が薄い。",
  },
  {
    score: 4,
    label: "加点対象",
    desc: "不十分だが、改善する意志と具体的な改善案がある。",
  },
  {
    score: 0,
    label: "NG",
    desc: "思想ズレ大、抽象論のみ、建前回答、AI・テンプレ対策の疑い。",
  },
];

// Part 1 各設問の出題意図（順序は PART1 と同じ Q01〜Q20）。
const PART1_INTENT: string[] = [
  "結果不調時の初動の向き × フィードバック受容の入口。",
  "失敗時の自責の取り方 × 制約下でのチーム視点の有無。",
  "逆風下のレバー把握 × 機会／リスクどちら起点で動くか。",
  "立場の違いを学ばない理由にしないか × チーム機能の優先度。",
  "変化への初期反応（試す vs 接続を確認）× 機会／リスクの見方。",
  "チームの調子が悪いときの関わり方 × 楽観／問題志向。",
  "失敗後の整理（自分／構造）× 外部視点を取り入れるか自己検証で閉じるか。",
  "境界外問題への引き受け方 × チーム視点の射程。",
  "反対意見への態度（受容 vs 自己前提整理）× 対立の機会化／リスク化。",
  "長期視点での自分像（組織型／個人プレイヤー）× 未来の捉え方。",
  "不採用時の振り返り起点 × 案の核を更新できるか温存するか。",
  "違和感の起点（自己理解／構造把握）× 仮従う／対立を持ち込む。",
  "顧客対応の自責性 × チーム協働で動くか個別対応に閉じるか。",
  "意思決定の主体性 × 機会／リスク先取りの構え。",
  "不明確な状況での主体性 × 自由として捉えるか不安として捉えるか。",
  "未知領域への入り方 × チーム要請への応じ方。",
  "賞味期限切れのやり方への態度 × 自領域 vs 全体での再設計範囲。",
  "不確実下の踏み出し方（外部知見／自己整理）× 機会／影響の見方。",
  "目標設定時のチーム視点／個別視点 × できる前提／障害前提。",
  "成功パターンの共有範囲 × 期待値の置き方（再現上振れ／前提検証）。",
];

// 各設問の詳細採点ルーブリック（元 instyle_interviewer_guide.html から移植）。
// 表示順は PART2 と同じ（Q01〜Q10 = c1 / c2 / c5 / c4 / c8 / c3 / c9 / c7 / c10 / c6）。
type Part2Detail = {
  qNum: string;
  id: string;
  theme: string;
  philosophy: string;
  intent: string;
  rubric: { 10: string; 7: string; 4: string; 0: string };
  aiCheck: string;
};

const PART2_DETAIL: Part2Detail[] = [
  {
    qNum: "Q01",
    id: "c1",
    theme: "働き方の理解",
    philosophy: "哲学 1：自由 ／ 姿勢のルール",
    intent: "「自由＝制約のなさ」と誤読していないか。責任を引き受けた経験と接続できるかを見ます。",
    rubric: {
      10: "自分の経験で「責任を取ったから自由が広がった」あるいは「取れなかったから縛られた」を語る。自由は引き受けることで広がるという解釈が出ている。",
      7: "解釈は正しいが、自分の経験との接続が薄い、または抽象論にとどまる。",
      4: "「全部共感できた」「ぜひ実践したい」など解釈は浅いが、学ぼうという姿勢は読める。",
      0: "「自由＝制約がないこと」と捉えている、または見せかけの同意で本質に触れていない。",
    },
    aiCheck: "「自由には責任が伴う」など辞書的な定型句のみで自分の経験がない場合。",
  },
  {
    qNum: "Q02",
    id: "c2",
    theme: "オープンコミュニケーションの覚悟",
    philosophy: "哲学 4：人間関係 ／ House Rules",
    intent: "陰口ではなく公式の場で言える人か。実例の有無＋今後の姿勢の両方を見ます。",
    rubric: {
      10: "具体的な場面、自分の葛藤、言った後の結果（人間関係への影響も含む）まで描かれる。誠実さが再現されている。",
      7: "経験はあるが、葛藤や結果が曖昧。",
      4: "「言えなかった」ことを正直に書き、それを今後どう変えたいかの具体案がある（加点対象）。",
      0: "「いつも言っています」と簡単に答える、または抽象論のみ。",
    },
    aiCheck: "場面が「会議で意見を言いました」レベルで、相手の反応や時系列がない場合。",
  },
  {
    qNum: "Q03",
    id: "c5",
    theme: "オープンコミュニケーションへの約束",
    philosophy: "哲学 4：人間関係",
    intent: "Q02 の姿勢が未来時制でも維持できるか。「難しい」と認められる正直さが評価ポイント。",
    rubric: {
      10: "「難しい」と認めた上で、具体的な場面と行動の約束を述べている。",
      7: "認識は正しいが、約束が抽象的（「意識します」止まり）。",
      4: "難しさは認識しているが、改善案が「がんばります」程度。",
      0: "「簡単です」とだけ答え、自分の課題と向き合っていない。",
    },
    aiCheck: "Q02 と内容がほぼ同じで、未来時制への移行がない場合。",
  },
  {
    qNum: "Q04",
    id: "c4",
    theme: "INSTYLE GROUP との違和感",
    philosophy: "哲学 3：成長 ／ 素直さ",
    intent: "「全部共感できました」は素直さではなく、考えていないか建前。違和感を言語化できるかは、自己認識の深さの指標。",
    rubric: {
      10: "違和感を具体的に述べた上で、それでも選ぶ理由を矛盾を抱えながら正直に書く。",
      7: "違和感はあるが、選ぶ理由が表面的。",
      4: "「違和感はあったが乗り越えたい」と前向きだが、具体性は薄い。",
      0: "「全部共感できました」「違和感はありませんでした」（考えていない、または見せかけのサイン）。",
    },
    aiCheck: "違和感の中身が「もっとカジュアル／フラットだと思っていた」程度の薄い指摘で終わる場合。",
  },
  {
    qNum: "Q05",
    id: "c8",
    theme: "仕事とお金の順番",
    philosophy: "哲学 2：お金",
    intent: "「いい仕事の先にお金がある」順番意識が腹落ちしているか。正直さも同時に見る（綺麗事の見抜き）。",
    rubric: {
      10: "「いい仕事の先にお金がある」という順番意識を、自分の経験で語る。",
      7: "順番は正しく述べるが、自分の経験との接続が薄い。",
      4: "お金とやりがいの両方の重要性を認めるが、順番には触れない。",
      0: "「お金のためだけに働く」「やりがいだけあればいい」など極端、または無頓着。",
    },
    aiCheck: "「両方大切です」とだけ書いて順番への踏み込みがない場合。",
  },
  {
    qNum: "Q06",
    id: "c3",
    theme: "貢献へのコミット",
    philosophy: "House Rules：Contribution ／ 哲学 5：仕事",
    intent: "「自分が何を得るか」ではなく「何を出すか」を語れるか。「経験と結びつけて」とは誘導していないので、自分の強み・経験を自発的に引っ張ってこられるかが、振る舞いの差として出る。",
    rubric: {
      10: "自分の強み・経験と結びつけて、具体的に何ができるかを述べる。「貢献」の定義に深さがある。",
      7: "貢献意識はあるが、具体性が薄い。",
      4: "「成長したい」「学びたい」が中心で貢献の視点は薄いが、誠実。",
      0: "「スキルを身につけたい」「キャリアのために」など自己利益中心。",
    },
    aiCheck: "「コミュニケーション能力で貢献できます」「主体性を活かして」など、汎用テンプレで埋まる場合。",
  },
  {
    qNum: "Q07",
    id: "c9",
    theme: "フリーライダーへの向き合い方",
    philosophy: "House Rules：Contribution ／ 哲学 3：成長",
    intent: "「6:4 の 6 を自分が担う努力」をできるか。同時に、自責の振り返りができるか。「経験はありますか」とは誘導していないので、過去の経験を自発的に持ち出せる人ほど、語りに具体性と自責が宿る。",
    rubric: {
      10: "経験を率直に語った上で、自分も足りなかった部分を振り返る自責の視点がある。",
      7: "経験はあるが、自責の視点が薄い。",
      4: "経験はないが、もし自分が当事者になったらどう動くか具体的に書ける。",
      0: "「フリーライダーがいるのは仕方ない」「自分は損だから動かなかった」など。",
    },
    aiCheck: "過去の経験を「不満日記」のように書くだけで、自責の振り返りがない場合。",
  },
  {
    qNum: "Q08",
    id: "c7",
    theme: "学ぶ姿勢",
    philosophy: "House Rules：Apprenti ／ 哲学 3：成長",
    intent: "学びの習慣そのものと、人のおすすめに素直に動けるかを見る。",
    rubric: {
      10: "月の冊数を具体的に答え、内容と感想が深く、行動につながっている。",
      7: "読書習慣はあるが、感想が表面的。",
      4: "読書習慣はないが、別の学び（動画・人・現場）で代替している具体例がある。",
      0: "タイトルと一般的な感想だけで、内容が曖昧（AI または事前調べの可能性）。",
    },
    aiCheck: "有名なベストセラーのタイトルだけで、登場人物や著者の主張に触れていない場合。具体的なエピソードや引用を聞き返すと真贋が分かる。",
  },
  {
    qNum: "Q09",
    id: "c10",
    theme: "5 年後へのコミット",
    philosophy: "哲学 9：行動 ／ 哲学 5：仕事",
    intent: "「夢を語る」ではなく「すでにやっていること」の証拠で長期コミットを測る。",
    rubric: {
      10: "5 年後の像と「そのために今日からやっていること」が具体的に対応している。",
      7: "5 年後の像はあるが、今やっていることが抽象的。",
      4: "「なりたい」が中心だが、今後やる予定の具体案がある。",
      0: "「なりたい」で止まっていて、行動の証拠がない。",
    },
    aiCheck: "「毎日勉強しています」「自己研鑽を欠かしません」のような抽象語の連発。",
  },
  {
    qNum: "Q10",
    id: "c6",
    theme: "ネガ・ポジ傾向（参考）",
    philosophy: "参考情報",
    intent: "満足の源泉（外向き＝貢献／チーム vs 内向き＝目標達成／自己成長）の地図化。良し悪しではなく、人物像の把握用。採用判定への直接影響は小さい。",
    rubric: {
      10: "「いい一日」を具体的に語り、満足の源泉が読み取れる。",
      7: "エピソードはあるが抽象的。",
      4: "一般論的だが、何かしらの満足の出方が見える。",
      0: "未回答もしくは「特にない」と素っ気ない。",
    },
    aiCheck: "このカテゴリは採用判定への直接影響は小さい。性格傾向把握として面接の話題にするための情報として扱う。",
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
          Part 1（イプサティブ評価）の設問と各選択肢の傾向、4 軸ネット→16 タイプ判定、マッチ強度、Part 2（記述）の採点ルーブリックをまとめたリファレンスです。
          面接前に印刷して持ち込むことを想定しています。
        </p>
      </header>

      <section className="admin-card">
        <h2 className="ref-h2">Part 1 設問</h2>
        <p className="ref-desc">
          各設問は 4 つの選択肢（A〜D）から「最も近い」を +1、「最も遠い」を −1 とするイプサティブ評価形式。
          各選択肢は 8 種類の傾向のいずれかに割り当てられている。
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
              <Fragment key={q.id}>
                <tr>
                  <td className="ref-q-no" rowSpan={2}>Q{String(i + 1).padStart(2, "0")}</td>
                  <td className="ref-axes" rowSpan={2}>{q.axes}</td>
                  <td className="ref-q-text">{q.text}</td>
                  {q.options.map((opt, j) => (
                    <td key={j} className="ref-opt">
                      <div>{opt.text}</div>
                      <div className="ref-pole">［{opt.pole}］</div>
                    </td>
                  ))}
                </tr>
                <tr className="ref-q-intent-row">
                  <td colSpan={5} className="ref-q-intent">
                    <strong>意図：</strong>{PART1_INTENT[i]}
                  </td>
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </section>

      <section className="admin-card">
        <h2 className="ref-h2">採点ロジック</h2>
        <ol className="ref-steps">
          <li>
            <strong>STEP 1：傾向カウント</strong> — 各設問で「最も近い」を選んだ傾向に +1、「最も遠い」を選んだ傾向に −1。20 問通して 8 傾向のカウントを集計する。
          </li>
          <li>
            <strong>STEP 2：4 軸ネット</strong> — 対になる傾向ペアの差分。
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
              <li>+10 以上：強い正の傾向</li>
              <li>+5〜+9：正の傾向あり</li>
              <li>−4〜+4：中立</li>
              <li>−5〜−9：負の傾向あり</li>
              <li>−10 以下：強い負の傾向</li>
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
          ビット列の順序は <strong>自他 / 素直 / 貢献 / ポジネガ</strong>（1＝正の傾向、0＝負の傾向）。
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
          設計上、50 分で 10 問すべて書ききれない量になっている。書ききれなかったこと自体は減点要素ではなく、評価情報として扱う（「回答量・時間配分の読み方」参照）。
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

        <h3 className="ref-h3">設問ごとの詳細ルーブリック</h3>
        <p className="ref-desc">
          各設問に対する 10/7/4/0 の判定基準、出題意図、AI・テンプレ警戒ポイントを列挙する。
          採点時はこのページを開いて該当設問の基準と突き合わせる運用。
        </p>
        <div className="ref-essay-list">
          {PART2_DETAIL.map((d) => (
            <article className="ref-essay-card" key={d.id}>
              <header className="ref-essay-head">
                <span className="ref-essay-num">{d.qNum}</span>
                <span className="ref-essay-theme">{d.theme}</span>
                <span className="ref-essay-phil">→ {d.philosophy}</span>
                <span className="ref-essay-cid">（DB: {d.id}）</span>
              </header>
              <p className="ref-essay-intent"><strong>出題意図：</strong>{d.intent}</p>
              <div className="ref-essay-rubric">
                <div className="ref-rubric-row ref-rubric-r10"><span className="ref-rubric-pt">10 点</span><span className="ref-rubric-body">{d.rubric[10]}</span></div>
                <div className="ref-rubric-row ref-rubric-r7"><span className="ref-rubric-pt">7 点</span><span className="ref-rubric-body">{d.rubric[7]}</span></div>
                <div className="ref-rubric-row ref-rubric-r4"><span className="ref-rubric-pt">4 点</span><span className="ref-rubric-body">{d.rubric[4]}</span></div>
                <div className="ref-rubric-row ref-rubric-r0"><span className="ref-rubric-pt">0 点</span><span className="ref-rubric-body">{d.rubric[0]}</span></div>
              </div>
              <p className="ref-essay-ai"><strong>AI・テンプレ警戒：</strong>{d.aiCheck}</p>
            </article>
          ))}
        </div>
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
