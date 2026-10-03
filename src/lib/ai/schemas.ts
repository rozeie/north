import { z } from "zod";
import type { CardBasis, ContentType, JobFamily, ReflectionAnswers, ReflectionSummary, StructuredProfile } from "../types";

// PRD 3-4: AI 는 평가·점수·등급·합격 가능성 표현을 쓰지 않는다.
const BANNED = ["점수", "등급", "합격 가능", "합격률", "합격할"];
const clean = (s: string) => !BANNED.some((w) => s.includes(w));
const text = z.string().trim().min(1).refine(clean, "평가성 표현은 허용되지 않습니다.");

const named = z.object({ name: text, description: z.string().trim().refine(clean, "평가성 표현은 허용되지 않습니다.") });

export const StructuredProfileSchema = z.object({
  current_or_target_role: z.string(),
  career_stage: z.string(),
  projects: z.array(z.string()),
  roles: z.array(z.string()),
  main_tasks: z.array(z.string()),
  concern_related_experiences: z.array(z.string()),
  growth_interests: z.array(z.string()),
});

export const InitialAnalysisSchema = z.object({
  profile: StructuredProfileSchema,
  draft: z.object({
    stuck_hypothesis: text,
    skills: z.array(named).min(1),
    topics: z.array(named).min(3).max(5),
    priority_topic_name: text,
  }),
});
export type InitialAnalysis = z.infer<typeof InitialAnalysisSchema>;

export const CardReasonsSchema = z.object({
  cards: z
    .array(
      z.object({
        content_id: z.string(),
        reason: text,
        check_questions: z.array(text).min(1).max(2),
        basis_kind: z.enum(["topic", "concern"]),
        basis_label: text,
        basis_quote: z.string().optional(),
      })
    )
    .min(1),
});
export type CardReasons = z.infer<typeof CardReasonsSchema>;

export const ReflectionSummarySchema = z.object({
  learned: text,
  remaining_concern: z.string().trim().refine(clean, "평가성 표현은 허용되지 않습니다."),
  next_action: text,
});

// ── 호출 입력 ─────────────────────────────────────
export interface InitialInput {
  job_family: JobFamily;
  career_stage: string;
  target_role: string;
  current_concern: string;
  cover_letter_text?: string;
  portfolio_text?: string;
  pdf?: { data: Buffer; name: string };
}

export interface RecommendCtx {
  concern: string;
  job_family: JobFamily;
  career_stage: string;
  profile: StructuredProfile;
  direction: {
    stuck_hypothesis: string;
    skills: { name: string; description: string }[];
    topics: { name: string; description: string }[];
    priority_topic: string;
  };
  /** 저장된 회고 정리(최신순). 다음 추천의 맥락 정보로만 사용한다. */
  reflections: ReflectionSummary[];
}

export interface RecommendPick {
  content_id: string;
  title: string;
  author_source: string;
  type: ContentType;
  tags: string[];
  /** 규칙 기반 선정 단계에서 매칭된 사용자 학습 주제 */
  matched_topic: string | null;
}

export interface ReflectionCtx {
  answers: ReflectionAnswers;
  content: { title: string; author_source: string; tags: string[] };
  direction: { priority_topic: string; topics: string[] };
}

export type { CardBasis };
