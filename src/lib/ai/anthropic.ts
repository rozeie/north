// 실제 AI 연동 (Anthropic Messages API). ANTHROPIC_API_KEY 가 있을 때만 사용된다.
// 서버에서만 호출한다. 모든 응답은 zod 스키마로 검증하며 실패 시 오류를 던진다(UI 는 재시도 버튼 제공).
import type { ZodType } from "zod";
import type { ReflectionSummary } from "../types";
import {
  CardReasonsSchema,
  InitialAnalysisSchema,
  ReflectionSummarySchema,
  type CardReasons,
  type InitialAnalysis,
  type InitialInput,
  type RecommendCtx,
  type RecommendPick,
  type ReflectionCtx,
} from "./schemas";

const SYSTEM = `당신은 커리어 성장 가이드 서비스 North 의 어시스턴트입니다.
규칙:
- 사용자를 평가하거나 진단하지 않습니다. 점수, 등급, 합격 가능성 같은 표현을 절대 쓰지 않습니다.
- 고민을 학습 가능한 문제로 구조화하고, 가설·제안형 어투("~일 수 있어요", "~를 제안해요")로 씁니다.
- 학습 자료의 본문을 요약하지 않습니다. 주어진 메타데이터와 사용자 맥락만 사용합니다.
- 반드시 요청된 JSON 한 개만 출력합니다. 설명, 마크다운 코드 펜스를 붙이지 않습니다.
- 한국어로 간결하게 씁니다.`;

class AiError extends Error {}

async function callJson<T>(schema: ZodType<T>, content: unknown[], maxTokens = 2000): Promise<T> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY ?? "",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || "claude-sonnet-5-5",
      max_tokens: maxTokens,
      system: SYSTEM,
      messages: [{ role: "user", content }],
    }),
  });
  if (!res.ok) throw new AiError(`AI 호출 실패 (${res.status})`);
  const body = (await res.json()) as { content?: { type: string; text?: string }[] };
  const raw = body.content?.find((c) => c.type === "text")?.text ?? "";
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new AiError("AI 응답에서 JSON 을 찾지 못했습니다.");
  const parsed = schema.safeParse(JSON.parse(raw.slice(start, end + 1)));
  if (!parsed.success) throw new AiError("AI 응답이 스키마와 맞지 않습니다.");
  return parsed.data;
}

export async function claudeInitialAnalysis(input: InitialInput): Promise<InitialAnalysis> {
  const content: unknown[] = [];
  if (input.pdf) {
    content.push({
      type: "document",
      source: { type: "base64", media_type: "application/pdf", data: input.pdf.data.toString("base64") },
    });
  }
  content.push({
    type: "text",
    text: `사용자 입력을 바탕으로 (1) 구조화된 커리어 프로필, (2) 성장 방향 초안을 만들어 주세요.
첨부된 이력서 PDF 가 있다면 함께 참고하세요. 이 분석은 최초 1회만 수행되며 이후에는 구조화 프로필만 사용됩니다.

입력:
${JSON.stringify(
  {
    job_family: input.job_family,
    career_stage: input.career_stage,
    target_role: input.target_role,
    current_concern: input.current_concern,
    cover_letter_text: input.cover_letter_text ?? null,
    portfolio_text: input.portfolio_text ?? null,
  },
  null,
  2
)}

출력 JSON 형식:
{
  "profile": {
    "current_or_target_role": string, "career_stage": string,
    "projects": string[], "roles": string[], "main_tasks": string[],
    "concern_related_experiences": string[], "growth_interests": string[]
  },
  "draft": {
    "stuck_hypothesis": "현재 막힌 지점에 대한 한 문장 가설",
    "skills": [{ "name": string, "description": string }],
    "topics": [{ "name": string, "description": string }],   // 학습 주제 3~5개
    "priority_topic_name": "topics 중 가장 먼저 다룰 1개의 name"
  }
}
학습 주제 이름은 "리서치 합성", "기회 정의", "가설 검증", "지표 설계", "실험 설계", "우선순위 결정", "퍼널 분석", "포지셔닝", "메시지 설계"처럼 짧은 개념 이름으로 쓰세요.`,
  });
  return callJson(InitialAnalysisSchema, content, 3000);
}

export async function claudeCardReasons(ctx: RecommendCtx, picks: RecommendPick[]): Promise<CardReasons> {
  const text = `확정된 성장 방향과 사용자 맥락을 바탕으로, 아래 선정된 자료 각각이 "왜 지금 이 사용자에게 필요한지"를 설명해 주세요.
- reason: 2~3문장. 사용자의 고민 또는 학습 주제를 직접 언급해야 하며 일반론은 안 됩니다.
- check_questions: 읽으면서 확인할 질문 1~2개.
- basis_kind/basis_label/basis_quote: 어떤 고민 또는 학습 주제를 근거로 추천했는지.
- 자료 본문을 요약하지 말고, 지난 회고(reflections)가 있다면 맥락으로 참고하세요.

사용자 맥락:
${JSON.stringify(ctx, null, 2)}

선정된 자료:
${JSON.stringify(picks, null, 2)}

출력 JSON 형식:
{ "cards": [{ "content_id": string, "reason": string, "check_questions": string[], "basis_kind": "topic"|"concern", "basis_label": string, "basis_quote": string }] }
cards 는 선정된 자료와 같은 content_id 로 같은 순서로 작성하세요.`;
  return callJson(CardReasonsSchema, [{ type: "text", text }], 2000);
}

export async function claudeReflectionSummary(ctx: ReflectionCtx): Promise<ReflectionSummary> {
  const text = `사용자의 회고를 짧게 정리해 주세요. 항목당 1~2문장입니다. 평가하지 말고 사용자의 말을 정리하세요.
- learned: 배운 내용
- remaining_concern: 아직 남은 고민 (없으면 빈 문자열)
- next_action: 다음에 시도해볼 행동 1개

${JSON.stringify(ctx, null, 2)}

출력 JSON 형식: { "learned": string, "remaining_concern": string, "next_action": string }`;
  return callJson(ReflectionSummarySchema, [{ type: "text", text }], 800);
}
