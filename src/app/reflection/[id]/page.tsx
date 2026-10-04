import Link from "next/link";
import { notFound } from "next/navigation";
import { requireConfirmedUser } from "@/lib/auth";
import { getContent } from "@/lib/content";
import * as repo from "@/lib/repo";
import { ReflectionFlow } from "@/components/ReflectionFlow";
import { ReflectionView } from "@/components/ReflectionView";
import { PageTitle, Shell } from "@/components/Shell";
import { TrackView } from "@/components/TrackView";

export const dynamic = "force-dynamic";

export default async function ReflectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;
  const user = await requireConfirmedUser();
  const item = await repo.getLibraryItem(user.id, id);
  const content = item && getContent(item.content_id);
  if (!item || !content) notFound();

  const reflection = await repo.getReflectionByItem(user.id, item.id);

  return (
    <Shell active="library">
      <TrackView step="reflection" />
      <PageTitle eyebrow={reflection ? "회고 보기" : "회고 작성"} title={content.title} />

      <section aria-label="추천 맥락" className="card-muted mb-10 text-body-sm">
        <p className="eyebrow mb-1">추천 이유</p>
        <p>{item.reason_snapshot}</p>
        <p className="eyebrow mb-1 mt-4">읽으면서 확인할 질문</p>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          {item.check_questions_snapshot.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-outline btn-sm mt-4"
        >
          원문 읽기 ↗
        </a>
      </section>

      {reflection ? (
        <>
          {saved === "1" && (
            <p role="status" className="card-muted mb-6 text-body-sm font-semibold">
              회고를 저장했어요. 다음 추천에 반영돼요.
            </p>
          )}
          <ReflectionView reflection={reflection} />
          <div className="mt-10">
            <Link href="/library" className="btn btn-outline">
              서재로
            </Link>
            <Link href="/home" className="btn btn-ghost ml-3">
              오늘의 추천 보기
            </Link>
          </div>
        </>
      ) : (
        <ReflectionFlow
          libraryItemId={item.id}
          meta={{ content_id: content.id, content_type: content.type, recommendation_reason: item.reason_snapshot, source: "reflection_page" }}
        />
      )}
    </Shell>
  );
}
