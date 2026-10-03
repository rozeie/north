import { REFLECTION_QUESTIONS } from "@/lib/constants";
import type { Reflection } from "@/lib/types";

/** 저장된 회고(읽기 전용) */
export function ReflectionView({ reflection }: { reflection: Reflection }) {
  const rows: [string, string][] = [
    ["배운 내용", reflection.summary.learned],
    ["아직 남은 고민", reflection.summary.remaining_concern],
    ["다음에 시도해볼 행동", reflection.summary.next_action],
  ];
  return (
    <div className="space-y-8">
      <section aria-label="회고 정리" className="card space-y-5">
        {rows.map(([label, body]) => (
          <div key={label}>
            <p className="eyebrow mb-1">{label}</p>
            <p>{body || "—"}</p>
          </div>
        ))}
      </section>
      <section aria-label="작성한 답변">
        <h2 className="eyebrow mb-3">내가 쓴 답변</h2>
        <dl className="space-y-4 text-body-sm">
          {REFLECTION_QUESTIONS.map((q) => (
            <div key={q.key}>
              <dt className="text-muted">{q.label}</dt>
              <dd className="mt-0.5 whitespace-pre-wrap">{reflection.answers[q.key] || "—"}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
