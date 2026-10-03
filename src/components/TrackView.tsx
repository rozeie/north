"use client";

import { useEffect } from "react";

/** 단계 진입 이벤트 기록 (F10-1) */
export function TrackView({ step }: { step: string }) {
  useEffect(() => {
    fetch("/api/events", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: "step_entered", props: { step } }),
    }).catch(() => undefined);
  }, [step]);
  return null;
}
