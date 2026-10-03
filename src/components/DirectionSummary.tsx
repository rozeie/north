import Link from "next/link";
import type { Direction } from "@/lib/types";

/** 홈 상단: 현재 성장 방향. 추천 카드보다 먼저 보이도록 한다. */
export function DirectionSummary({ direction }: { direction: Direction }) {
  const priority = direction.topics.find((t) => t.id === direction.priority_topic_id);
  return (
    <section aria-label="현재 성장 방향" className="card mb-10">
      <div className="flex items-center justify-between gap-4">
        <p className="eyebrow">현재 성장 방향</p>
        <Link href="/direction" className="btn btn-outline btn-sm">
          수정
        </Link>
      </div>
      <h1 className="mt-3 text-title font-semibold tracking-tight lg:text-title-lg">지금은 ‘{priority?.name}’부터</h1>
      <p className="mt-2 text-body-sm text-muted-foreground">{direction.stuck_hypothesis}</p>
      <ul className="mt-4 flex flex-wrap gap-2" aria-label="학습 주제">
        {direction.topics.map((t) => (
          <li key={t.id} className={`chip ${t.id === direction.priority_topic_id ? "is-selected font-semibold" : ""}`}>
            {t.name}
          </li>
        ))}
      </ul>
    </section>
  );
}
