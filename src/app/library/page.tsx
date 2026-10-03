import { requireConfirmedUser } from "@/lib/auth";
import * as repo from "@/lib/repo";
import { LibraryList } from "@/components/LibraryList";
import { PageTitle, Shell } from "@/components/Shell";
import { TrackView } from "@/components/TrackView";

export const dynamic = "force-dynamic";

export default async function LibraryPage() {
  const user = await requireConfirmedUser();
  const [items, reflections] = await Promise.all([repo.getLibrary(user.id), repo.getReflections(user.id)]);

  return (
    <Shell active="library">
      <TrackView step="library" />
      <PageTitle eyebrow="내 서재" title="오늘 읽기로 고른 자료">
        하루에 한 편씩 직접 고른 자료가 모여요.
      </PageTitle>
      <LibraryList items={items} reflectedIds={new Set(reflections.map((r) => r.library_item_id))} />
    </Shell>
  );
}
