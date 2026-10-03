import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import * as repo from "@/lib/repo";
import { DirectionEditor } from "@/components/DirectionEditor";
import { PageTitle, Shell } from "@/components/Shell";
import { TrackView } from "@/components/TrackView";

export default async function DirectionPage() {
  const user = await requireUser();
  const direction = await repo.getDirection(user.id);
  if (!direction) redirect("/start");

  const confirmed = Boolean(direction.confirmed_at);
  const { stuck_hypothesis, skills, topics, priority_topic_id } = direction;

  return (
    <Shell nav={confirmed} step={confirmed ? undefined : "2 / 2 · 성장 방향 확인"}>
      <TrackView step="direction" />
      <PageTitle
        eyebrow={confirmed ? "성장 방향" : "2 / 2 · 성장 방향 확인"}
        title={confirmed ? "현재 성장 방향" : "이 방향이 맞는지 확인해 주세요"}
      >
        {confirmed
          ? "확정한 내용은 오늘의 추천 기준으로 사용돼요."
          : "확정한 내용만 오늘의 추천 기준이 돼요. 마음에 들지 않는 부분은 직접 고쳐 주세요."}
      </PageTitle>
      <DirectionEditor
        confirmed={confirmed}
        initial={{ stuck_hypothesis, skills, topics, priority_topic_id }}
      />
    </Shell>
  );
}
