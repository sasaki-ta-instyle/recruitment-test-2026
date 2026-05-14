import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { POLES, type Pole } from "@/lib/questions";
import { judge, scoreAxes, type PoleScores } from "@/lib/scoring";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type SubmitBody = {
  name: string;
  elapsedSec: number;
  part1: Array<{
    questionIndex: number;
    shuffledPoles: string[];
    closestLetter: string | null;
    farthestLetter: string | null;
    closestPole: string | null;
    farthestPole: string | null;
  }>;
  part2: Array<{
    questionId: string;
    bodyText: string;
    charCount: number;
    elapsedSec: number;
  }>;
  poleScores: PoleScores;
};

function sanitizePoleScores(raw: unknown): PoleScores {
  const safe: PoleScores = {
    自責: 0,
    他責: 0,
    素直: 0,
    素直じゃない: 0,
    貢献あり: 0,
    貢献なし: 0,
    ポジ: 0,
    ネガ: 0,
  };
  if (raw && typeof raw === "object") {
    for (const pole of POLES) {
      const v = (raw as Record<string, unknown>)[pole];
      if (typeof v === "number" && Number.isFinite(v)) safe[pole] = Math.trunc(v);
    }
  }
  return safe;
}

export async function POST(req: Request) {
  let body: SubmitBody;
  try {
    body = (await req.json()) as SubmitBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const name = (body.name ?? "").trim().slice(0, 100);
  if (!name) return NextResponse.json({ error: "name is required" }, { status: 400 });

  const poleScores = sanitizePoleScores(body.poleScores);
  const axisNet = scoreAxes(poleScores) as [number, number, number, number];
  const verdict = judge(axisNet);

  try {
    const created = await prisma.candidate.create({
      data: {
        name,
        elapsedSec: Math.max(0, Math.trunc(body.elapsedSec ?? 0)),
        part1Answers: {
          create: (body.part1 ?? []).map((a) => ({
            questionIndex: a.questionIndex,
            shuffledPoles: JSON.stringify((a.shuffledPoles ?? []).slice(0, 4)),
            closestLetter: a.closestLetter ?? null,
            farthestLetter: a.farthestLetter ?? null,
            closestPole: a.closestPole ?? null,
            farthestPole: a.farthestPole ?? null,
          })),
        },
        part2Answers: {
          create: (body.part2 ?? []).map((a) => ({
            questionId: a.questionId,
            bodyText: (a.bodyText ?? "").slice(0, 20000),
            charCount: Math.max(0, Math.trunc(a.charCount ?? 0)),
            elapsedSec: Math.max(0, Math.trunc(a.elapsedSec ?? 0)),
          })),
        },
        score: {
          create: {
            axisSelf: axisNet[0],
            axisSunao: axisNet[1],
            axisContrib: axisNet[2],
            axisPositive: axisNet[3],
            bitKey: verdict.bits,
            typeName: verdict.type.name,
            verdict: verdict.type.verdict,
            matchStrength: verdict.matchStrength,
            absoluteNg: verdict.absoluteNg,
          },
        },
      },
      select: { id: true },
    });
    return NextResponse.json({ id: created.id });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "db error", detail: msg }, { status: 500 });
  }
}
