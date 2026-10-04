"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { track, type EventMeta } from "@/lib/analytics";

const MAX = 300;

/** 가벼운 회고: 이 콘텐츠에서 가져갈 것 1~2문장만 저장한다. */
export function ReflectionFlow({ libraryItemId, meta }: { libraryItemId: string; meta: EventMeta }) {
  const router = useRouter();
  const [takeaway, setTakeaway] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!takeaway.trim()) {
      setError("가져갈 것을 한 문장이라도 적어 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    track("Reflection Save Click", meta);
    try {
      const res = await fetch("/api/reflections", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ library_item_id: libraryItemId, takeaway }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "저장하지 못했어요. 다시 시도해 주세요.");
        setBusy(false);
        return;
      }
      track("Reflection Save", { ...meta, length: takeaway.trim().length });
      router.replace(`/reflection/${libraryItemId}?saved=1`);
      router.refresh();
    } catch {
      setError("네트워크 문제로 저장하지 못했어요. 작성한 내용은 그대로 남아 있어요.");
      setBusy(false);
    }
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
    >
      <div>
        <label htmlFor="takeaway" className="label">
          이 콘텐츠에서 가져갈 것은 무엇인가요?
        </label>
        <p className="hint mb-2">1~2문장이면 충분해요. 저장한 내용은 다음 추천의 맥락이 돼요.</p>
        <textarea
          id="takeaway"
          rows={3}
          maxLength={MAX}
          className="field"
          placeholder="예: 우선순위를 정할 때 영향도와 확신도를 따로 적어 비교해 보기"
          value={takeaway}
          onChange={(e) => setTakeaway(e.target.value)}
        />
        <p className="hint mt-1 text-right">
          {takeaway.length} / {MAX}
        </p>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "저장하고 있어요…" : "회고 저장"}
        </button>
        <Link href="/library" className="btn btn-ghost">
          나중에 하기
        </Link>
      </div>
    </form>
  );
}
