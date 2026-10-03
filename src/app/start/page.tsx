import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, routeForState } from "@/lib/auth";
import * as repo from "@/lib/repo";
import { ExitButton } from "@/components/ExitButton";
import { StartForm } from "@/components/StartForm";
import { TrackView } from "@/components/TrackView";

export default async function StartPage() {
  const user = await requireUser();
  const state = await repo.getOnboardingState(user.id);
  // 이력서는 최초 1회만 분석한다. 이미 분석했다면 다음 단계로 보낸다.
  if (state !== "SignedIn") redirect(routeForState(state));

  // 랜딩(/)과 같은 헤더·컨테이너·타이포 체계. 공용 Shell(serif/베이지)은 사용하지 않는다.
  return (
    <div className="min-h-dvh bg-card">
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <Link href="/" className="text-lead font-semibold tracking-tight">
            North
          </Link>
          <nav aria-label="온보딩" className="flex items-center gap-2">
            <span className="badge badge-outline" aria-current="step">
              1 / 2 · 시작하기
            </span>
            <ExitButton />
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-10 lg:py-14">
        <div className="mx-auto w-full max-w-3xl">
          <TrackView step="start" />
          <div className="mb-8">
            <h1 className="text-title font-semibold tracking-tight lg:text-title-lg">지금의 커리어와 고민을 알려 주세요</h1>
            <p className="mt-3 text-lead text-muted-foreground">
              입력한 내용을 바탕으로 AI가 성장 방향의 <strong className="font-semibold text-foreground">초안</strong>을 제안해요. 다음
              화면에서 직접 고치고 확정할 수 있어요.
            </p>
          </div>
          <StartForm />
        </div>
      </main>
    </div>
  );
}
