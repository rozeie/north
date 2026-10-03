"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { REFLECTION_QUESTIONS } from "@/lib/constants";
import type { ReflectionAnswers, ReflectionSummary } from "@/lib/types";
import { track } from "@/lib/analytics";

type Step = "draft" | "summarized"; // 저장(Saved) 이후에는 서버가 읽기 화면을 렌더링한다

export function ReflectionFlow({ libraryItemId }: { libraryItemId: string }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("draft");
  const [answers, setAnswers] = useState<ReflectionAnswers>({ q1: "", q2: "", q3: "" });
  const [summary, setSummary] = useState<ReflectionSummary>({ learned: "", remaining_concern: "", next_action: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function summarize() {
    if (!answers.q1.trim() || !answers.q2.trim()) {
      setError("처음 두 질문에는 간단히라도 답해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reflections/summarize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ library_item_id: libraryItemId, answers }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string; summary?: ReflectionSummary };
      if (!data.ok || !data.summary) {
        setError(data.error ?? "정리하지 못했어요. 다시 시도해 주세요."); // 작성한 답변은 유지된다
      } else {
        setSummary(data.summary);
        setStep("summarized");
      }
    } catch {
      setError("네트워크 문제로 정리하지 못했어요. 작성한 내용은 그대로 남아 있어요.");
    }
    setBusy(false);
  }

  async function save() {
    if (!summary.learned.trim() || !summary.next_action.trim()) {
      setError("배운 내용과 다음에 시도해볼 행동은 비워둘 수 없어요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ library_item_id: libraryItemId, answers, summary }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "저장하지 못했어요. 다시 시도해 주세요.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      setError("네트워크 문제로 저장하지 못했어요. 다시 시도해 주세요.");
      setBusy(false);
    }
  }

  const errorBox = error && (
    <p role="alert" className="text-sm text-danger">
      {error}
    </p>
  );

  if (step === "draft") {
    return (
      <form
        className="space-y-7"
        onSubmit={(e) => {
          e.preventDefault();
          void summarize();
        }}
      >
        {REFLECTION_QUESTIONS.map((q) => (
          <div key={q.key}>
            <label htmlFor={q.key} className="label">
              {q.label}
            </label>
            <textarea
              id={q.key}
              rows={3}
              className="field"
              value={answers[q.key] ?? ""}
              onChange={(e) => setAnswers({ ...answers, [q.key]: e.target.value })}
            />
          </div>
        ))}
        {errorBox}
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "정리하고 있어요…" : "정리하기"}
        </button>
      </form>
    );
  }

  const fields: { key: keyof ReflectionSummary; label: string }[] = [
    { key: "learned", label: "배운 내용" },
    { key: "remaining_concern", label: "아직 남은 고민" },
    { key: "next_action", label: "다음에 시도해볼 행동" },
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-center gap-3">
        <span className="ai-label">AI가 제안한 정리</span>
        <p className="text-sm text-muted">내 생각과 다르면 직접 고쳐 주세요. 저장한 내용이 다음 추천의 맥락이 돼요.</p>
      </div>
      {fields.map((f) => (
        <div key={f.key}>
          <label htmlFor={f.key} className="label">
            {f.label}
          </label>
          <textarea
            id={f.key}
            rows={3}
            className="field"
            value={summary[f.key]}
            onChange={(e) => setSummary({ ...summary, [f.key]: e.target.value })}
          />
        </div>
      ))}
      {errorBox}
      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-primary" onClick={() => {
            track("Reflection Save Click");
            void save();
          }} disabled={busy}>
          {busy ? "저장하고 있어요…" : "회고 저장"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setStep("draft")} disabled={busy}>
          답변 고치기
        </button>
        <Link href="/library" className="btn btn-ghost">
          나중에 하기
        </Link>
      </div>
    </div>
  );
}
