import { requireConfirmedUser } from "@/lib/auth";
import * as repo from "@/lib/repo";
import { PageTitle, Shell } from "@/components/Shell";
import { SettingsForm } from "@/components/SettingsForm";
import { TrackView } from "@/components/TrackView";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireConfirmedUser();
  const setting = await repo.getSetting(user.id);

  return (
    <Shell active="settings">
      <TrackView step="settings" />
      <PageTitle eyebrow="설정" title="설정" />
      <SettingsForm initialTime={setting.recommendation_time} />
    </Shell>
  );
}
