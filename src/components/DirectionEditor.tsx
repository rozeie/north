"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { DirectionBody, NamedItem } from "@/lib/types";

const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `t-${Date.now()}-${Math.random()}`;

export function DirectionEditor({ initial, confirmed }: { initial: DirectionBody; confirmed: boolean }) {
  const router = useRouter();
  const [hypothesis, setHypothesis] = useState(initial.stuck_hypothesis);
  const [skills, setSkills] = useState<NamedItem[]>(initial.skills);
  const [topics, setTopics] = useState<NamedItem[]>(initial.topics);
  const [priority, setPriority] = useState(initial.priority_topic_id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const touch = () => setSaved(false);
  const patch = (list: NamedItem[], set: (v: NamedItem[]) => void, id: string, p: Partial<NamedItem>) => {
    set(list.map((x) => (x.id === id ? { ...x, ...p } : x)));
    touch();
  };

  const priorityValid = topics.some((t) => t.id === priority);
  const problem = !hypothesis.trim()
    ? "막힌 지점 설명을 입력해 주세요."
    : topics.length === 0
      ? "학습 주제를 1개 이상 남겨 주세요."
      : topics.some((t) => !t.name.trim()) || skills.some((s) => !s.name.trim())
        ? "이름이 비어 있는 항목이 있어요."
        : !priorityValid
          ? "먼저 다룰 우선 주제를 다시 선택해 주세요."
          : "";

  function removeTopic(id: string) {
    setTopics(topics.filter((t) => t.id !== id));
    if (priority === id) setPriority(""); // 우선 주제를 지우면 다시 선택해야 한다
    touch();
  }

  async function save() {
    if (problem) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/direction", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stuck_hypothesis: hypothesis, skills, topics, priority_topic_id: priority }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        setError(data.error ?? "저장하지 못했어요. 다시 시도해 주세요.");
        setSaving(false);
        return;
      }
      if (!confirmed) {
        router.push("/home");
        router.refresh();
        return;
      }
      setSaved(true);
      setSaving(false);
      router.refresh();
    } catch {
      setError("네트워크 문제로 저장하지 못했어요. 다시 시도해 주세요.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-center gap-3">
        {confirmed ? (
          <p className="text-sm text-muted">직접 수정할 수 있어요. 저장하면 이후 추천의 기준으로 사용돼요.</p>
        ) : (
          <>
            <span className="ai-label">AI가 제안한 초안</span>
            <p className="text-sm text-muted">평가가 아니라 가설이에요. 맞지 않는 부분은 직접 고쳐 주세요.</p>
          </>
        )}
      </div>

      <section aria-labelledby="h-hyp">
        <h2 id="h-hyp" className="mb-3 text-lead font-semibold">
          현재 막힌 지점
        </h2>
        <textarea
          aria-label="막힌 지점 설명"
          rows={3}
          className="field text-lead"
          value={hypothesis}
          onChange={(e) => {
            setHypothesis(e.target.value);
            touch();
          }}
        />
      </section>

      <section aria-labelledby="h-skill">
        <h2 id="h-skill" className="mb-3 text-lead font-semibold">
          지금 필요한 역량
        </h2>
        <ul className="space-y-4">
          {skills.map((s) => (
            <li key={s.id} className="card card-compact">
              <input
                aria-label="역량 이름"
                className="field mb-2 font-semibold"
                value={s.name}
                onChange={(e) => patch(skills, setSkills, s.id, { name: e.target.value })}
              />
              <textarea
                aria-label={`${s.name} 설명`}
                rows={2}
                className="field text-body-sm"
                value={s.description}
                onChange={(e) => patch(skills, setSkills, s.id, { description: e.target.value })}
              />
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="h-topic">
        <h2 id="h-topic" className="mb-1 text-lead font-semibold">
          학습 주제
        </h2>
        <p className="hint mb-4">가장 먼저 다룰 주제 하나를 선택해 주세요. 오늘의 추천은 이 주제를 중심으로 나와요.</p>
        <ul className="space-y-4">
          {topics.map((t) => {
            const isPriority = priority === t.id;
            return (
              <li
                key={t.id}
                className={`card card-compact ${isPriority ? "!border-brand !bg-brand-soft/50" : ""}`}
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                    <input
                      type="radio"
                      name="priority"
                      checked={isPriority}
                      onChange={() => {
                        setPriority(t.id);
                        touch();
                      }}
                      className="accent-primary"
                    />
                    먼저 다룰 주제
                  </label>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => removeTopic(t.id)}
                    disabled={topics.length <= 1}
                    aria-label={`${t.name || "이 주제"} 삭제`}
                  >
                    삭제
                  </button>
                </div>
                <input
                  aria-label="학습 주제 이름"
                  className="field mb-2 font-semibold"
                  value={t.name}
                  onChange={(e) => patch(topics, setTopics, t.id, { name: e.target.value })}
                />
                <textarea
                  aria-label={`${t.name} 설명`}
                  rows={2}
                  className="field text-body-sm"
                  value={t.description}
                  onChange={(e) => patch(topics, setTopics, t.id, { description: e.target.value })}
                />
              </li>
            );
          })}
        </ul>
        <button
          type="button"
          className="btn btn-outline mt-4"
          onClick={() => {
            const id = newId();
            setTopics([...topics, { id, name: "", description: "" }]);
            if (!priority) setPriority(id);
            touch();
          }}
        >
          + 학습 주제 추가
        </button>
      </section>

      {(problem || error) && (
        <p role="alert" className="text-sm text-danger">
          {error || problem}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border pt-8">
        <button type="button" className="btn btn-primary" disabled={saving || Boolean(problem)} onClick={() => void save()}>
          {saving ? "저장하고 있어요…" : confirmed ? "수정 내용 저장" : "이 방향으로 시작하기"}
        </button>
        {confirmed && (
          <Link href="/home" className="btn btn-ghost">
            홈으로
          </Link>
        )}
        {saved && <p className="text-sm text-success">저장했어요.</p>}
      </div>
    </div>
  );
}
