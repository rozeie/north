import type { ContentType, Difficulty, JobFamily } from "./types";

export const JOB_FAMILIES: { value: JobFamily; label: string }[] = [
  { value: "design", label: "주니어 UX/UI·프로덕트 디자이너" },
  { value: "pm", label: "주니어 PM·서비스 기획자" },
  { value: "marketing", label: "주니어 마케터" },
];

export const CAREER_STAGES = ["취업 준비생", "신입 (1년 미만)", "주니어 (1~3년)"] as const;

/** 경력 단계별로 우선 추천하는 난이도 */
export const STAGE_DIFFICULTY: Record<string, Difficulty[]> = {
  "취업 준비생": ["입문", "기본"],
  "신입 (1년 미만)": ["입문", "기본"],
  "주니어 (1~3년)": ["기본", "심화"],
};

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  concept: "개념 이해",
  case: "실무 적용 사례",
  evidence: "논문·연구·책",
};

/** 추천 카드 노출 순서: 개념 → 사례 → 근거 */
export const SLOT_ORDER: ContentType[] = ["concept", "case", "evidence"];

export const DEFAULT_RECOMMENDATION_TIME = "06:00";

export const REFLECTION_QUESTIONS = [
  { key: "q1", label: "이 자료에서 현재 고민과 연결된 내용은 무엇인가요?", required: true },
  { key: "q2", label: "현재 프로젝트 또는 커리어 상황에서 적용해볼 것은 무엇인가요?", required: true },
  { key: "q3", label: "아직 해결되지 않은 부분은 무엇인가요? (선택)", required: false },
] as const;

export const MAX_PDF_BYTES = 10 * 1024 * 1024;

export const jobFamilyLabel = (v: JobFamily) => JOB_FAMILIES.find((j) => j.value === v)?.label ?? v;
