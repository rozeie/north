import { CONTENT_TYPE_LABEL } from "@/lib/constants";
import type { ContentType } from "@/lib/types";

const STYLE: Record<ContentType, string> = {
  concept: "bg-concept-soft text-concept",
  case: "bg-case-soft text-case",
  evidence: "bg-evidence-soft text-evidence",
};

export function TypeBadge({ type }: { type: ContentType }) {
  return (
    <span className={`badge ${STYLE[type]}`}>
      {CONTENT_TYPE_LABEL[type]}
    </span>
  );
}
