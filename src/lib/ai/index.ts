import "server-only";
import { claudeCardReasons, claudeInitialAnalysis, claudeReflectionSummary } from "./anthropic";
import { mockCardReasons, mockInitialAnalysis, mockReflectionSummary } from "./mock";

export type {
  InitialAnalysis,
  InitialInput,
  RecommendCtx,
  RecommendPick,
  ReflectionCtx,
  CardReasons,
} from "./schemas";

const useReal = () => Boolean(process.env.ANTHROPIC_API_KEY);

export const aiMode = () => (useReal() ? "claude" : "mock");

// AI 호출은 이 세 가지뿐이다(PRD 12.1). 성장 방향 재분석 호출은 존재하지 않는다.
export const analyzeInitial = (...a: Parameters<typeof mockInitialAnalysis>) =>
  useReal() ? claudeInitialAnalysis(...a) : mockInitialAnalysis(...a);

export const generateCardReasons = (...a: Parameters<typeof mockCardReasons>) =>
  useReal() ? claudeCardReasons(...a) : mockCardReasons(...a);

export const summarizeReflection = (...a: Parameters<typeof mockReflectionSummary>) =>
  useReal() ? claudeReflectionSummary(...a) : mockReflectionSummary(...a);
