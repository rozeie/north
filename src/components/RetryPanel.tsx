"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function RetryPanel({ message }: { message: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <div role="alert" className="alert">
      <p>{message}</p>
      <button type="button" className="btn btn-outline mt-3" disabled={pending} onClick={() => start(() => router.refresh())}>
        {pending ? "다시 불러오는 중…" : "다시 시도"}
      </button>
    </div>
  );
}
