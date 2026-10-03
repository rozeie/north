import Link from "next/link";
import { getContent } from "@/lib/content";
import { formatDateKst } from "@/lib/cycle";
import type { LibraryItem } from "@/lib/types";
import { TypeBadge } from "./TypeBadge";

/**
 * 내 서재 목록 (조회 전용). 삭제 버튼·메뉴 등 삭제 UI는 MVP 범위에서 제공하지 않는다(F7-9).
 */
export function LibraryList({ items, reflectedIds }: { items: LibraryItem[]; reflectedIds: Set<string> }) {
  if (items.length === 0) {
    return (
      <p className="card-dashed">
        아직 보관한 자료가 없어요. 홈에서 오늘 읽을 자료를 골라 보세요.
      </p>
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
                <span className="text-sm text-faint">{formatDateKst(item.saved_at)} 보관</span>
                {reflected && <span className="badge badge-secondary">회고 작성함</span>}
              </div>
              <h3 className="mt-3 text-lead font-semibold leading-snug">{content.title}</h3>
              <p className="mt-1 text-sm text-faint">
                {content.author_source} · 약 {content.est_read_min}분
              </p>
              <p className="mt-4 text-body-sm text-muted">
                <span className="font-semibold text-ink">추천 이유 </span>
                {item.reason_snapshot}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a href={content.url} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
                  원문 읽기 ↗
                </a>
                <Link href={`/reflection/${item.id}`} className={reflected ? "btn btn-ghost" : "btn btn-primary"}>
                  {reflected ? "회고 보기" : "회고 작성"}
                </Link>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
