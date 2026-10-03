import { z } from "zod";
import { fail, ok, parseJson, withUser } from "@/lib/api";
import * as repo from "@/lib/repo";

const Schema = z.object({
  library_item_id: z.string().min(1),
  answers: z.object({
    q1: z.string().trim().min(1),
    q2: z.string().trim().min(1),
    q3: z.string().trim().optional(),
  }),
  summary: z.object({
    learned: z.string().trim().min(1, "배운 내용을 입력해 주세요."),
    remaining_concern: z.string().trim(),
    next_action: z.string().trim().min(1, "다음에 시도해볼 행동을 입력해 주세요."),
  }),
});

// 사용자가 확인·수정한 AI 정리를 저장한다. 회고는 다음 추천의 맥락으로만 쓰인다(F8-6).
export const POST = withUser(
  async (req, { user }) => {
    const body = await parseJson(req, Schema);
    if ("error" in body) return fail(body.error);

    const saved = await repo.saveReflection({ user_id: user.id, ...body.data });
    if (!saved) return fail("회고를 저장할 수 없어요. 이미 작성했거나 서재에 없는 자료예요.", 409);
    await repo.logEvent(user.id, "reflection_saved");
    return ok({ reflection_id: saved.id });
  },
  { confirmed: true }
);
