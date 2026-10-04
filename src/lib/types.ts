// PRD 11. 데이터 모델

export type JobFamily = "design" | "pm" | "marketing";
export type ContentType = "concept" | "case" | "evidence";
export type Difficulty = "입문" | "기본" | "심화";

export interface User {
  id: string;
  google_id: string;
  email: string;
  name: string;
  created_at: string;
}

export interface UserSetting {
  user_id: string;
  /** "HH:MM" (KST). 기본 06:00 */
  recommendation_time: string;
}

export interface StructuredProfile {
  current_or_target_role: string;
  career_stage: string;
  projects: string[];
  roles: string[];
  main_tasks: string[];
  concern_related_experiences: string[];
  growth_interests: string[];
}

export interface CareerProfile {
  user_id: string;
  job_family: JobFamily;
  career_stage: string;
  target_role: string;
  current_concern: string;
  cover_letter_text?: string;
  portfolio_text?: string;
  /** 이력서 PDF 원본은 저장하지 않는다. 최초 분석 결과만 저장한다. */
  structured: StructuredProfile;
  created_at: string;
}

export interface NamedItem {
  id: string;
  name: string;
  description: string;
}

export interface DirectionBody {
  stuck_hypothesis: string;
  skills: NamedItem[];
  topics: NamedItem[];
  priority_topic_id: string;
}

export interface Direction extends DirectionBody {
  user_id: string;
  /** AI 최초 초안 스냅샷. 수정 지표(F10) 산출용이며 갱신하지 않는다. */
  draft_snapshot: DirectionBody;
  confirmed_at: string | null;
  updated_at: string;
}

export interface Content {
  id: string;
  title: string;
  author_source: string;
  url: string;
  type: ContentType;
  est_read_min: number;
  job_families: JobFamily[];
  topic_tags: string[];
  difficulty: Difficulty;
  /** 선택 필드. 없으면 화면에서 태그 기반 문구로 대체한다(mock). */
  summary?: string;
  key_points?: string[];
}

export interface DailyRecommendation {
  id: string;
  user_id: string;
  cycle_start_at: string;
  cycle_end_at: string;
  generated_at: string;
  status: "Ready" | "Selected";
  selected_card_id: string | null;
  selected_at: string | null;
}

export interface CardBasis {
  kind: "topic" | "concern";
  label: string;
  quote?: string;
}

export interface RecommendationCard {
  id: string;
  recommendation_id: string;
  content_id: string;
  slot_type: ContentType;
  reason: string;
  check_questions: string[];
  basis: CardBasis;
}

export interface LibraryItem {
  id: string;
  user_id: string;
  content_id: string;
  source_card_id: string;
  reason_snapshot: string;
  check_questions_snapshot: string[];
  basis_snapshot: CardBasis;
  saved_at: string;
}

export interface ReflectionAnswers {
  q1: string;
  q2: string;
  q3?: string;
}

export interface ReflectionSummary {
  learned: string;
  remaining_concern: string;
  next_action: string;
}

export interface Reflection {
  id: string;
  /** 가벼운 회고: "이 콘텐츠에서 가져갈 것" 1~2문장. 있으면 answers/summary 는 이 값에서 파생된다. */
  takeaway?: string;
  user_id: string;
  library_item_id: string;
  answers: ReflectionAnswers;
  summary: ReflectionSummary;
  saved_at: string;
}

export interface EventRow {
  id: string;
  user_id: string;
  name: string;
  props: Record<string, unknown>;
  created_at: string;
}

export interface Database {
  users: User[];
  settings: UserSetting[];
  profiles: CareerProfile[];
  directions: Direction[];
  recommendations: DailyRecommendation[];
  cards: RecommendationCard[];
  library: LibraryItem[];
  reflections: Reflection[];
  events: EventRow[];
}

export type OnboardingState = "SignedIn" | "DraftReady" | "DirectionConfirmed";
