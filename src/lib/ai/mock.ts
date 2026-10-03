// Mock AI: ANTHROPIC_API_KEY 가 없을 때 사용하는 규칙 기반 샘플 응답.
// 실제 모델 호출이 아니므로 품질 검증용이 아니라 화면·흐름 동작 확인용이다.
import { extractPdfText } from "../pdf";
import type { JobFamily, ReflectionSummary } from "../types";
import type { CardReasons, InitialAnalysis, InitialInput, RecommendCtx, RecommendPick, ReflectionCtx } from "./schemas";

const TOPIC_DESC: Record<string, string> = {
  "리서치 합성": "인터뷰·관찰 결과를 패턴과 인사이트로 묶어 내는 방법",
  "기회 정의": "리서치에서 드러난 문제를 해결할 가치가 있는 기회로 정리하는 방법",
  "가설 검증": "솔루션 아이디어의 불확실한 가정을 찾아 작게 검증하는 방법 (Assumption Testing)",
  "Opportunity Solution Tree": "목표·기회·솔루션·실험을 한 장의 구조로 연결하는 프레임워크",
  "문제 정의": "해결할 문제를 범위와 근거와 함께 명확히 서술하는 방법",
  "디자인 의사결정": "선택지를 비교하고 결정의 이유를 설명하는 방법",
  "포트폴리오 스토리텔링": "프로젝트를 문제 → 과정 → 결과의 흐름으로 전달하는 방법",
  "사용성 테스트": "화면·흐름의 문제를 사용자 관찰로 찾아내는 방법",
  "디자인 시스템": "컴포넌트와 규칙으로 일관성과 협업 효율을 만드는 방법",
  "협업 커뮤니케이션": "개발자·기획자와 의도를 맞추고 결정을 공유하는 방법",
  "정보 구조": "콘텐츠와 메뉴를 사용자의 이해 방식에 맞게 구조화하는 방법",
  "지표 설계": "목표를 측정 가능한 지표와 기준으로 바꾸는 방법",
  "실험 설계": "가설을 검증할 실험의 조건과 판단 기준을 설계하는 방법",
  "퍼널 분석": "단계별 전환과 이탈을 분해해 개선 지점을 찾는 방법",
  "우선순위 결정": "기준을 두고 할 일의 순서와 범위를 정하는 방법",
  "로드맵": "목표와 맥락 중심으로 계획을 구성하고 공유하는 방법",
  "이해관계자 커뮤니케이션": "근거를 들어 합의를 만들고 의사결정을 이끄는 방법",
  "요구사항 정의": "문제와 목표에서 기능 요구사항으로 구체화하는 방법",
  "사용자 인터뷰": "질문을 설계하고 편향 없이 이야기를 이끌어 내는 방법",
  "캠페인 회고": "캠페인 결과를 해석해 다음 실험으로 연결하는 방법",
  "포지셔닝": "경쟁 대안 대비 제품의 가치를 어디에 둘지 정하는 방법",
  "메시지 설계": "대상에게 맞는 핵심 메시지를 구조화하는 방법",
  "콘텐츠 전략": "목적과 대상에 맞춰 콘텐츠 주제와 형식을 정하는 방법",
  "고객 세그먼트": "고객을 행동·상황 기준으로 나누고 우선 대상을 정하는 방법",
  "리텐션": "사용자가 계속 돌아오는 이유와 이탈 지점을 파악하는 방법",
};
const desc = (name: string) => TOPIC_DESC[name] ?? "현재 고민을 풀기 위해 먼저 이해해 두면 좋은 주제";

interface Rule {
  family: JobFamily;
  keywords: string[];
  hypothesis: string;
  skills: [string, string][];
  topics: string[];
  priority: string;
}

const RULES: Rule[] = [
  {
    family: "design",
    keywords: ["인터뷰", "리서치", "솔루션", "확신", "인사이트", "조사"],
    hypothesis: "인터뷰에서 얻은 내용을 문제 기회와 솔루션 가설로 연결하는 과정에서 판단 기준이 부족할 수 있어요.",
    skills: [
      ["리서치 합성", "여러 인터뷰 결과를 공통 패턴으로 묶어 의미를 끌어내는 역량"],
      ["기회 정의", "발견한 문제 중 먼저 풀어볼 기회를 고르고 서술하는 역량"],
      ["가설 구조화", "솔루션 아이디어에 깔린 가정을 드러내고 검증 순서를 정하는 역량"],
    ],
    topics: ["리서치 합성", "기회 정의", "가설 검증", "Opportunity Solution Tree"],
    priority: "기회 정의",
  },
  {
    family: "design",
    keywords: ["포트폴리오", "케이스", "스토리", "면접", "취업", "프로젝트 설명"],
    hypothesis: "프로젝트에서 내린 디자인 결정을 문제와 근거 중심의 이야기로 풀어내는 데 어려움이 있을 수 있어요.",
    skills: [
      ["문제 정의", "프로젝트의 출발점이 된 문제를 근거와 함께 설명하는 역량"],
      ["디자인 의사결정 설명", "선택지와 선택 이유를 비교해서 말하는 역량"],
    ],
    topics: ["문제 정의", "디자인 의사결정", "포트폴리오 스토리텔링", "사용성 테스트"],
    priority: "문제 정의",
  },
  {
    family: "design",
    keywords: ["디자인 시스템", "컴포넌트", "일관성", "협업", "개발자", "핸드오프"],
    hypothesis: "화면 단위 작업을 규칙과 컴포넌트로 정리해 팀과 공유하는 방식이 아직 자리 잡지 않았을 수 있어요.",
    skills: [
      ["시스템적 사고", "반복되는 요소를 규칙과 컴포넌트로 추상화하는 역량"],
      ["협업 커뮤니케이션", "디자인 의도를 개발·기획과 맞추는 역량"],
    ],
    topics: ["디자인 시스템", "협업 커뮤니케이션", "디자인 의사결정"],
    priority: "디자인 시스템",
  },
  {
    family: "design",
    keywords: ["사용성", "테스트", "화면 개선", "정보 구조", "내비게이션", "ia"],
    hypothesis: "화면 개선의 방향을 사용자 관찰과 구조 관점에서 확인하는 방법을 더 갖추면 도움이 될 수 있어요.",
    skills: [
      ["사용성 평가", "사용자 행동 관찰로 문제를 찾아내는 역량"],
      ["정보 구조 설계", "콘텐츠와 메뉴를 사용자의 이해 방식에 맞게 배치하는 역량"],
    ],
    topics: ["사용성 테스트", "정보 구조", "가설 검증"],
    priority: "사용성 테스트",
  },
  {
    family: "pm",
    keywords: ["지표", "데이터", "kpi", "성과", "측정", "전환"],
    hypothesis: "제품 목표를 측정 가능한 지표와 검증할 가설로 바꾸는 과정에서 기준이 모호할 수 있어요.",
    skills: [
      ["지표 설계", "목표를 측정 가능한 지표로 옮기는 역량"],
      ["가설 설정", "무엇을 확인하면 판단할 수 있는지 가설로 서술하는 역량"],
      ["실험 해석", "실험 결과를 다음 결정으로 연결하는 역량"],
    ],
    topics: ["지표 설계", "가설 검증", "실험 설계", "퍼널 분석"],
    priority: "지표 설계",
  },
  {
    family: "pm",
    keywords: ["우선순위", "로드맵", "범위", "일정", "이해관계자", "설득", "의사결정"],
    hypothesis: "여러 요구 사이에서 우선순위를 정하고 그 이유를 이해관계자와 공유하는 기준이 필요할 수 있어요.",
    skills: [
      ["우선순위 판단", "기준을 두고 할 일의 순서와 범위를 정하는 역량"],
      ["이해관계자 소통", "근거를 들어 합의를 만들어 가는 역량"],
    ],
    topics: ["우선순위 결정", "로드맵", "이해관계자 커뮤니케이션"],
    priority: "우선순위 결정",
  },
  {
    family: "pm",
    keywords: ["문제 정의", "기획", "요구사항", "prd", "문서", "기능 정의", "사용자"],
    hypothesis: "사용자 문제에서 기능 요구사항으로 넘어가는 과정에서 문제의 범위와 근거가 흐릿해질 수 있어요.",
    skills: [
      ["문제 정의", "해결할 문제를 범위와 근거와 함께 서술하는 역량"],
      ["요구사항 구체화", "문제와 목표를 기능 요구사항으로 옮기는 역량"],
    ],
    topics: ["문제 정의", "기회 정의", "요구사항 정의", "사용자 인터뷰"],
    priority: "문제 정의",
  },
  {
    family: "marketing",
    keywords: ["성과", "분석", "캠페인", "전환", "광고", "퍼널", "roas", "ctr"],
    hypothesis: "캠페인 결과를 해석해 다음 실험으로 연결하는 기준이 부족할 수 있어요.",
    skills: [
      ["성과 해석", "지표 변화의 원인을 단계별로 나눠 보는 역량"],
      ["실험 설계", "다음 캠페인에서 확인할 가설과 조건을 정하는 역량"],
    ],
    topics: ["캠페인 회고", "퍼널 분석", "실험 설계", "지표 설계"],
    priority: "캠페인 회고",
  },
  {
    family: "marketing",
    keywords: ["포지셔닝", "메시지", "카피", "브랜드", "차별", "콘텐츠"],
    hypothesis: "제품의 가치를 누구에게 어떤 메시지로 전달할지 기준을 세우는 부분이 막혀 있을 수 있어요.",
    skills: [
      ["포지셔닝", "경쟁 대안 대비 제품의 가치를 정리하는 역량"],
      ["메시지 구조화", "대상에 맞는 핵심 메시지를 설계하는 역량"],
    ],
    topics: ["포지셔닝", "메시지 설계", "콘텐츠 전략", "고객 세그먼트"],
    priority: "포지셔닝",
  },
  {
    family: "marketing",
    keywords: ["리텐션", "재구매", "crm", "이탈", "유지", "구독"],
    hypothesis: "신규 유입 이후 사용자가 계속 머무는 이유와 이탈 지점을 파악하는 방법이 필요할 수 있어요.",
    skills: [
      ["리텐션 분석", "사용자 유지·이탈 패턴을 읽어 내는 역량"],
      ["실험 설계", "유지율을 높일 아이디어를 작게 검증하는 역량"],
    ],
    topics: ["리텐션", "지표 설계", "퍼널 분석", "실험 설계"],
    priority: "리텐션",
  },
];

const DEFAULTS: Record<JobFamily, Rule> = {
  design: {
    family: "design",
    keywords: [],
    hypothesis: "현재 프로젝트의 문제를 구조적으로 정의하고 선택의 근거를 설명하는 부분을 더 다져 볼 수 있어요.",
    skills: [
      ["문제 정의", "해결할 문제를 근거와 함께 서술하는 역량"],
      ["디자인 의사결정", "선택지를 비교하고 이유를 설명하는 역량"],
    ],
    topics: ["리서치 합성", "문제 정의", "디자인 의사결정"],
    priority: "문제 정의",
  },
  pm: {
    family: "pm",
    keywords: [],
    hypothesis: "문제를 정의하고 성과를 측정하며 우선순위를 정하는 기본 틀을 먼저 갖추면 도움이 될 수 있어요.",
    skills: [
      ["문제 정의", "해결할 문제를 범위와 근거와 함께 서술하는 역량"],
      ["지표 설계", "목표를 측정 가능한 지표로 옮기는 역량"],
    ],
    topics: ["문제 정의", "지표 설계", "우선순위 결정"],
    priority: "문제 정의",
  },
  marketing: {
    family: "marketing",
    keywords: [],
    hypothesis: "대상 고객을 구체화하고 메시지와 성과를 연결해서 보는 기본 틀이 필요할 수 있어요.",
    skills: [
      ["고객 이해", "고객을 행동·상황 기준으로 나눠 보는 역량"],
      ["성과 해석", "지표 변화의 원인을 단계별로 나눠 보는 역량"],
    ],
    topics: ["고객 세그먼트", "메시지 설계", "퍼널 분석"],
    priority: "고객 세그먼트",
  },
};

const clip = (s: string, n: number) => {
  const t = s.replace(/\s+/g, " ").trim();
  return t.length > n ? `${t.slice(0, n)}…` : t;
};

const splitLines = (s: string) =>
  s
    .split(/[\r\n]+|(?<=[.!?。])\s+/)
    .map((x) => x.trim())
    .filter((x) => x.length >= 6 && x.length <= 120);

export async function mockInitialAnalysis(input: InitialInput): Promise<InitialAnalysis> {
  const concern = input.current_concern.toLowerCase();
  const pdfText = input.pdf ? await extractPdfText(input.pdf.data) : "";

  const scored = RULES.filter((r) => r.family === input.job_family)
    .map((r) => ({ r, hits: r.keywords.filter((k) => concern.includes(k.toLowerCase())).length }))
    .sort((a, b) => b.hits - a.hits);
  const rule = scored[0] && scored[0].hits > 0 ? scored[0].r : DEFAULTS[input.job_family];

  const lines = splitLines([pdfText, input.cover_letter_text ?? "", input.portfolio_text ?? ""].join("\n"));
  const pick = (re: RegExp, n: number) => lines.filter((l) => re.test(l)).slice(0, n);
  const words = input.current_concern.split(/\s+/).filter((w) => w.length >= 2);

  return {
    profile: {
      current_or_target_role: input.target_role,
      career_stage: input.career_stage,
      projects: pick(/프로젝트|project|서비스|앱|캠페인/i, 3),
      roles: pick(/담당|역할|리드|주도|참여/, 3),
      main_tasks: pick(/분석|설계|기획|운영|제작|개발|리서치|디자인|마케팅/, 4),
      concern_related_experiences: lines.filter((l) => words.some((w) => l.includes(w))).slice(0, 3),
      growth_interests: rule.topics.slice(0, 3),
    },
    draft: {
      stuck_hypothesis: rule.hypothesis,
      skills: rule.skills.map(([name, description]) => ({ name, description })),
      topics: rule.topics.map((name) => ({ name, description: desc(name) })),
      priority_topic_name: rule.priority,
    },
  };
}

export async function mockCardReasons(ctx: RecommendCtx, picks: RecommendPick[]): Promise<CardReasons> {
  const quote = clip(ctx.concern, 50);
  const priority = ctx.direction.priority_topic;
  const remaining = ctx.reflections.find((r) => r.remaining_concern.trim())?.remaining_concern;

  return {
    cards: picks.map((p) => {
      const topic = p.matched_topic;
      let reason: string;
      let questions: string[];
      if (p.type === "concept") {
        reason = `현재 우선 주제는 '${priority}'예요. "${quote}"라는 고민을 풀려면 ${topic ?? priority}의 기본 개념과 용어를 먼저 정리해 두는 편이 좋을 수 있어요. 이 자료가 그 기준을 잡아줄 수 있어요.`;
        questions = [
          `이 자료의 핵심 개념 중 내 고민에 바로 대응되는 것은 무엇인가요?`,
          `내 프로젝트에서 이 개념으로 다시 설명할 수 있는 장면이 있나요?`,
        ];
      } else if (p.type === "case") {
        reason = `${topic ?? priority}을(를) 실제 업무에 적용한 사례예요. "${quote}"라는 상황에서 개념이 현업에서 어떻게 쓰이는지 확인하면, '${priority}'를 내 프로젝트에 옮길 때 참고가 될 수 있어요.`;
        questions = [
          `이 사례의 상황은 내 상황과 어디가 같고 어디가 다른가요?`,
          `사례에서 가져와 이번 주에 시도해볼 수 있는 한 가지는 무엇인가요?`,
        ];
      } else {
        reason = `${topic ?? priority}에 대한 근거를 직접 확인할 수 있는 자료예요. '${priority}'를 다룰 때 흔히 쓰는 접근이 왜 그렇게 쓰이는지 알아두면, 내 판단 기준을 세우는 데 도움이 될 수 있어요.`;
        questions = [
          `이 자료가 제시하는 근거는 어떤 조건에서 성립하나요?`,
          `내 프로젝트의 판단 기준에 반영하려면 무엇을 바꿔야 할까요?`,
        ];
      }
      if (remaining) reason += ` 지난 회고에 남긴 "${clip(remaining, 40)}"도 이어서 살펴볼 수 있어요.`;
      return {
        content_id: p.content_id,
        reason,
        check_questions: questions,
        basis_kind: topic ? ("topic" as const) : ("concern" as const),
        basis_label: topic ? `학습 주제 · ${topic}` : "현재 커리어 고민",
        basis_quote: quote,
      };
    }),
  };
}

export async function mockReflectionSummary(ctx: ReflectionCtx): Promise<ReflectionSummary> {
  const first = (s: string) => clip(splitFirst(s), 140);
  return {
    learned: first(ctx.answers.q1),
    remaining_concern: ctx.answers.q3?.trim() ? first(ctx.answers.q3) : "회고에서 따로 적은 남은 고민이 없어요. 필요하면 직접 적어 주세요.",
    next_action: first(ctx.answers.q2),
  };
}

function splitFirst(s: string): string {
  const t = s.trim();
  const m = /^(.+?[.!?。])(\s|$)/s.exec(t);
  return m ? m[1] : t;
}
