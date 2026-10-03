import { z } from "zod";
import { fail, ok, parseJson, withUser } from "@/lib/api";
import * as repo from "@/lib/repo";
import type { DirectionBody, NamedItem } from "@/lib/types";

const Item = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1, "이름이 비어 있는 항목이 있어요."),
  description: z.string().trim(),
});

const Schema = z
  .object({
    stuck_hypothesis: z.string().trim().min(1, "막힌 지점 설명을 입력해 주세요."),
    skills: z.array(Item),
    topics: z.array(Item).min(1, "학습 주제를 1개 이상 남겨 주세요."),
    priority_topic_id: z.string().min(1, "우선 주제를 선택해 주세요."),
  })
  .refine((v) => v.topics.some((t) => t.id === v.priority_topic_id), {
    message: "우선 주제를 학습 주제 중에서 선택해 주세요.",
  });

const same = (a: NamedItem[], b: NamedItem[]) =>
  JSON.stringify(a.map((x) => [x.id, x.name, x.description])) === JSON.stringify(b.map((x) => [x.id, x.name, x.description]));

/** 초안 대비 수정 내역 (F10: 초안 항목별 수정 여부·수정량) */
function diffAgainstDraft(draft: DirectionBody, next: DirectionBody) {
  const draftIds = new Set(draft.topics.map((t) => t.id));
  const nextIds = new Set(next.topics.map((t) => t.id));
  return {
    hypothesis_edited: draft.stuck_hypothesis !== next.stuck_hypothesis,
    skills_edited: !same(draft.skills, next.skills),
    topics_added: next.topics.filter((t) => !draftIds.has(t.id)).length,
    topics_removed: draft.topics.filter((t) => !nextIds.has(t.id)).length,
    topics_edited: next.topics.filter((t) => {
      const o = draft.topics.find((x) => x.id === t.id);
      return o && (o.name !== t.name || o.description !== t.description);
    }).length,
    priority_changed: draft.priority_topic_id !== next.priority_topic_id,
  };
}

// 성장 방향 확정 / 확정 후 수정. 재분석(AI 호출)은 없다. 확정 후 수정은 덮어쓴다(F3-8).
export const PUT = withUser(async (req, { user }) => {
  const body = await parseJson(req, Schema);
  if ("error" in body) return fail(body.error);

  const saved = await repo.saveDirection(user.id, body.data);
  if (!saved) return fail("먼저 최초 입력을 완료해 주세요.", 404);

  await repo.logEvent(
    user.id,
    saved.firstConfirm ? "direction_confirmed" : "direction_updated",
    diffAgainstDraft(saved.direction.draft_snapshot, body.data)
  );
  return ok();
});
