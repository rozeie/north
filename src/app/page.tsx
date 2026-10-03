import Link from "next/link";
import { redirect } from "next/navigation";
import { devAuthEnabled, getSessionUser, routeForState } from "@/lib/auth";
import * as repo from "@/lib/repo";
import { DevAuthPanel, GoogleSignInButton } from "@/components/SignInButtons";
import { TypeBadge } from "@/components/TypeBadge";

const CONTAINER = "mx-auto w-full max-w-6xl px-5";

export default async function LandingPage({ searchParams }: { searchParams: Promise<{ dev?: string }> }) {
  const user = await getSessionUser();
  if (user) redirect(routeForState(await repo.getOnboardingState(user.id)));

  const googleReady = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  const showDev = (await searchParams).dev === "1";

  return (
    <div className="min-h-dvh bg-card">
      {/* GNB */}
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className={`${CONTAINER} flex h-14 items-center justify-between gap-4`}>
          <Link href="/" className="text-lead font-semibold tracking-tight">
            North
          </Link>
          <nav aria-label="랜딩 메뉴" className="flex items-center gap-1">
            <a href="#intro" className="nav-link hidden sm:inline-flex">
              서비스 소개
            </a>
            <a href="#how" className="nav-link hidden sm:inline-flex">
              이용 방법
            </a>
            <GoogleSignInButton googleReady={googleReady} className="btn btn-primary btn-sm ml-1">
              Google로 시작하기
            </GoogleSignInButton>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section id="intro" className="scroll-mt-14 border-b border-border">
          <div className={`${CONTAINER} grid items-center gap-12 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:py-24`}>
            <div>
              <span className="badge badge-outline">신입·주니어 커리어 성장 가이드</span>
              <h1 className="mt-5 text-display font-semibold tracking-tight lg:text-display-lg">
                지금 내 커리어에서,
                <br />
                무엇을 배워야 할지 모르겠다면
              </h1>
              <p className="mt-5 max-w-lg text-lead text-muted-foreground">
                현재 고민과 경험을 바탕으로
                <br />
                지금 필요한 성장 방향과 오늘의 학습을 연결해요.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <GoogleSignInButton googleReady={googleReady} className="btn btn-primary btn-lg" />
                <a href="#how" className="btn btn-outline btn-lg">
                  어떻게 작동하나요
                </a>
              </div>
              <p className="hint mt-4">AI는 평가하지 않고, 고민을 학습 가능한 문제로 정리하는 초안만 제안해요.</p>
              {showDev && (
                <div className="mt-6 max-w-lg">
                  <DevAuthPanel googleReady={googleReady} devAuth={devAuthEnabled()} />
                </div>
              )}
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* 서비스 특징 */}
        <section aria-label="서비스 특징" className={`${CONTAINER} py-6`}>
          <ul className="grid divide-y divide-border rounded-xl border border-border bg-card sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              ["평가하지 않아요", "점수나 합격 여부 대신, 막힌 지점을 정리해요."],
              ["내가 확정해요", "AI 초안은 직접 고치고 확정해야 반영돼요."],
              ["하루 한 편이면 충분해요", "개념·사례·근거 중 오늘 읽을 한 편만 골라요."],
            ].map(([title, body]) => (
              <li key={title} className="px-4 py-3">
                <p className="text-body-sm font-semibold leading-snug">{title}</p>
                <p className="text-caption text-muted-foreground">{body}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* 이용 방법 */}
        <section id="how" aria-labelledby="how-title" className="scroll-mt-14 border-y border-border bg-secondary/40">
          <div className={`${CONTAINER} py-10 lg:py-12`}>
            <p className="eyebrow">이용 방법</p>
            <h2 id="how-title" className="mt-1 text-title font-semibold tracking-tight lg:text-title-lg">
              세 단계로 오늘의 학습까지
            </h2>
            <ol className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-y-0">
              <StepCard n="01" title="고민을 알려주세요" body="직군과 경력 단계, 지금 막힌 고민을 적어요. 이력서 PDF는 선택이에요.">
                <StepConcern />
              </StepCard>
              <StepCard n="02" title="성장 방향을 확인하고 수정하세요" body="막힌 지점과 학습 주제를 초안으로 보고, 직접 고쳐 확정해요.">
                <StepDirection />
              </StepCard>
              <StepCard n="03" title="오늘 읽을 한 편을 선택하세요" body="방향에 맞는 자료 3개와 지금 필요한 이유 중 한 편을 골라요.">
                <StepPick />
              </StepCard>
            </ol>
          </div>
        </section>

        {/* 하단 CTA */}
        <section aria-label="시작하기" className={`${CONTAINER} py-8 lg:py-10`}>
          <div className="card flex flex-col items-start justify-between gap-4 !border-foreground/20 shadow-xs sm:flex-row sm:items-center sm:!px-8">
            <div>
              <h2 className="text-title font-semibold leading-snug tracking-tight">고민 한 줄이면 시작할 수 있어요</h2>
              <p className="mt-1 text-body-sm text-muted-foreground">Google 계정으로 바로 시작하고, 방향은 언제든 다시 고칠 수 있어요.</p>
            </div>
            <GoogleSignInButton googleReady={googleReady} className="btn btn-primary btn-lg shrink-0" />
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className={`${CONTAINER} flex h-16 items-center justify-between text-caption text-muted-foreground`}>
          <span className="font-semibold text-foreground">North</span>
          <span>지금 필요한 성장 방향</span>
        </div>
      </footer>
    </div>
  );
}

/* ---------- Hero: 실제 제품 UI 프리뷰 (고민 → 성장 방향 → 오늘의 추천) ---------- */

function HeroPreview() {
  return (
    <div aria-hidden="true" className="rounded-xl border border-border bg-secondary/40 p-3 sm:p-4">
      <div className="space-y-3">
        <div className="card card-compact bg-card">
          <p className="eyebrow">1 · 현재 고민</p>
          <p className="mt-2 text-body-sm">“인터뷰 결과를 솔루션으로 연결할 때 확신이 없어요”</p>
        </div>

        <Connector />

        <div className="card card-compact bg-card">
          <div className="flex items-center justify-between gap-2">
            <p className="eyebrow">2 · 성장 방향</p>
            <span className="ai-label badge">초안</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="chip is-selected font-semibold">기회 정의</span>
            <span className="chip">가설 검증</span>
            <span className="chip">리서치 합성</span>
          </div>
        </div>

        <Connector />

        <div className="card card-compact bg-card">
          <p className="eyebrow">3 · 오늘의 추천</p>
          <ul className="mt-3 divide-y divide-border">
            {(
              [
                ["concept", "문제 정의와 기회 정의는 어떻게 다른가"],
                ["case", "인터뷰 인사이트를 우선순위로 바꾼 사례"],
                ["evidence", "리서치 합성 방법을 비교한 연구"],
              ] as const
            ).map(([type, title]) => (
              <li key={type} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                <TypeBadge type={type} />
                <span className="text-body-sm">{title}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Connector() {
  return <div className="mx-auto h-4 w-px bg-input" />;
}

/* ---------- 이용 방법: 단계 카드 + 미니 프리뷰 ---------- */

function StepCard({ n, title, body, children }: { n: string; title: string; body: string; children: React.ReactNode }) {
  return (
    // lg: 세 카드가 subgrid 로 같은 행을 공유 → 제목·설명·미니 UI 시작선과 미니 UI 높이가 맞춰진다
    <li className="card flex flex-col gap-3 !p-5 lg:row-span-2 lg:grid lg:grid-rows-subgrid">
      <div>
        <span className="badge badge-secondary">{n}</span>
        <h3 className="mt-2 text-lead font-semibold leading-snug">{title}</h3>
        <p className="mt-1 text-body-sm text-muted-foreground">{body}</p>
      </div>
      <div aria-hidden="true" className="flex flex-col justify-center rounded-lg border border-border bg-secondary/40 p-3">
        {children}
      </div>
    </li>
  );
}

function StepConcern() {
  return (
    <div className="space-y-3">
      <div className="choice is-selected !cursor-default !py-2 text-body-sm">주니어 PM·서비스 기획자</div>
      <div>
        <p className="label !mb-1">현재 커리어 고민</p>
        <div className="field !min-h-0 text-body-sm text-muted-foreground">인터뷰 결과를 솔루션으로 연결할 때 확신이 없어요</div>
      </div>
    </div>
  );
}

function StepDirection() {
  return (
    <div className="space-y-2">
      {[
        ["기회 정의", true],
        ["가설 검증", false],
        ["리서치 합성", false],
      ].map(([name, priority]) => (
        <div key={String(name)} className="card card-compact flex items-center justify-between !rounded-lg !py-2.5 bg-card">
          <span className="text-body-sm font-medium">{name}</span>
          {priority && <span className="badge badge-outline">우선</span>}
        </div>
      ))}
      <div className="btn btn-primary btn-sm w-full">방향 확정하기</div>
    </div>
  );
}

function StepPick() {
  return (
    <div className="space-y-2">
      {(
        [
          ["concept", false],
          ["case", true],
          ["evidence", false],
        ] as const
      ).map(([type, selected]) => (
        <div
          key={type}
          className={`card card-compact flex items-center justify-between !rounded-lg !py-2.5 bg-card ${
            selected ? "!border-brand ring-1 ring-brand" : ""
          }`}
        >
          <TypeBadge type={type} />
          {selected && <span className="ai-label badge">오늘 읽을 자료</span>}
        </div>
      ))}
    </div>
  );
}
