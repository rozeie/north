import Link from "next/link";
import { ExitButton } from "./ExitButton";

const NAV = [
  { href: "/home", label: "홈", key: "home" },
  { href: "/library", label: "내 서재", key: "library" },
  { href: "/profile", label: "프로필", key: "profile" },
  { href: "/settings", label: "설정", key: "settings" },
] as const;

export type NavKey = (typeof NAV)[number]["key"];

/**
 * 앱 공통 셸 (랜딩·/start 와 같은 헤더 높이/컨테이너/타이포).
 * - nav=true: 확정 이후 화면. 주 메뉴 4개.
 * - nav=false: 확정 이전 온보딩 화면. 단계 배지 + 나가기.
 */
export function Shell({
  children,
  active,
  nav = true,
  step,
}: {
  children: React.ReactNode;
  active?: NavKey;
  /** 성장 방향 확정 이전 화면에서는 내비게이션을 숨긴다. */
  nav?: boolean;
  /** 온보딩 단계 표시(예: "2 / 2 · 성장 방향 확인") */
  step?: string;
}) {
  return (
    <div className="min-h-dvh bg-card">
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-5">
          <Link href={nav ? "/home" : "/"} className="text-lead font-semibold tracking-tight">
            North
          </Link>
          {nav ? (
            <nav aria-label="주 메뉴" className="-mr-2 flex items-center gap-1">
              {NAV.map((n) => (
                <Link key={n.key} href={n.href} aria-current={active === n.key ? "page" : undefined} className="nav-link">
                  {n.label}
                </Link>
              ))}
            </nav>
          ) : (
            step && (
              <nav aria-label="온보딩" className="flex items-center gap-2">
                <span className="badge badge-outline" aria-current="step">
                  {step}
                </span>
                <ExitButton />
              </nav>
            )
          )}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-5 py-10 lg:py-14">
        <div className="mx-auto w-full max-w-3xl">{children}</div>
      </main>
    </div>
  );
}

export function PageTitle({ eyebrow, title, children }: { eyebrow?: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="mb-8">
      {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
      <h1 className="text-title font-semibold tracking-tight lg:text-title-lg">{title}</h1>
      {children && <div className="mt-3 text-lead text-muted-foreground">{children}</div>}
    </div>
  );
}
