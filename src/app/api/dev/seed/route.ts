import { randomUUID } from "crypto";
import { devAuthEnabled } from "@/lib/auth";
import { fail, ok, withUser } from "@/lib/api";
import * as repo from "@/lib/repo";

export const runtime = "nodejs";

// 개발 전용: 로그인한 테스트 계정에 샘플 프로필 + 확정된 성장 방향을 채운다.
// DEV_AUTH_BYPASS=true 이고 production 이 아닐 때만 동작한다(그 외에는 404).
// ?reset=1 이면 샘플 데이터를 지우고 다시 채운다. 이미 확정된 계정은 건드리지 않는다.
export const POST = withUser(async (req, { user }) => {
  if (!devAuthEnabled()) return fail("Not found", 404);

  const reset = new URL(req.url).searchParams.get("reset") === "1";
  if (reset) await repo.resetUserData(user.id);
  if ((await repo.getOnboardingState(user.id)) !== "SignedIn") return ok({ seeded: false });

  const topics = [
    { id: randomUUID(), name: "우선순위 결정", description: "여러 요구 사이에서 무엇을 먼저 할지 정하는 기준" },
    { id: randomUUID(), name: "가설 검증", description: "아이디어를 작은 실험으로 확인하는 방법" },
    { id: randomUUID(), name: "지표 설계", description: "성과를 판단할 핵심 지표를 정의하는 방법" },
  ];
  const skills = [
    { id: randomUUID(), name: "문제 정의", description: "해결할 문제를 한 문장으로 좁히는 역량" },
    { id: randomUUID(), name: "데이터 기반 의사결정", description: "지표와 실험 결과로 판단 근거를 만드는 역량" },
  ];
  const draft = {
    stuck_hypothesis: "기능 요청이 많을 때 무엇을 먼저 할지 정하는 기준이 없어서 판단이 매번 흔들리는 것으로 보여요.",
    skills,
    topics,
    priority_topic_id: topics[0].id,
  };

  await repo.createProfileAndDraft(
    {
      user_id: user.id,
      job_family: "pm",
      career_stage: "주니어 (1~3년)",
      target_role: "프로덕트 매니저",
      current_concern: "여러 팀의 기능 요청 사이에서 우선순위를 어떻게 정해야 할지 모르겠어요.",
      structured: {
        current_or_target_role: "프로덕트 매니저",
        career_stage: "주니어 (1~3년)",
        projects: ["(샘플) 커머스 앱 개선 프로젝트"],
        roles: ["서비스 기획"],
        main_tasks: ["요구사항 정리", "백로그 관리"],
        concern_related_experiences: ["(샘플) 요청이 몰릴 때 기준 없이 우선순위를 정함"],
        growth_interests: ["우선순위 결정", "가설 검증"],
      },
      created_at: new Date().toISOString(),
    },
    { ...draft }
  );
  await repo.saveDirection(user.id, draft);
  return ok({ seeded: true });
});
