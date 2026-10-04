import Link from "next/link";
import type { Direction } from "@/lib/types";

/** 홈의 context 영역: 추천 기준이 되는 현재 성장 방향을 한 줄로 요약한다. 추천 패널보다 한 단계 낮게 보이도록 작게 둔다. */
export function DirectionSummary({ direction }: { direction: Direction }) {
  const priority = direction.topics.find((t) => t.id === direction.priority_topic_id);
  const others = direction.topics.filter((t) => t.id !== direction.priority_topic_id);
  return (
    <section aria-label="현재 성장 방향" className="mb-5 flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl bg-secondary/60 px-4 py-2.5">
      <p className="text-caption text-muted">현재 성장 방향</p>
      <p className="text-body-sm font-semibold">{priority?.name}</p>
      {others.length > 0 && (
        <ul className="flex flex-wrap gap-1.5" aria-label="보조 키워드">
          {others.map((t) => (
            <li key={t.id} className="badge badge-outline bg-card font-medium text-muted">
              {t.name}
            </li>
          ))}
        </ul>
      )}
      <Link href="/direction" className="ml-auto text-caption font-medium text-muted hover:text-foreground hover:underline">
        수정
      </Link>
    </section>
  );
}
