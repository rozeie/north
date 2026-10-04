import Link from "next/link";
import { contentSummary, getContent } from "@/lib/content";
import { formatDateKst } from "@/lib/cycle";
import type { LibraryItem } from "@/lib/types";
import { SaveButton } from "./SaveButton";
import { TrackedLink } from "./TrackEvent";
import { TypeBadge } from "./TypeBadge";

/**
 * 서재 목록. 저장 취소(회고가 없는 자료만 서버가 허용)와 상세·회고 이동을 제공한다.
 * emptyMessage 로 필터 결과 없음 등 상황별 Empty state 문구를 바꿀 수 있다.
 */
export function LibraryList({
  items,
  reflectedIds,
  takeaways,
  emptyMessage,
  emptyAction,
}: {
  items: LibraryItem[];
  reflectedIds: Set<string>;
  /** 서재 항목 id → 저장한 회고("가져갈 것") */
  takeaways?: Record<string, string>;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
}) {
  if (items.length === 0) {
    return (
      <div className="card-dashed">
        <p>{emptyMessage ?? "아직 저장한 자료가 없어요. 추천에서 마음에 드는 자료를 저장해 보세요."}</p>
        {emptyAction ?? (
          <Link href="/home" className="btn btn-primary btn-sm mt-4">
            오늘의 추천 보기
          </Link>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const content = getContent(item.content_id);
        if (!content) return null;
        const reflected = reflectedIds.has(item.id);
        return (
          <li key={item.id}>
            <article className="card">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <TypeBadge type={content.type} />
                <span className="text-sm text-faint">{formatDateKst(item.saved_at)} 저장</span>
                {reflected && <span className="badge badge-secondary">회고 작성함</span>}
              </div>
              <h3 className="mt-3 text-lead font-semibold leading-snug">
                <TrackedLink
                  href={`/content/${content.id}`}
                  className="hover:underline"
                  event="Recommendation Detail Click"
                  props={{ content_id: content.id, content_type: content.type, recommendation_reason: item.reason_snapshot, source: "library" }}
                >
                  {content.title}
                </TrackedLink>
              </h3>
              <p className="mt-1 text-body-sm text-muted">{contentSummary(content)}</p>
              <p className="mt-1 text-sm text-faint">
                {content.author_source} · 약 {content.est_read_min}분
              </p>
              <p className="mt-4 text-body-sm text-muted">
                <span className="font-semibold text-ink">추천 이유 </span>
                {item.reason_snapshot}
              </p>
              {takeaways?.[item.id] && (
                <p className="card-muted mt-4 text-body-sm">
                  <span className="font-semibold">가져갈 것 </span>
                  {takeaways[item.id]}
                </p>
              )}
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <a href={content.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  원문 읽기 ↗
                </a>
                <Link href={`/reflection/${item.id}`} className={reflected ? "btn btn-ghost" : "btn btn-primary"}>
                  {reflected ? "회고 보기" : "회고 작성"}
                </Link>
                {!reflected && <SaveButton contentId={content.id} cardId={null} saved size="sm" meta={{ content_type: content.type, recommendation_reason: item.reason_snapshot, source: "library" }} />}
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
