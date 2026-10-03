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

export default async function ReflectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
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
          <ReflectionView reflection={reflection} />
          <div className="mt-10">
            <Link href="/library" className="btn btn-outline">
              서재로
            </Link>
          </div>
        </>
      ) : (
        <ReflectionFlow libraryItemId={item.id} />
      )}
    </Shell>
  );
}
