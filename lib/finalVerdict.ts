// Part 1 タイプ判定（verdict）× Part 2 人手採点合計から、最終総合判定を導く。
// ガイドの「加点ライン目安」と「マッチ強度 × Part 2 の使い分け」を反映：
//   70 点以上：核となる思想を理解している
//   40〜69 点：要観察。タイプ次第
//   40 点未満：思想接続が薄い
// 絶対 NG ルール（自他＝0 × 素直＝0）に該当する場合は無条件で見送り。

import type { Verdict } from "./scoring";

export type FinalVerdict =
  | "accept-strong"     // 強く採用推奨
  | "accept"            // 採用推奨
  | "review-positive"   // 2 次で確認推奨
  | "review"            // 要観察
  | "review-negative"   // 深掘り必要
  | "reject";           // 見送り

export const FINAL_VERDICT_LABEL: Record<FinalVerdict, string> = {
  "accept-strong": "強く採用推奨",
  accept: "採用推奨",
  "review-positive": "2 次面接で確認推奨",
  review: "要観察",
  "review-negative": "深掘り必要",
  reject: "見送り",
};

export const FINAL_VERDICT_DESC: Record<FinalVerdict, string> = {
  "accept-strong": "Part 1 ど真ん中タイプ × Part 2 高得点。INSTYLE 思想と接続済み、即戦力枠。",
  accept: "Part 1 推奨タイプ × Part 2 そこそこ以上。2 次面接は確認的に。",
  "review-positive": "片方が強く片方が弱い。2 次面接で弱い側を重点的に深掘り。",
  review: "中庸。2 次面接でタイプ×思想接続の両軸を確認。",
  "review-negative": "1 次の懸念を 2 次で確認。基準を満たさないなら見送り。",
  reject: "Part 1 / Part 2 / 絶対 NG いずれかで強い拒否シグナル。",
};

export type P2Band = "high" | "mid" | "low" | "none";

export function getP2Band(score: number | null, answered: number): P2Band {
  if (answered === 0) return "none";
  if (score == null) return "none";
  if (score >= 70) return "high";
  if (score >= 40) return "mid";
  return "low";
}

/**
 * 総合判定マトリクス。Part 1 verdict × Part 2 score band で決定。
 * 絶対 NG ルール（absoluteNg=true）は無条件で reject。
 */
export function computeFinalVerdict(input: {
  part1Verdict: Verdict | null;
  absoluteNg: boolean;
  part2Score: number | null;
  part2Answered: number;
}): { verdict: FinalVerdict | null; reason: string } {
  if (input.absoluteNg) {
    return {
      verdict: "reject",
      reason: "絶対 NG ルール該当（自他 × 素直 両軸が負側）。Part 2 結果に関わらず見送り。",
    };
  }
  if (!input.part1Verdict) {
    return { verdict: null, reason: "Part 1 の集計結果がありません。" };
  }

  const band = getP2Band(input.part2Score, input.part2Answered);

  if (band === "none") {
    return {
      verdict: null,
      reason: "Part 2 の人手採点が未完了。10 問すべて採点すると総合判定が出ます。",
    };
  }

  const p1 = input.part1Verdict;

  // Part 1 verdict ごとに band で判定をマッピング
  // verdict は good-deep / good / develop / review / warn / ng
  switch (p1) {
    case "good-deep":
      return {
        verdict: band === "high" ? "accept-strong" : band === "mid" ? "accept" : "review-positive",
        reason:
          band === "high"
            ? "Part 1 王道タイプ + Part 2 70 点以上。即戦力候補。"
            : band === "mid"
              ? "Part 1 は強いが Part 2 で接続度に幅あり。2 次面接で具体性を確認。"
              : "Part 1 は強いが Part 2 で思想接続が薄い。2 次面接で深掘り。",
      };
    case "good":
      return {
        verdict: band === "high" ? "accept" : band === "mid" ? "accept" : "review",
        reason:
          band === "high"
            ? "Part 1 推奨 + Part 2 高得点。採用推奨。"
            : band === "mid"
              ? "Part 1 推奨 + Part 2 中位。2 次面接で確認的に。"
              : "Part 1 推奨だが Part 2 が薄い。2 次で思想接続を確認。",
      };
    case "develop":
      return {
        verdict:
          band === "high" ? "accept" : band === "mid" ? "review-positive" : "review-negative",
        reason:
          band === "high"
            ? "Part 1 育成候補 + Part 2 高得点。Part 2 の伸びを 2 次で確認できれば採用。"
            : band === "mid"
              ? "育成型 + 中位。2 次面接で意思と素直さを重点確認。"
              : "育成型 + 低得点。深掘り必須、慎重に判断。",
      };
    case "review":
      return {
        verdict:
          band === "high" ? "review-positive" : band === "mid" ? "review" : "reject",
        reason:
          band === "high"
            ? "Part 1 要観察 + Part 2 70 点以上。思想接続は確認価値あり。2 次面接へ。"
            : band === "mid"
              ? "Part 1 要観察 + Part 2 中位。タイプの弱点が補えるか 2 次で確認。"
              : "Part 1 要観察 + Part 2 低得点。見送り推奨。",
      };
    case "warn":
      return {
        verdict: band === "high" ? "review-negative" : "reject",
        reason:
          band === "high"
            ? "Part 1 要警戒 + Part 2 高得点。深掘りで本人の意志を確認するが、見送り寄り。"
            : "Part 1 要警戒 + Part 2 中位以下。見送り推奨。",
      };
    case "ng":
      return {
        verdict: "reject",
        reason: "Part 1 NG。Part 2 の結果に関わらず見送り。",
      };
    default:
      return { verdict: null, reason: "判定不能。" };
  }
}
