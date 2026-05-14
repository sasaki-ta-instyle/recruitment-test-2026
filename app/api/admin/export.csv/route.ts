import { prisma } from "@/lib/prisma";
import { PART2 } from "@/lib/questions";
import {
  AXIS_NAMES,
  MATCH_LABEL,
  VERDICT_LABEL,
  type MatchStrength,
  type Verdict,
} from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const PART2_IDS = PART2.map((q) => q.id);

function csvEscape(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (s.includes(",") || s.includes("\"") || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function fmtDateTime(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

export async function GET() {
  const candidates = await prisma.candidate.findMany({
    include: {
      score: true,
      part2Answers: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  const header = [
    "受験日時",
    "氏名",
    "受験者ID",
    `${AXIS_NAMES[0]}(net)`,
    `${AXIS_NAMES[1]}(net)`,
    `${AXIS_NAMES[2]}(net)`,
    `${AXIS_NAMES[3]}(net)`,
    "ビット",
    "タイプ",
    "判定",
    "マッチ強度",
    "絶対NG",
    "所要(秒)",
    "Part2合計",
    "Part2採点済(問)",
    ...PART2_IDS.map((id) => `Part2_${id}_score`),
    ...PART2_IDS.map((id) => `Part2_${id}_chars`),
  ];

  const rows: string[] = [header.map(csvEscape).join(",")];

  for (const c of candidates) {
    const scoreById = new Map<string, { score: number | null; chars: number }>();
    for (const a of c.part2Answers) {
      scoreById.set(a.questionId, { score: a.score, chars: a.charCount });
    }
    const part2Total = c.part2Answers.reduce(
      (sum, a) => sum + (typeof a.score === "number" ? a.score : 0),
      0,
    );
    const answered = c.part2Answers.filter((a) => a.score !== null).length;

    const s = c.score;
    const cells: Array<string | number> = [
      fmtDateTime(c.submittedAt),
      c.name,
      c.id,
      s ? s.axisSelf : "",
      s ? s.axisSunao : "",
      s ? s.axisContrib : "",
      s ? s.axisPositive : "",
      s ? s.bitKey : "",
      s ? s.typeName : "",
      s ? VERDICT_LABEL[s.verdict as Verdict] ?? s.verdict : "",
      s ? MATCH_LABEL[s.matchStrength as MatchStrength]?.label ?? s.matchStrength : "",
      s ? (s.absoluteNg ? "該当" : "") : "",
      c.elapsedSec,
      part2Total,
      answered,
    ];
    for (const id of PART2_IDS) {
      const a = scoreById.get(id);
      cells.push(a && a.score !== null ? a.score : "");
    }
    for (const id of PART2_IDS) {
      const a = scoreById.get(id);
      cells.push(a ? a.chars : "");
    }
    rows.push(cells.map(csvEscape).join(","));
  }

  const csv = rows.join("\r\n") + "\r\n";
  const bom = "﻿"; // Excel が UTF-8 として開けるよう BOM 付与
  const filename = `recruitment-test-2026_${new Date().toISOString().slice(0, 10)}.csv`;

  return new Response(bom + csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
