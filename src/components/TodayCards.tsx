"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { TypeBadge } from "./TypeBadge";
import type { CardBasis, ContentType } from "@/lib/types";

export interface CardView {
  id: string;
  slot_type: ContentType;
  reason: string;
  check_questions: string[];
  basis: CardBasis;
  content: { title: string; author_source: string; url: string; est_read_min: number };
}

type CardState = "open" | "selected" | "locked";

export function TodayCards({
  cards,
  selectedCardId,
  libraryItemId,
}: {
  cards: CardView[];
  selectedCardId: string | null;
  libraryItemId: string | null;
}) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  // 확인 모달이 열린 상태(Confirming). 서버에는 저장하지 않는다.
  const [pending, setPending] = useState<CardView | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (pending && !dlg.open) dlg.showModal();
    if (!pending && dlg.open) dlg.close();
  }, [pending]);

  function cancel() {
    if (submitting) return;
    setPending(null);
    setError("");
  }

  async function confirm() {
    if (!pending) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/recommendations/select", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ card_id: pending.id }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "선택하지 못했어요. 다시 시도해 주세요.");
        if (res.status === 409) router.refresh();
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
      setPending(null);
      router.refresh();
    } catch {
      setError("네트워크 문제로 선택하지 못했어요. 다시 시도해 주세요.");
      setSubmitting(false);
    }
  }

  return (
    <>
      <ol className="space-y-6">
        {cards.map((card) => {
          const state: CardState = !selectedCardId ? "open" : card.id === selectedCardId ? "selected" : "locked";
          return (
            <li key={card.id}>
              <Card card={card} state={state} libraryItemId={libraryItemId} onSelect={() => setPending(card)} />
            </li>
          );
        })}
      </ol>

      <dialog
        ref={dialogRef}
        aria-labelledby="confirm-title"
        aria-describedby="confirm-desc"
        onCancel={(e) => {
          e.preventDefault();
          cancel();
        }}
        onClick={(e) => {
          if (e.target === dialogRef.current) cancel(); // 바깥 클릭 = 취소
        }}
        className="dialog"
      >
        {pending && (
          <div className="dialog-body">
            <div>
              <p className="eyebrow mb-2">선택한 자료</p>
            <p className="text-lead font-semibold leading-snug">{pending.content.title}</p>
            </div>
            <h2 id="confirm-title" className="dialog-title">
              오늘 읽을 자료로 선택할까요?
            </h2>
            <p id="confirm-desc" className="dialog-description">
              선택을 확정하면 오늘은 다른 자료로 변경할 수 없어요.
            </p>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="dialog-footer">
              <button type="button" className="btn btn-outline" onClick={cancel} disabled={submitting}>
                취소
              </button>
              <button type="button" className="btn btn-primary" onClick={() => void confirm()} disabled={submitting}>
                {submitting ? "선택하는 중…" : "이 자료 선택하기"}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

function Card({
  card,
  state,
  libraryItemId,
  onSelect,
}: {
  card: CardView;
  state: CardState;
  libraryItemId: string | null;
  onSelect: () => void;
}) {
  const tone =
    state === "selected"
      ? "border-accent bg-surface ring-1 ring-accent"
      : state === "locked"
        ? "border-line bg-transparent opacity-55"
        : "border-line bg-surface";

  return (
    <article aria-label={card.content.title} className={`card ${tone}`}>
      <div className="flex flex-wrap items-center gap-2">
        <TypeBadge type={card.slot_type} />
        {state === "selected" && <span className="ai-label">오늘 읽을 자료</span>}
      </div>

      <h3 className="mt-3 text-lead font-semibold leading-snug">{card.content.title}</h3>

      <div className="mt-5">
        <p className="eyebrow mb-1">지금 이 자료가 필요한 이유</p>
        <p className="text-lead leading-relaxed">{card.reason}</p>
      </div>

      <p className="mt-4 text-sm text-muted">
        <span className="font-semibold text-ink">추천 근거 </span>
        {card.basis.label}
        {card.basis.quote && <span> · “{card.basis.quote}”</span>}
      </p>

      <div className="mt-5">
        <p className="eyebrow mb-1">읽으면서 확인할 질문</p>
        <ul className="list-disc space-y-1 pl-5 text-body-sm text-muted marker:text-faint">
          {card.check_questions.map((q) => (
            <li key={q}>{q}</li>
          ))}
        </ul>
      </div>

      <p className="mt-5 text-sm text-faint">
        {card.content.author_source} · 약 {card.content.est_read_min}분
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-line pt-5">
        {state === "open" && (
          <>
            <button type="button" className="btn btn-primary" onClick={onSelect}>
              오늘 읽을 자료로 선택
            </button>
            <span className="hint">원문은 선택하면 열 수 있어요.</span>
          </>
        )}
        {state === "selected" && (
          <>
            <a href={card.content.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
              원문 읽기 ↗
            </a>
            {libraryItemId && (
              <Link href={`/reflection/${libraryItemId}`} className="btn btn-outline">
                회고 작성하기
              </Link>
            )}
          </>
        )}
        {state === "locked" && (
          <button type="button" className="btn btn-outline" disabled>
            선택할 수 없어요
          </button>
        )}
      </div>
    </article>
  );
}
