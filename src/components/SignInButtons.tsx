"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { track } from "@/lib/analytics";

/** Google 로그인 버튼. 랜딩의 GNB·Hero·하단 CTA 에서 재사용한다. 인증 호출은 기존과 동일. */
export function GoogleSignInButton({
  googleReady,
  className = "btn btn-primary",
  children = "Google로 시작하기",
}: {
  googleReady: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      className={className}
      disabled={busy || !googleReady}
      onClick={() => {
        track("Sign In Click", { provider: "google" });
        setBusy(true);
        void signIn("google", { callbackUrl: "/" });
      }}
    >
      {children}
    </button>
  );
}

/** 개발 전용 안내와 로그인. 일반 랜딩에는 렌더링하지 않고 `/?dev=1` 에서만 노출한다. */
export function DevAuthPanel({ googleReady, devAuth }: { googleReady: boolean; devAuth: boolean }) {
  const [busy, setBusy] = useState(false);

  // 개발용 로그인 → (선택) 샘플 프로필·확정된 성장 방향 채우기 → 지정한 화면으로 이동
  async function enter(opts: { seed: boolean; reset?: boolean }) {
    setBusy(true);
    const res = await signIn("dev", { redirect: false });
    if (res?.error) {
      setBusy(false);
      return;
    }
    if (opts.seed) await fetch(`/api/dev/seed${opts.reset ? "?reset=1" : ""}`, { method: "POST" });
    window.location.href = opts.seed ? "/home" : "/";
  }

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-input p-4">
      {!googleReady && (
        <p className="hint">
          Google OAuth 설정이 없어요. <code>.env.example</code> 을 참고해 <code>GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET</code> 을 설정해 주세요.
        </p>
      )}
      {devAuth && (
        <>
          <p className="hint">로컬 개발 전용 — production 에서는 나타나지 않아요.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void enter({ seed: true })}>
              테스트 계정으로 바로 입장
            </button>
            <button type="button" className="btn btn-outline" disabled={busy} onClick={() => void enter({ seed: true, reset: true })}>
              샘플 상태 초기화 후 입장
            </button>
            <button type="button" className="btn btn-ghost" disabled={busy} onClick={() => void enter({ seed: false })}>
              온보딩부터 체험
            </button>
          </div>
        </>
      )}
    </div>
  );
}
