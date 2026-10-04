import { TrackedLink, TrackOnMount } from "./TrackEvent";
import { SaveButton } from "./SaveButton";
import { TypeBadge } from "./TypeBadge";
import type { CardBasis, ContentType } from "@/lib/types";

export interface CardView {
  id: string;
  slot_type: ContentType;
  reason: string;
  basis: CardBasis;
  saved: boolean;
  libraryItemId: string | null;
  content: { id: string; title: string; summary: string; author_source: string; est_read_min: number };
}

const ACCENT: Record<ContentType, string> = {
  concept: "bg-concept",
  case: "bg-case",
  evidence: "bg-evidence",
};

/**
 * 오늘의 추천 3개: 하나의 패널 안에서 열(셀)로 나란히 비교하는 구조.
 * 셀 전체가 상세로 연결되고(제목 링크를 셀 전체로 확장), 저장 버튼만 별도로 동작한다.
 * 긴 추천 이유와 핵심 포인트는 상세 페이지에서 보여주므로 여기서는 2줄로 요약한다.
 */
export function TodayCards({ cards }: { cards: CardView[] }) {
  return (
    <ol className="grid divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
      {cards.map((card) => {
        const meta = { content_id: card.content.id, content_type: card.slot_type, recommendation_reason: card.reason };
        return (
          <li key={card.id} className="relative flex">
            <TrackOnMount event="Recommendation Viewed" props={{ ...meta, source: "home" }} />
            <article
              aria-label={card.content.title}
              className="group relative flex w-full flex-col p-5 transition-colors hover:bg-secondary/50 has-[a:focus-visible]:bg-secondary/50 lg:p-6"
            >
              <span aria-hidden className={`absolute inset-x-0 top-0 h-0.5 ${ACCENT[card.slot_type]} opacity-60`} />

              <div className="flex items-center justify-between gap-2">
                <TypeBadge type={card.slot_type} />
                <span className="text-caption text-faint">약 {card.content.est_read_min}분</span>
              </div>

              <h3 className="mt-4 line-clamp-2 md:min-h-[3.1rem] text-lead font-semibold leading-snug tracking-tight">
                <TrackedLink
                  href={`/content/${card.content.id}`}
                  className="outline-none after:absolute after:inset-0 after:content-['']"
                  event="Recommendation Detail Click"
                  props={{ ...meta, source: "home_card" }}
                >
                  {card.content.title}
                </TrackedLink>
              </h3>
              <p className="mt-1.5 truncate text-caption text-faint">{card.content.author_source}</p>

              <div className="mt-4 flex-1">
                <p className="eyebrow mb-1 text-brand">추천 이유</p>
                <p className="line-clamp-2 text-body-sm text-muted">{card.reason}</p>
              </div>

              <div className="mt-5 flex items-center justify-between gap-2">
                <span aria-hidden className="text-caption font-medium text-muted transition-colors group-hover:text-foreground">
                  상세 보기 →
                </span>
                <span className="relative z-10">
                  <SaveButton
                    compact
                    contentId={card.content.id}
                    cardId={card.id}
                    saved={card.saved}
                    meta={{ content_type: card.slot_type, recommendation_reason: card.reason, source: "home_card" }}
                  />
                </span>
              </div>
            </article>
          </li>
        );
      })}
    </ol>
  );
}
