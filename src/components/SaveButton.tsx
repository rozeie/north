"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { track, type EventMeta } from "@/lib/analytics";

/**
 * 저장 / 저장 취소 토글. 서버(서재)가 단일 진실이며, 성공하면 router.refresh() 로
 * 추천 홈·상세·서재가 같은 상태를 보게 한다.
 * - 저장은 현재 추천 카드(cardId)가 필요하다. 없으면 취소만 가능하다.
 * - 회고가 있는 자료는 취소 불가(서버가 409).
 */
export function SaveButton({
  contentId,
  cardId,
  saved,
  size = "md",
  compact = false,
  meta,
}: {
  contentId: string;
  cardId: string | null;
  saved: boolean;
  size?: "sm" | "md";
  /** 카드용 간결 버튼: 북마크 아이콘 + 짧은 라벨 */
  compact?: boolean;
  /** Mixpanel 속성(content_type, recommendation_reason, source) */
  meta?: Omit<EventMeta, "content_id">;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const isSaved = optimistic ?? saved;

  async function toggle() {
    if (busy) return;
    if (!isSaved && !cardId) return;
    setBusy(true);
    setError("");
    const next = !isSaved;
    setOptimistic(next);
    try {
      const res = await fetch("/api/library", {
        method: next ? "POST" : "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next ? { card_id: cardId } : { content_id: contentId }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setOptimistic(null);
        setError(data.error ?? "처리하지 못했어요. 다시 시도해 주세요.");
      } else {
        track(next ? "Recommendation Save" : "Recommendation Unsave", { content_id: contentId, ...meta });
        router.refresh();
      }
    } catch {
      setOptimistic(null);
      setError("네트워크 문제로 처리하지 못했어요.");
    }
    setBusy(false);
  }

  const sm = size === "sm" || compact ? " btn-sm" : "";
  if (compact) {
    return (
      <span className="inline-flex flex-col items-end gap-1">
        <button
          type="button"
          onClick={toggle}
          disabled={busy || (!isSaved && !cardId)}
          aria-pressed={isSaved}
          aria-label={isSaved ? "저장 취소" : "서재에 저장"}
          title={isSaved ? "저장 취소" : "서재에 저장"}
          className={`btn btn-sm ${isSaved ? "btn-secondary" : "btn-outline"}`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill={isSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden>
            <path d="M6 3h12v18l-6-4-6 4V3z" />
          </svg>
          {isSaved ? "저장됨" : "저장"}
        </button>
        {error && (
          <span role="alert" className="text-caption text-danger">
            {error}
          </span>
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={toggle}
        disabled={busy || (!isSaved && !cardId)}
        aria-pressed={isSaved}
        className={`btn ${isSaved ? "btn-outline" : "btn-primary"}${sm}`}
      >
        {busy ? "처리 중…" : isSaved ? "저장됨 · 저장 취소" : "서재에 저장"}
      </button>
      {error && (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      )}
    </span>
  );
}
