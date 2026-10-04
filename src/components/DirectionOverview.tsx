import { CONTENT_TYPE_LABEL, SLOT_ORDER, STAGE_DIFFICULTY, jobFamilyLabel } from "@/lib/constants";
import type { CareerProfile, Direction } from "@/lib/types";
import { ConcernEditor } from "./ConcernEditor";
import { TrackedLink } from "./TrackEvent";

/**
 * 내 방향 상단 요약 (확정 이후): 분석에 쓰인 프로필 + 현재 고민 + 성장 방향 키워드 + 추천 기준.
 * 추천 기준 문구는 lib/recommend.ts 의 실제 선정 규칙을 설명한다(규칙을 바꾸면 함께 고칠 것).
 */
export function DirectionOverview({ profile, direction, reflectionCount }: { profile: CareerProfile; direction: Direction; reflectionCount: number }) {
  const priority = direction.topics.find((t) => t.id === direction.priority_topic_id);
  const levels = (STAGE_DIFFICULTY[profile.career_stage] ?? []).join("·");

  const criteria = [
    `직군: ${jobFamilyLabel(profile.job_family)} 자료만 추천해요.`,
    `유형: ${SLOT_ORDER.map((t) => CONTENT_TYPE_LABEL[t]).join(" → ")} 순서로 하루 ${SLOT_ORDER.length}개를 골라요.`,
    `주제: ‘${priority?.name}’을(를) 가장 높은 비중으로, 나머지 학습 주제를 그다음으로 반영해요.`,
    levels ? `난이도: ${profile.career_stage} 단계에 맞춰 ${levels} 자료를 우선해요.` : "",
    "서재에 저장한 자료는 다시 추천하지 않아요.",
    reflectionCount > 0
      ? `회고 ${reflectionCount}개에서 적어 둔 내용이 추천 이유에 반영돼요.`
      : "회고를 저장하면 다음 추천 이유에 반영돼요.",
  ].filter(Boolean);

  return (
    <div className="mb-12 space-y-6">
      <section aria-labelledby="o-profile" className="card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="o-profile" className="text-lead font-semibold">
            분석에 사용한 프로필
          </h2>
          <TrackedLink href="/start?reanalyze=1" className="btn btn-outline btn-sm" event="Profile Reanalyze Click" props={{ source: "direction" }}>
            프로필 다시 분석하기
          </TrackedLink>
        </div>
        <dl className="mt-4 grid gap-4 text-body-sm sm:grid-cols-3">
          <div>
            <dt className="eyebrow mb-1">직군</dt>
            <dd>{jobFamilyLabel(profile.job_family)}</dd>
          </div>
          <div>
            <dt className="eyebrow mb-1">경력 단계</dt>
            <dd>{profile.career_stage}</dd>
          </div>
          <div>
            <dt className="eyebrow mb-1">목표 직무</dt>
            <dd>{profile.target_role}</dd>
          </div>
        </dl>
        <div className="mt-6">
          <p className="eyebrow mb-2">현재 고민</p>
          <ConcernEditor initial={profile.current_concern} />
        </div>
      </section>

      <section aria-labelledby="o-keywords" className="card">
        <h2 id="o-keywords" className="text-lead font-semibold">
          성장 방향 키워드
        </h2>
        <p className="mt-1 text-body-sm text-muted-foreground">{direction.stuck_hypothesis}</p>
        <p className="eyebrow mb-2 mt-5">학습 주제</p>
        <ul className="flex flex-wrap gap-2">
          {direction.topics.map((t) => (
            <li key={t.id} className={`chip ${t.id === direction.priority_topic_id ? "is-selected font-semibold" : ""}`}>
              {t.name}
            </li>
          ))}
        </ul>
        <p className="eyebrow mb-2 mt-5">필요한 역량</p>
        <ul className="flex flex-wrap gap-2">
          {direction.skills.map((s) => (
            <li key={s.id} className="chip">
              {s.name}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="o-criteria" className="card-muted">
        <h2 id="o-criteria" className="text-lead font-semibold">
          추천은 이렇게 만들어져요
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-body-sm text-muted">
          {criteria.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        <p className="hint mt-3">아래에서 성장 방향을 고치면 다음 추천부터 반영돼요.</p>
      </section>
    </div>
  );
}
