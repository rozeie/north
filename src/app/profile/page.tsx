import Link from "next/link";
import { requireConfirmedUser } from "@/lib/auth";
import { getContent } from "@/lib/content";
import { formatDateKst } from "@/lib/cycle";
import * as repo from "@/lib/repo";
import { ConcernEditor } from "@/components/ConcernEditor";
import { LibraryList } from "@/components/LibraryList";
import { PageTitle, Shell } from "@/components/Shell";
import { TrackView } from "@/components/TrackView";

export const dynamic = "force-dynamic";

// 커리어 프로필: 현재 커리어 고민 / 현재 성장 방향 / 저장한 자료 / 회고 이력 — 이 4가지만 보여준다(F9).
export default async function ProfilePage() {
  const user = await requireConfirmedUser();
  const [profile, direction, items, reflections] = await Promise.all([
    repo.getProfile(user.id),
    repo.getDirection(user.id),
    repo.getLibrary(user.id),
    repo.getReflections(user.id),
  ]);
  if (!profile || !direction) return null;
  const priority = direction.topics.find((t) => t.id === direction.priority_topic_id);
  const itemById = new Map(items.map((i) => [i.id, i]));

  return (
    <Shell active="profile">
      <TrackView step="profile" />
      <PageTitle eyebrow="커리어 프로필" title="나의 커리어 프로필" />

      <div className="space-y-10">
        <section aria-labelledby="p-concern">
          <h2 id="p-concern" className="mb-3 text-lead font-semibold">
            현재 커리어 고민
          </h2>
          <ConcernEditor initial={profile.current_concern} />
        </section>

        <section aria-labelledby="p-direction">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="p-direction" className="text-lead font-semibold">현재 성장 방향
            </h2>
            <Link href="/direction" className="btn btn-outline btn-sm">
              수정
            </Link>
          </div>
          <p className="text-lead">{direction.stuck_hypothesis}</p>
          <p className="mt-4 text-sm text-muted">
            <span className="font-semibold text-ink">먼저 다룰 주제 </span>
            {priority?.name}
          </p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="eyebrow mb-2">필요한 역량</p>
              <ul className="space-y-1 text-body-sm">
                {direction.skills.map((s) => (
                  <li key={s.id}>{s.name}</li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow mb-2">학습 주제</p>
              <ul className="space-y-1 text-body-sm">
                {direction.topics.map((t) => (
                  <li key={t.id}>{t.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section aria-labelledby="p-library">
          <h2 id="p-library" className="mb-3 text-lead font-semibold">
            저장한 자료
          </h2>
          <LibraryList items={items} reflectedIds={new Set(reflections.map((r) => r.library_item_id))} />
        </section>

        <section aria-labelledby="p-reflections">
          <h2 id="p-reflections" className="mb-3 text-lead font-semibold">
            회고 이력
          </h2>
          {reflections.length === 0 ? (
            <p className="text-muted">아직 작성한 회고가 없어요.</p>
          ) : (
            <ul className="space-y-4">
              {reflections.map((r) => {
                const item = itemById.get(r.library_item_id);
                const content = item && getContent(item.content_id);
                return (
                  <li key={r.id} className="card">
                    <p className="text-sm text-faint">
                      {formatDateKst(r.saved_at)} · {content?.title ?? "자료"}
                    </p>
                    <dl className="mt-3 space-y-3 text-body-sm">
                      <div>
                        <dt className="eyebrow">배운 내용</dt>
                        <dd>{r.summary.learned}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow">아직 남은 고민</dt>
                        <dd>{r.summary.remaining_concern || "—"}</dd>
                      </div>
                      <div>
                        <dt className="eyebrow">다음에 시도해볼 행동</dt>
                        <dd>{r.summary.next_action}</dd>
                      </div>
                    </dl>
                    {item && (
                      <Link
                        href={`/reflection/${item.id}`}
                        className="btn btn-outline btn-sm mt-3"
                      >
                        회고 보기
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </Shell>
  );
}
