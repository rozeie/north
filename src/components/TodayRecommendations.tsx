import { formatKst } from "@/lib/cycle";
import { getTodayRecommendation } from "@/lib/recommend";
import * as repo from "@/lib/repo";
import { RetryPanel } from "./RetryPanel";
import { TodayCards, type CardView } from "./TodayCards";

/**
 * 오늘의 추천 (서버 컴포넌트).
 * 현재 추천 주기의 세트가 없으면 이 시점에 생성한다(지연 생성). Suspense 로 감싸 로딩 상태를 보여준다.
 */
export async function TodayRecommendations({ userId }: { userId: string }) {
  let today;
  try {
    today = await getTodayRecommendation(userId);
  } catch (err) {
    console.error(err);
    return <RetryPanel message="오늘의 추천을 만들지 못했어요. 잠시 후 다시 시도해 주세요." />;
  }

  const { set, cards } = today;
  const library = set.selected_card_id ? await repo.getLibrary(userId) : [];
  const libraryItemId = library.find((l) => l.source_card_id === set.selected_card_id)?.id ?? null;

  const views: CardView[] = cards.map((c) => ({
    id: c.id,
    slot_type: c.slot_type,
    reason: c.reason,
    check_questions: c.check_questions,
    basis: c.basis,
    content: {
      title: c.content.title,
      author_source: c.content.author_source,
      url: c.content.url,
      est_read_min: c.content.est_read_min,
    },
  }));

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lead font-semibold">오늘의 추천</h2>
        <p className="text-body-sm text-muted-foreground">
          {set.selected_card_id ? "오늘 읽을 자료를 골랐어요. " : "한 편만 고를 수 있어요. "}
          다음 교체 {formatKst(set.cycle_end_at, { withDate: true })}
        </p>
      </div>
      <TodayCards cards={views} selectedCardId={set.selected_card_id} libraryItemId={libraryItemId} />
    </div>
  );
}
