// 16-type matrix and tier judgement (v6 spec, ported from instyle_culture_test_v5.html)

import type { Pole } from "./questions";

// 軸名はバー表示の左右順（負側の傾向 / 正側の傾向）に合わせる：
// AXIS_LABELS[i][0] が左（負側）、AXIS_LABELS[i][1] が右（正側）
export const AXIS_NAMES = ["他責 / 自責", "素直さ", "貢献の視点", "ネガ / ポジ"] as const;

// 表示優先順位：素直 ＞ 自他 ＝ 貢献 ＞ ポジネガ
// 内部の axisNet / TYPE_MAP / bit 列は [自他, 素直, 貢献, ポジネガ] の
// インデックス順を保持しつつ、UI 一覧やテーブルではこの並び順で表示する。
// 値は axisNet（および AXIS_NAMES）への index。
export const AXIS_DISPLAY_ORDER = [1, 0, 2, 3] as const;

export const AXIS_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["他責傾向", "自責傾向"],
  ["素直じゃない", "素直"],
  ["貢献なし", "貢献あり"],
  ["ネガ", "ポジ"],
];

export type Verdict = "good-deep" | "good" | "develop" | "review" | "ng";

export const VERDICT_LABEL: Record<Verdict, string> = {
  "good-deep": "採用推奨◎",
  good: "採用推奨○",
  develop: "育成候補△",
  review: "要観察△",
  ng: "NG×",
};

export type TypeInfo = { name: string; verdict: Verdict; desc: string };

// ビット列の並び順は [素直][自他][貢献][ポジネガ]（重要度順）
// 1 = 正の傾向（素直 / 自責 / 貢献あり / ポジ）、0 = 負の傾向
export const TYPE_MAP: Record<string, TypeInfo> = {
  "1111": { name: "王道フィット型", verdict: "good-deep", desc: "4 軸すべて正の傾向。INSTYLE ど真ん中。リーダー候補。" },
  "1110": { name: "堅実リスク管理型", verdict: "good-deep", desc: "素直 × 自走 × チーム貢献 × リスク直視。地に足の着いた貢献者・リーダー候補。" },
  "1101": { name: "自走型個人プレイヤー", verdict: "good", desc: "素直で自走力が高く明るい。個人成果型ポジション・専門職で活きる。" },
  "1100": { name: "職人肌スペシャリスト", verdict: "good", desc: "素直 × 自走 × 個人深掘り × リスク管理。スペシャリスト・職人職向き。" },
  "1011": { name: "明るいチームプレイヤー", verdict: "develop", desc: "素直 × チーム貢献 × 明るい。自走力に伸びしろ、メンター育成で開花。" },
  "1010": { name: "慎重派チームサポーター", verdict: "review", desc: "素直 × チーム志向。状況をネガティブに見やすい点は要観察。" },
  "1001": { name: "楽観型サポーター", verdict: "review", desc: "素直 × 明るい。自走力と貢献意識に伸びしろ、要観察。" },
  "1000": { name: "受け止め型サポーター", verdict: "review", desc: "素直に受け取る力はあるが、自走・貢献に伸びしろ。リスクを重く見る傾向、要観察。" },
  "0111": { name: "自走型ベテラン", verdict: "review", desc: "自走 × チーム貢献 × 明るい。フィードバック取り込みに伸びしろ、中長期育成。" },
  "0110": { name: "信念型ベテラン", verdict: "review", desc: "自走 × チーム志向 × リスク重視。確立した自分の型を持つ。型のある業務向き。" },
  "0101": { name: "独立スペシャリスト", verdict: "review", desc: "自走 × 明るい × 独自路線。完全独立タスク・個人成果型で価値発揮。" },
  "0100": { name: "研究者タイプ", verdict: "review", desc: "自走 × 独自スタイル × 個人深掘り × リスク管理。研究職・職人職向き。" },
  "0011": { name: "自由奔放型", verdict: "ng", desc: "動くが他責 × 流儀重視 × ポジ。場をかき乱す可能性が高い。" },
  "0010": { name: "我流タイプ", verdict: "ng", desc: "他責 × 流儀重視 × チーム志向 × ネガ。組織にとって扱いが難しい。" },
  "0001": { name: "楽天家フリーライダー", verdict: "ng", desc: "動かない・変わらない・貢献しない、明るいだけ。" },
  "0000": { name: "受け身フリーライダー", verdict: "ng", desc: "すべての軸で負側。組織貢献は期待しにくい。" },
};

export type MatchStrength = "strong" | "clear" | "mid" | "weak" | "hold";

export const MATCH_LABEL: Record<MatchStrength, { label: string; desc: string }> = {
  strong: { label: "強いマッチ", desc: "4 軸すべて ±10 以上。タイプ判定の確度が最も高い。" },
  clear: { label: "明確なマッチ", desc: "4 軸すべて ±5 以上。クリアに型が出ている。" },
  mid: { label: "中立軸あり", desc: "3 軸はクリア、1 軸が判断保留。中立軸は Part 2 で確認。" },
  weak: { label: "弱いマッチ", desc: "半分のみクリア。Part 2 で重点的に確認が必要。" },
  hold: { label: "判定保留", desc: "Part 1 単独では判定困難。Part 2 が判断の主軸。" },
};

export type AxisTier =
  | "tier-strong-plus"
  | "tier-weak-plus"
  | "tier-neutral"
  | "tier-weak-minus"
  | "tier-strong-minus";

export function getAxisTier(net: number): { label: string; tier: AxisTier } {
  if (net >= 10) return { label: "強い正の傾向", tier: "tier-strong-plus" };
  if (net >= 5) return { label: "正の傾向あり", tier: "tier-weak-plus" };
  if (net >= -4) return { label: "中立", tier: "tier-neutral" };
  if (net >= -9) return { label: "負の傾向あり", tier: "tier-weak-minus" };
  return { label: "強い負の傾向", tier: "tier-strong-minus" };
}

export type PoleScores = Record<Pole, number>;

export function emptyPoleScores(): PoleScores {
  return {
    自責: 0,
    他責: 0,
    素直: 0,
    素直じゃない: 0,
    貢献あり: 0,
    貢献なし: 0,
    ポジ: 0,
    ネガ: 0,
  };
}

export function scoreAxes(p: PoleScores): [number, number, number, number] {
  return [
    p["自責"] - p["他責"],
    p["素直"] - p["素直じゃない"],
    p["貢献あり"] - p["貢献なし"],
    p["ポジ"] - p["ネガ"],
  ];
}

export function judge(axisNet: [number, number, number, number]) {
  // ビット列は AXIS_DISPLAY_ORDER（[素直][自他][貢献][ポジネガ]）で生成
  const bits = AXIS_DISPLAY_ORDER.map((i) => (axisNet[i] >= 0 ? 1 : 0)).join("");
  const type = TYPE_MAP[bits] ?? TYPE_MAP["0000"];
  const neutralCount = axisNet.filter((n) => n >= -4 && n <= 4).length;
  const allTen = axisNet.every((n) => Math.abs(n) >= 10);

  let matchStrength: MatchStrength;
  if (neutralCount === 0 && allTen) matchStrength = "strong";
  else if (neutralCount === 0) matchStrength = "clear";
  else if (neutralCount === 1) matchStrength = "mid";
  else if (neutralCount === 2) matchStrength = "weak";
  else matchStrength = "hold";

  // 絶対 NG：素直 × 自他 の両方が負側（bits[0]=素直, bits[1]=自他）
  const absoluteNg = bits[0] === "0" && bits[1] === "0";

  return { bits, type, matchStrength, absoluteNg, neutralCount };
}
