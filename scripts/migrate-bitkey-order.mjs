#!/usr/bin/env node
// 既存 Score 行の bitKey / typeName / verdict を新エンコーディング
// [素直][自他][貢献][ポジネガ] に再計算して書き戻す。
//
// 使い方:
//   node scripts/migrate-bitkey-order.mjs
//
// 冪等：何度実行しても判定結果は同じ。axisNet 列が真実なのでそれを元に再計算する。

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const AXIS_DISPLAY_ORDER = [1, 0, 2, 3];

const TYPE_MAP = {
  "1111": { name: "王道フィット型", verdict: "good-deep" },
  "1110": { name: "堅実リスク管理型", verdict: "good-deep" },
  "1101": { name: "自走型個人プレイヤー", verdict: "good" },
  "1100": { name: "職人肌スペシャリスト", verdict: "good" },
  "1011": { name: "明るいチームプレイヤー", verdict: "develop" },
  "1010": { name: "慎重派チームサポーター", verdict: "review" },
  "1001": { name: "楽観型サポーター", verdict: "review" },
  "1000": { name: "受け止め型サポーター", verdict: "review" },
  "0111": { name: "自走型ベテラン", verdict: "review" },
  "0110": { name: "信念型ベテラン", verdict: "review" },
  "0101": { name: "独立スペシャリスト", verdict: "review" },
  "0100": { name: "研究者タイプ", verdict: "review" },
  "0011": { name: "自由奔放型", verdict: "ng" },
  "0010": { name: "我流タイプ", verdict: "ng" },
  "0001": { name: "楽天家フリーライダー", verdict: "ng" },
  "0000": { name: "受け身フリーライダー", verdict: "ng" },
};

function judge(axisNet) {
  const bits = AXIS_DISPLAY_ORDER.map((i) => (axisNet[i] >= 0 ? 1 : 0)).join("");
  const t = TYPE_MAP[bits] ?? TYPE_MAP["0000"];
  return { bits, typeName: t.name, verdict: t.verdict };
}

async function main() {
  const scores = await prisma.score.findMany();
  let updated = 0;
  let unchanged = 0;
  for (const s of scores) {
    const axisNet = [s.axisSelf, s.axisSunao, s.axisContrib, s.axisPositive];
    const next = judge(axisNet);
    if (
      s.bitKey === next.bits &&
      s.typeName === next.typeName &&
      s.verdict === next.verdict
    ) {
      unchanged++;
      continue;
    }
    await prisma.score.update({
      where: { candidateId: s.candidateId },
      data: { bitKey: next.bits, typeName: next.typeName, verdict: next.verdict },
    });
    updated++;
    console.log(
      `  ${s.candidateId}: ${s.bitKey} → ${next.bits} (${s.typeName} → ${next.typeName})`,
    );
  }
  console.log(`\nDone. updated=${updated}, unchanged=${unchanged}, total=${scores.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
