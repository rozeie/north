"use client";

import { signOut } from "next-auth/react";
import { track } from "@/lib/analytics";

/** 온보딩 중 나가기: 로그아웃 후 랜딩으로. (랜딩은 로그인 사용자를 현재 단계로 되돌리므로 단순 링크로는 나갈 수 없다) */
export function ExitButton() {
  return (
    <button type="button" className="btn btn-ghost btn-sm" onClick={() => {
        track("Onboarding Exit Click");
        void signOut({ callbackUrl: "/" });
      }}>
      나가기
    </button>
  );
}
