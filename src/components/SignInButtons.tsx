"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

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
  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-dashed border-input p-4">
      {!googleReady && (
        <p className="hint">
          Google OAuth 설정이 없어요. <code>.env.example</code> 을 참고해 <code>GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET</code> 을 설정해 주세요.
        </p>
      )}
      {devAuth && (
        <button
          type="button"
          className="btn btn-outline"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void signIn("dev", { callbackUrl: "/" });
          }}
        >
          개발용 로그인 (로컬 전용)
        </button>
      )}
    </div>
  );
}
