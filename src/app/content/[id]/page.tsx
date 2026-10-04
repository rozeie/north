import Link from "next/link";
import { notFound } from "next/navigation";
import { requireConfirmedUser } from "@/lib/auth";
import { contentSummary, getContent } from "@/lib/content";
import * as repo from "@/lib/repo";
import { SaveButton } from "@/components/SaveButton";
import { PageTitle, Shell } from "@/components/Shell";
import { TrackView } from "@/components/TrackView";
import { TypeBadge } from "@/components/TypeBadge";

export const dynamic = "force-dynamic";

// 콘텐츠 상세. 추천 카드는 주기마다 교체되므로 content_id 기준으로 조회하고,
// 추천 맥락은 서재 스냅샷 → 현재 추천 카드 순으로 찾는다.
export default async function ContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await requireConfirmedUser();
  const content = getContent(id);
  if (!content) notFound();

  const [library, current] = await Promise.all([repo.getLibrary(user.id), repo.getCurrentRecommendation(user.id, Date.now())]);
  const item = library.find((l) => l.content_id === content.id) ?? null;
  const card = current?.cards.find((c) => c.content_id === content.id) ?? null;
  const ctx = item
    ? { reason: item.reason_snapshot, questions: item.check_questions_snapshot }
    : card
      ? { reason: card.reason, questions: card.check_questions }
      : null;
  const points = content.key_points ?? ctx?.questions ?? [];
  const reflection = item ? await repo.getReflectionByItem(user.id, item.id) : null;

  return (
    <Shell active={item ? "library" : "home"}>
      <TrackView step="content" />
      <nav aria-label="이동 경로" className="mb-4">
        <Link href={item ? "/library" : "/home"} className="btn btn-ghost btn-sm -ml-3">
          ← {item ? "서재로" : "추천으로"}
        </Link>
      </nav>

      <PageTitle eyebrow="콘텐츠 상세" title={content.title}>
        {contentSummary(content)}
      </PageTitle>

      <div className="space-y-6">
        <section aria-label="자료 정보" className="card">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={content.type} />
            <span className="badge badge-outline">{content.difficulty}</span>
          </div>
          <p className="mt-4 text-body-sm text-muted">
            <span className="font-semibold text-ink">출처 </span>
            {content.author_source} · 약 {content.est_read_min}분
          </p>
          <ul className="mt-4 flex flex-wrap gap-2" aria-label="주제 태그">
            {content.topic_tags.map((t) => (
              <li key={t} className="chip">
                {t}
              </li>
            ))}
          </ul>
        </section>

        {ctx ? (
          <>
            <section aria-label="추천 이유" className="card">
              <p className="eyebrow mb-1">지금 이 자료가 필요한 이유</p>
              <p className="text-lead leading-relaxed">{ctx.reason}</p>
            </section>
            {points.length > 0 && (
              <section aria-label="핵심 포인트" className="card-muted text-body-sm">
                <p className="eyebrow mb-1">핵심 포인트</p>
                <ul className="list-disc space-y-1 pl-5 text-muted">
                  {points.map((q) => (
                    <li key={q}>{q}</li>
                  ))}
                </ul>
              </section>
            )}
          </>
        ) : (
          <p className="card-dashed">현재 추천 목록에 없는 자료예요. 홈에서 오늘의 추천을 확인해 보세요.</p>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-6">
          <a href={content.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            원문 보기 ↗
          </a>
          <SaveButton contentId={content.id} cardId={card?.id ?? null} saved={Boolean(item)} />
          {item && (
            <Link href={`/reflection/${item.id}`} className="btn btn-outline">
              {reflection ? "회고 보기" : "읽은 뒤 회고 작성"}
            </Link>
          )}
        </div>
        {reflection && (
          <section aria-label="저장한 회고" className="card-muted text-body-sm">
            <p className="eyebrow mb-1">내가 가져갈 것</p>
            <p>{reflection.takeaway ?? reflection.summary.learned}</p>
          </section>
        )}
        {!item && <p className="hint">저장하면 서재에 보관되고, 읽은 뒤 회고를 이어서 쓸 수 있어요.</p>}
        {item && reflection && <p className="hint">회고를 작성한 자료는 저장을 취소할 수 없어요.</p>}
      </div>
    </Shell>
  );
}
