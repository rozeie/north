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

  const context = <DirectionSummary direction={direction} />;

  return (
    <Shell active="home" wide>
      <TrackView step="home" />
      <Suspense fallback={<RecommendationSkeleton context={context} />}>
        <TodayRecommendations userId={user.id} context={context} />
      </Suspense>
    </Shell>
  );
}
