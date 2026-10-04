import Link from "next/link";
import { contentSummary } from "@/lib/content";
import { formatKst, formatRemaining } from "@/lib/cycle";
import { getTodayRecommendation } from "@/lib/recommend";
import * as repo from "@/lib/repo";
import { RetryPanel } from "./RetryPanel";
import { TodayCards, type CardView } from "./TodayCards";

/** 홈 상단: 화면 제목 + 갱신 상태. 로딩·오류 상태에서도 같은 위치에 둔다. */
export function HomeHeading({ status }: { status?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <h1 className="text-title font-semibold tracking-tight">오늘의 추천</h1>
      {status}
    </div>
  );
}

/**
 * 오늘의 추천 (서버 컴포넌트).
 * 현재 추천 주기의 세트가 없으면 이 시점에 생성한다(지연 생성). Suspense 로 감싸 로딩 상태를 보여준다.
 * context: 추천을 이해하기 위한 현재 성장 방향 요약(제목과 추천 패널 사이에 놓인다).
 */
export async function TodayRecommendations({ userId, context }: { userId: string; context?: React.ReactNode }) {
  let today;
  try {
    today = await getTodayRecommendation(userId);
  } catch (err) {
    console.error(err);
    return (
      <>
        <HomeHeading />
        {context}
        <RetryPanel message="오늘의 추천을 만들지 못했어요. 잠시 후 다시 시도해 주세요." />
      </>
    );
  }

  const { set, cards } = today;
  const [library, reflections] = await Promise.all([repo.getLibrary(userId), repo.getReflections(userId)]);
  const itemByContent = new Map(library.map((l) => [l.content_id, l.id]));

  const views: CardView[] = cards.map((c) => ({
    id: c.id,
    slot_type: c.slot_type,
    reason: c.reason,
    basis: c.basis,
    saved: itemByContent.has(c.content_id),
    libraryItemId: itemByContent.get(c.content_id) ?? null,
    content: {
      id: c.content_id,
      title: c.content.title,
      summary: contentSummary(c.content),
      author_source: c.content.author_source,
      est_read_min: c.content.est_read_min,
    },
  }));

  const status = (
    <p
      className="inline-flex items-center gap-1.5 text-caption text-muted"
      title={`다음 교체 ${formatKst(set.cycle_end_at, { withDate: true })}`}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
      다음 추천까지 <span className="font-semibold text-foreground">{formatRemaining(set.cycle_end_at)}</span>
    </p>
  );

  return (
    <>
      <HomeHeading status={status} />
      {context}
      <section aria-label="오늘의 추천 3개" className="overflow-hidden rounded-2xl border border-border bg-card">
        <TodayCards cards={views} />
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-secondary/40 px-5 py-3 text-caption text-muted lg:px-6">
          <p>
            서재에 저장 <span className="font-semibold text-foreground">{library.length}</span> · 회고{" "}
            <span className="font-semibold text-foreground">{reflections.length}</span>
          </p>
          <Link href="/library" className="font-medium text-foreground hover:underline">
            서재 열기 →
          </Link>
        </div>
      </section>
    </>
  );
}
