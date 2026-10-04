import { z } from "zod";
import { fail, ok, parseJson, withUser } from "@/lib/api";
import * as repo from "@/lib/repo";

// 저장: 추천 카드를 서재에 보관 / 저장 취소: 자료를 서재에서 제거
export const POST = withUser(
  async (req, { user }) => {
    const body = await parseJson(req, z.object({ card_id: z.string().min(1) }));
    if ("error" in body) return fail(body.error);
    const result = await repo.saveCardToLibrary(user.id, body.data.card_id);
    if (!result.ok) return fail("추천이 교체되어 저장할 수 없어요. 새 추천을 확인해 주세요.", 404);
    if (result.created) await repo.logEvent(user.id, "library_saved", { content_id: result.item.content_id });
    return ok({ library_item_id: result.item.id });
  },
  { confirmed: true }
);

export const DELETE = withUser(
  async (req, { user }) => {
    const body = await parseJson(req, z.object({ content_id: z.string().min(1) }));
    if ("error" in body) return fail(body.error);
    const result = await repo.removeFromLibrary(user.id, body.data.content_id);
    if (!result.ok) {
      if (result.reason === "has_reflection") return fail("회고를 작성한 자료는 저장을 취소할 수 없어요.", 409);
      return fail("서재에 없는 자료예요.", 404);
    }
    await repo.logEvent(user.id, "library_removed", { content_id: body.data.content_id });
    return ok();
  },
  { confirmed: true }
);
