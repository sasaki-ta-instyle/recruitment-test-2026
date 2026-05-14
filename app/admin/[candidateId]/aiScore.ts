"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { PART2_DETAIL, type Part2Detail } from "@/lib/part2Rubric";

const MODEL = "claude-sonnet-4-6";
const ALLOWED_SCORES = new Set([0, 4, 7, 10]);

type ScoringInput = {
  detail: Part2Detail;
  body: string;
  charCount: number;
  elapsedSec: number;
};

function fmtSec(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}分${s.toString().padStart(2, "0")}秒`;
}

function buildPrompt(input: ScoringInput): { system: string; user: string } {
  const { detail, body, charCount, elapsedSec } = input;
  const system = `あなたは INSTYLE GROUP の採用カルチャーテスト Part 2（記述）の採点アシスタントです。1 設問ずつ、ルーブリックに厳密に従って 10 / 7 / 4 / 0 の 4 段階で採点してください。判定は INSTYLE の思想（自責・素直・貢献・正直さ・順番意識）への接続度を重視します。

採点ルール：
- 10 点：合格 — 思想と接続し、具体的で、自責の視点があり、経験が実在する。
- 7 点：方向は正しいが、具体性・深さ・思想接続が薄い。
- 4 点：不十分だが、改善する意志と具体的な改善案がある（加点対象）。
- 0 点：NG — 思想ズレ大、抽象論のみ、建前回答、AI・テンプレ対策の疑い。

文字数や所要時間も判定材料に使えますが、文字数が多いほど高得点とは限りません（薄く長い回答は減点）。
出力は必ず JSON のみで、他のテキストを含めないでください。フィールドは score (0|4|7|10) と reason (日本語 200 字以内) の 2 つです。`;

  const user = `# 設問
${detail.qNum}（${detail.theme}） — ${detail.philosophy}

${detail.intent}

# 採点ルーブリック
- 10 点：${detail.rubric[10]}
- 7 点：${detail.rubric[7]}
- 4 点：${detail.rubric[4]}
- 0 点：${detail.rubric[0]}

# AI・テンプレ警戒
${detail.aiCheck}

# 受験者の回答
文字数：${charCount} 字 ／ 所要：${fmtSec(elapsedSec)}

"""
${body || "（無回答）"}
"""

# 採点
ルーブリックに照らして 10 / 7 / 4 / 0 のいずれかを返してください。理由は具体的に、評価ポイントとなった一文を引用しながら 200 字以内でまとめてください。

応答は JSON のみ：{"score": 10, "reason": "..."}`;

  return { system, user };
}

function parseResponse(text: string): { score: number; reason: string } | null {
  // 余計な前後文字を取り除いて最初の { ... } を取り出す
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const obj = JSON.parse(match[0]) as { score?: unknown; reason?: unknown };
    const s = typeof obj.score === "number" ? obj.score : Number(obj.score);
    const r = typeof obj.reason === "string" ? obj.reason : "";
    if (!ALLOWED_SCORES.has(s)) return null;
    return { score: s, reason: r.slice(0, 2000) };
  } catch {
    return null;
  }
}

export async function aiScorePart2(input: {
  candidateId: string;
}): Promise<
  | { ok: true; scored: number; total: number }
  | { ok: false; error: string }
> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "ANTHROPIC_API_KEY が未設定です（本番環境では shared env から読み込み）。" };
  }
  if (!input.candidateId || typeof input.candidateId !== "string") {
    return { ok: false, error: "invalid candidateId" };
  }

  const client = new Anthropic({ apiKey });

  const candidate = await prisma.candidate.findUnique({
    where: { id: input.candidateId },
    include: { part2Answers: true },
  });
  if (!candidate) return { ok: false, error: "candidate not found" };

  let scored = 0;
  const total = candidate.part2Answers.length;

  for (const ans of candidate.part2Answers) {
    const detail = PART2_DETAIL.find((d) => d.id === ans.questionId);
    if (!detail) continue;

    const { system, user } = buildPrompt({
      detail,
      body: ans.bodyText,
      charCount: ans.charCount,
      elapsedSec: ans.elapsedSec,
    });

    try {
      const res = await client.messages.create({
        model: MODEL,
        max_tokens: 1024,
        system,
        messages: [{ role: "user", content: user }],
      });
      const text = res.content
        .filter((b) => b.type === "text")
        .map((b) => (b as { type: "text"; text: string }).text)
        .join("\n");
      const parsed = parseResponse(text);
      if (!parsed) continue;
      await prisma.part2Answer.update({
        where: { id: ans.id },
        data: {
          aiScore: parsed.score,
          aiReason: parsed.reason,
          aiScoredAt: new Date(),
        },
      });
      scored++;
    } catch (e) {
      // 個別エラーはスキップし、可能な限り続行
      console.error("AI score error", ans.questionId, e);
    }
  }

  revalidatePath(`/admin/${input.candidateId}`);
  return { ok: true, scored, total };
}
