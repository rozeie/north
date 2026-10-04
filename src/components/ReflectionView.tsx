import { REFLECTION_QUESTIONS } from "@/lib/constants";
import { formatDateKst } from "@/lib/cycle";
import type { Reflection } from "@/lib/types";

/** 저장된 회고(읽기 전용). takeaway 가 있으면 가벼운 회고, 없으면 이전 형식(3문항 정리)으로 보여준다. */
export function ReflectionView({ reflection }: { reflection: Reflection }) {
  if (reflection.takeaway) {
    return (
      <section aria-label="저장한 회고" className="card">
        <div className="flex flex-wrap items-center gap-2">
          <span className="badge badge-secondary">저장됨</span>
          <span className="text-sm text-faint">{formatDateKst(reflection.saved_at)}</span>
        </div>
        <p className="eyebrow mb-1 mt-4">이 콘텐츠에서 가져갈 것</p>
        <p className="whitespace-pre-wrap text-lead leading-relaxed">{reflection.takeaway}</p>
      </section>
    );
  }

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
