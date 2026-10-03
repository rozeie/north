import { Suspense } from "react";
import { requireConfirmedUser } from "@/lib/auth";
import * as repo from "@/lib/repo";
import { DirectionSummary } from "@/components/DirectionSummary";
import { RecommendationSkeleton } from "@/components/RecommendationSkeleton";
import { Shell } from "@/components/Shell";
import { TodayRecommendations } from "@/components/TodayRecommendations";
import { TrackView } from "@/components/TrackView";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await requireConfirmedUser();
  const direction = await repo.getDirection(user.id);
  if (!direction) return null;

  return (
    <Shell active="home">
      <TrackView step="home" />
      <DirectionSummary direction={direction} />
      <Suspense fallback={<RecommendationSkeleton />}>
        <TodayRecommendations userId={user.id} />
      </Suspense>
    </Shell>
  );
}
