"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";

export function SettingsForm({ initialTime }: { initialTime: string }) {
  const [time, setTime] = useState(initialTime);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  async function save() {
    if (!/^\d{2}:\d{2}$/.test(time)) {
      setMessage({ kind: "error", text: "시각을 선택해 주세요." });
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ recommendation_time: time }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      setMessage(
        data.ok
          ? { kind: "ok", text: "저장했어요. 변경한 시각은 다음 추천 주기부터 적용돼요." }
          : { kind: "error", text: data.error ?? "저장하지 못했어요." }
      );
    } catch {
      setMessage({ kind: "error", text: "네트워크 문제로 저장하지 못했어요." });
    }
    setBusy(false);
  }

  return (
    <div className="space-y-14">
      <section aria-labelledby="s-time">
        <h2 id="s-time" className="mb-3 text-lead font-semibold">
          추천 교체 시각
        </h2>
        <p className="mb-4 text-body-sm text-muted">
          매일 이 시각에 새로운 추천 주기가 시작돼요(한국 시간). 기본값은 오전 6시예요.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="time" className="label">
              교체 시각
            </label>
            <input id="time" type="time" className="field w-auto" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          <button type="button" className="btn btn-primary" onClick={() => void save()} disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </button>
        </div>
        <p className="hint mt-3">변경한 시각은 다음 추천 주기부터 적용돼요. 저장해도 새 추천이 바로 만들어지지는 않아요.</p>
        {message && (
          <p role={message.kind === "error" ? "alert" : "status"} className={`mt-3 text-sm ${message.kind === "error" ? "text-danger" : "text-evidence"}`}>
            {message.text}
          </p>
        )}
      </section>

      <section aria-labelledby="s-account">
        <h2 id="s-account" className="mb-3 text-lead font-semibold">
          계정
        </h2>
        <button type="button" className="btn btn-outline" onClick={() => void signOut({ callbackUrl: "/" })}>
          로그아웃
        </button>
      </section>
    </div>
  );
}
