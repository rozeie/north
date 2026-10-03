export function RecommendationSkeleton() {
  return (
    <div role="status" aria-live="polite">
      <p className="mb-6 text-muted">오늘의 추천을 준비하고 있어요. 확정한 성장 방향에 맞는 자료를 고르는 중이에요.</p>
      <div className="space-y-6" aria-hidden>
        {[0, 1, 2].map((i) => (
          <div key={i} className="animate-pulse card">
            <div className="h-4 w-20 rounded bg-line" />
            <div className="mt-4 h-6 w-3/4 rounded bg-line" />
            <div className="mt-6 h-4 w-full rounded bg-line" />
            <div className="mt-2 h-4 w-5/6 rounded bg-line" />
          </div>
        ))}
      </div>
    </div>
  );
}
