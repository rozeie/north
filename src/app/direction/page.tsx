import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import * as repo from "@/lib/repo";
import { DirectionEditor } from "@/components/DirectionEditor";
import { DirectionOverview } from "@/components/DirectionOverview";
import { DirectionTabs, PageTitle, Shell } from "@/components/Shell";
import { TrackOnMount } from "@/components/TrackEvent";
import { TrackView } from "@/components/TrackView";

export const dynamic = "force-dynamic";

export default async function DirectionPage() {
  const user = await requireUser();
  const [direction, profile, reflections] = await Promise.all([
    repo.getDirection(user.id),
    repo.getProfile(user.id),
    repo.getReflections(user.id),
  ]);
  if (!direction || !profile) redirect("/start");

  const confirmed = Boolean(direction.confirmed_at);
  const { stuck_hypothesis, skills, topics, priority_topic_id } = direction;

  return (
    <Shell active="direction" nav={confirmed} step={confirmed ? undefined : "2 / 2 · 성장 방향 확인"}>
      <TrackView step="direction" />
      <TrackOnMount event="Direction View" props={{ source: confirmed ? "gnb" : "onboarding" }} />
      <PageTitle
        eyebrow={confirmed ? "내 방향" : "2 / 2 · 성장 방향 확인"}
        title={confirmed ? "내 방향" : "이 방향이 맞는지 확인해 주세요"}
      >
        {confirmed
          ? "확정한 성장 방향이 오늘의 추천 기준이 돼요."
          : "확정한 내용만 오늘의 추천 기준이 돼요. 마음에 들지 않는 부분은 직접 고쳐 주세요."}
      </PageTitle>
      {confirmed && <DirectionTabs active="direction" />}
      {confirmed && <DirectionOverview profile={profile} direction={direction} reflectionCount={reflections.length} />}
      {confirmed && <h2 className="mb-4 text-lead font-semibold">성장 방향 수정</h2>}
      <DirectionEditor confirmed={confirmed} initial={{ stuck_hypothesis, skills, topics, priority_topic_id }} />
    </Shell>
  );
}
