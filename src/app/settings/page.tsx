import { requireConfirmedUser } from "@/lib/auth";
import * as repo from "@/lib/repo";
import { DirectionTabs, PageTitle, Shell } from "@/components/Shell";
import { SettingsForm } from "@/components/SettingsForm";
import { TrackView } from "@/components/TrackView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireConfirmedUser();
  const setting = await repo.getSetting(user.id);

  return (
    <Shell active="direction">
      <TrackView step="settings" />
      <PageTitle eyebrow="내 방향" title="설정" />
      <DirectionTabs active="settings" />
      <SettingsForm initialTime={setting.recommendation_time} />
    </Shell>
  );
}
