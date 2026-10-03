"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ConcernEditor({ initial }: { initial: string }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    if (!value.trim()) {
      setError("고민을 입력해 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/profile/concern", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ current_concern: value }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "저장하지 못했어요.");
      } else {
        setEditing(false);
        router.refresh();
      }
    } catch {
      setError("네트워크 문제로 저장하지 못했어요.");
    }
    setBusy(false);
  }

  if (!editing) {
    return (
      <div>
        <p className="whitespace-pre-wrap">{initial}</p>
        <button type="button" className="btn btn-ghost mt-2 -ml-2 text-sm" onClick={() => setEditing(true)}>
          수정
        </button>
      </div>
    );
  }

  return (
    <div>
      <textarea aria-label="현재 커리어 고민" rows={5} className="field" value={value} onChange={(e) => setValue(e.target.value)} />
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      )}
      <div className="mt-3 flex gap-2">
        <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={busy}>
          {busy ? "저장 중…" : "저장"}
        </button>
        <button
          type="button"
          className="btn btn-ghost"
          disabled={busy}
          onClick={() => {
            setValue(initial);
            setError("");
            setEditing(false);
          }}
        >
          취소
        </button>
      </div>
      <p className="hint mt-2">고민을 고쳐도 성장 방향은 자동으로 바뀌지 않아요. 필요하면 성장 방향을 직접 수정해 주세요.</p>
    </div>
  );
}
