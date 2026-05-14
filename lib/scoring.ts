// 16-type matrix and tier judgement (v6 spec, ported from instyle_culture_test_v5.html)

import type { Pole } from "./questions";

// 軸名はバー表示の左右順（負極 / 正極）に合わせる：
// AXIS_LABELS[i][0] が左（負側）、AXIS_LABELS[i][1] が右（正側）
export const AXIS_NAMES = ["他責 / 自責", "素直さ", "貢献の視点", "ネガ / ポジ"] as const;

export const AXIS_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["他責傾向", "自責傾向"],
  ["素直じゃない", "素直"],
  ["貢献なし", "貢献あり"],
  ["ネガ", "ポジ"],
];

export type Verdict = "good-deep" | "good" | "develop" | "review" | "warn" | "ng";

export const VERDICT_LABEL: Record<Verdict, string> = {
  "good-deep": "採用推奨◎",
  good: "採用推奨○",
  develop: "育成候補△",
  review: "要観察△",
  warn: "要警戒×",
  ng: "NG×",
};

export type TypeInfo = { name: string; verdict: Verdict; desc: string };

export const TYPE_MAP: Record<string, TypeInfo> = {
  "1111": { name: "王道フィット型", verdict: "good-deep", desc: "4軸すべて正極。INSTYLEど真ん中。リーダー候補。" },
  "1110": { name: "堅実リスク管理型", verdict: "good-deep", desc: "自走 × チーム × リスク直視。地に足の着いた貢献者。" },
  "1101": { name: "自走型個人プレイヤー", verdict: "good", desc: "自走力高く明るい。専門職・個人成果型ポジションで活きる。" },
  "1100": { name: "職人型", verdict: "good", desc: "自走 × 個人深掘り × リスク管理。スペシャリスト向き。" },
  "1011": { name: "成果は出すが頭打ち型", verdict: "review", desc: "動く・貢献意欲あるがフィードバック取り込まず。中長期で停滞。" },
  "1010": { name: "頑固な実績者型", verdict: "review", desc: "自走 × 流儀重視 × チーム × リスク管理。型が確立した業務向き。" },
  "1001": { name: "個人プレイ志向の頑固型", verdict: "review", desc: "自走 × 流儀重視 × 個人 × ポジ。完全独立タスク向き。" },
  "1000": { name: "閉じた専門家タイプ", verdict: "review", desc: "自走 × 流儀重視 × 個人深掘り × リスク管理。研究職向き。" },
  "0111": { name: "明るい熱量型", verdict: "develop", desc: "明るく素直、貢献意欲あり。自走力が弱い。要メンター育成。" },
  "0110": { name: "批評家・文句屋型", verdict: "warn", desc: "他責 × 暗 × チーム志向。組織への負の影響大。" },
  "0101": { name: "明るい他責型", verdict: "warn", desc: "明るいが自走せず、貢献意識も薄い。INSTYLE的にはミスマッチ。" },
  "0100": { name: "受動的悲観型", verdict: "warn", desc: "自走せず、貢献せず、悲観的。組織貢献は期待しにくい。" },
  "0011": { name: "派手な自己中型", verdict: "ng", desc: "動くが他責 × 固執 × ポジ。場をかき乱す可能性高い。" },
  "0010": { name: "批判型自己中", verdict: "ng", desc: "他責 × 固執 × チーム志向 × ネガ。組織にとって扱いが難しい。" },
  "0001": { name: "明るいフリーライダー", verdict: "ng", desc: "動かない、変わらない、貢献しない、明るいだけ。" },
  "0000": { name: "暗いフリーライダー", verdict: "ng", desc: "すべての軸で負側。組織にとって最も避けるべきタイプ。" },
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
  if (net >= 10) return { label: "強い正極", tier: "tier-strong-plus" };
  if (net >= 5) return { label: "正極寄り", tier: "tier-weak-plus" };
  if (net >= -4) return { label: "中立", tier: "tier-neutral" };
  if (net >= -9) return { label: "負極寄り", tier: "tier-weak-minus" };
  return { label: "強い負極", tier: "tier-strong-minus" };
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
  const bits = axisNet.map((n) => (n >= 0 ? 1 : 0)).join("");
  const type = TYPE_MAP[bits] ?? TYPE_MAP["0000"];
  const neutralCount = axisNet.filter((n) => n >= -4 && n <= 4).length;
  const allTen = axisNet.every((n) => Math.abs(n) >= 10);

  let matchStrength: MatchStrength;
  if (neutralCount === 0 && allTen) matchStrength = "strong";
  else if (neutralCount === 0) matchStrength = "clear";
  else if (neutralCount === 1) matchStrength = "mid";
  else if (neutralCount === 2) matchStrength = "weak";
  else matchStrength = "hold";

  // 絶対 NG：自他 × 素直 の両方が負側
  const absoluteNg = bits[0] === "0" && bits[1] === "0";

  return { bits, type, matchStrength, absoluteNg, neutralCount };
}
