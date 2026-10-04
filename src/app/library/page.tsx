import Link from "next/link";
import { requireConfirmedUser } from "@/lib/auth";
import { CONTENT_TYPE_LABEL, SLOT_ORDER } from "@/lib/constants";
import { getContent } from "@/lib/content";
import * as repo from "@/lib/repo";
import type { ContentType } from "@/lib/types";
import { LibraryList } from "@/components/LibraryList";
import { PageTitle, Shell } from "@/components/Shell";
import { TrackOnMount } from "@/components/TrackEvent";
import { TrackView } from "@/components/TrackView";

export const dynamic = "force-dynamic";

export default async function LibraryPage({ searchParams }: { searchParams: Promise<{ type?: string }> }) {
  const { type } = await searchParams;
  const filter = SLOT_ORDER.find((t) => t === type) as ContentType | undefined;
  const user = await requireConfirmedUser();
  const [items, reflections] = await Promise.all([repo.getLibrary(user.id), repo.getReflections(user.id)]);

  const visible = filter ? items.filter((i) => getContent(i.content_id)?.type === filter) : items;
  const count = (t: ContentType) => items.filter((i) => getContent(i.content_id)?.type === t).length;
  const tabs: { key: ContentType | undefined; label: string; n: number; href: string }[] = [
    { key: undefined, label: "전체", n: items.length, href: "/library" },
    ...SLOT_ORDER.map((t) => ({ key: t, label: CONTENT_TYPE_LABEL[t], n: count(t), href: `/library?type=${t}` })),
  ];

  return (
    <Shell active="library">
      <TrackView step="library" />
      <TrackOnMount event="Library View" props={{ source: "gnb", filter: filter ?? "all", count: items.length }} />
      <PageTitle eyebrow="서재" title="저장한 자료">
        추천에서 저장한 자료가 모여요. 읽고 나면 회고로 이어가 보세요.
      </PageTitle>

      {items.length > 0 && (
        <nav aria-label="유형 필터" className="mb-6 flex flex-wrap gap-2">
          {tabs.map((t) => (
            <Link
              key={t.label}
              href={t.href}
              aria-current={t.key === filter ? "page" : undefined}
              className={`chip ${t.key === filter ? "is-selected font-semibold" : ""}`}
            >
              {t.label} {t.n}
            </Link>
          ))}
        </nav>
      )}

      <LibraryList
        items={visible}
        reflectedIds={new Set(reflections.map((r) => r.library_item_id))}
        takeaways={Object.fromEntries(reflections.filter((r) => r.takeaway).map((r) => [r.library_item_id, r.takeaway!]))}
        emptyMessage={items.length > 0 ? "이 유형으로 저장한 자료가 아직 없어요." : undefined}
        emptyAction={
          items.length > 0 ? (
            <Link href="/library" className="btn btn-outline btn-sm mt-4">
              전체 보기
            </Link>
          ) : undefined
        }
      />
    </Shell>
  );
}
