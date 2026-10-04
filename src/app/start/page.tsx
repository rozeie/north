import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser, routeForState } from "@/lib/auth";
import * as repo from "@/lib/repo";
import { ExitButton } from "@/components/ExitButton";
import { StartForm } from "@/components/StartForm";
import { TrackView } from "@/components/TrackView";

export default async function StartPage({ searchParams }: { searchParams: Promise<{ reanalyze?: string }> }) {
  const { reanalyze: re } = await searchParams;
  const user = await requireUser();
  const state = await repo.getOnboardingState(user.id);
  // 최초 분석은 1회만. 확정 이후에는 ?reanalyze=1 로만 다시 들어올 수 있다.
  const reanalyze = re === "1" && state === "DirectionConfirmed";
  if (state !== "SignedIn" && !reanalyze) redirect(routeForState(state));
  const profile = reanalyze ? await repo.getProfile(user.id) : null;

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
              {reanalyze ? "프로필 다시 분석" : "1 / 2 · 시작하기"}
            </span>
            {reanalyze ? (
              <Link href="/direction" className="btn btn-ghost btn-sm">
                취소
              </Link>
            ) : (
              <ExitButton />
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-10 lg:py-14">
        <div className="mx-auto w-full max-w-3xl">
          <TrackView step={reanalyze ? "reanalyze" : "start"} />
          <div className="mb-8">
            <h1 className="text-title font-semibold tracking-tight lg:text-title-lg">{reanalyze ? "프로필을 다시 분석할게요" : "지금의 커리어와 고민을 알려 주세요"}</h1>
            {reanalyze && (
              <p role="note" className="card-muted mt-3 text-body-sm">
                새 초안을 확정하기 전까지는 오늘의 추천이 잠시 멈춰요. 저장한 자료와 회고는 그대로 유지돼요. 이력서 PDF는 저장하지 않으니 필요하면 다시 올려 주세요.
              </p>
            )}
            <p className="mt-3 text-lead text-muted-foreground">
              입력한 내용을 바탕으로 AI가 성장 방향의 <strong className="font-semibold text-foreground">초안</strong>을 제안해요. 다음
              화면에서 직접 고치고 확정할 수 있어요.
            </p>
          </div>
          <StartForm
            reanalyze={reanalyze}
            initial={
              profile
                ? {
                    jobFamily: profile.job_family,
                    stage: profile.career_stage,
                    role: profile.target_role,
                    concern: profile.current_concern,
                    cover: profile.cover_letter_text ?? "",
                    portfolio: profile.portfolio_text ?? "",
                  }
                : undefined
            }
          />
        </div>
      </main>
    </div>
  );
}
