import { HomeHeading } from "./TodayRecommendations";

export function RecommendationSkeleton({ context }: { context?: React.ReactNode }) {
  return (
    <div role="status" aria-live="polite">
      <HomeHeading />
      {context}
      <p className="sr-only">오늘의 추천을 준비하고 있어요.</p>
      <div className="grid animate-pulse divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card md:grid-cols-3 md:divide-x md:divide-y-0" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="p-6">
            <div className="h-5 w-20 rounded bg-line" />
            <div className="mt-5 h-5 w-5/6 rounded bg-line" />
            <div className="mt-2 h-5 w-2/3 rounded bg-line" />
            <div className="mt-6 h-3 w-full rounded bg-line" />
            <div className="mt-2 h-3 w-4/5 rounded bg-line" />
            <div className="mt-8 h-8 w-full rounded bg-line" />
          </div>
        ))}
      </div>
      <p className="mt-3 text-caption text-muted">확정한 성장 방향에 맞는 자료를 고르는 중이에요.</p>
    </div>
  );
}
