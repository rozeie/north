import { z } from "zod";
import { fail, ok, parseJson, withUser } from "@/lib/api";
import * as repo from "@/lib/repo";

const Schema = z.object({ card_id: z.string().min(1) });

// 오늘 읽을 자료 선택 확정 (F7). 확인 모달에서 [이 자료 선택하기]를 눌렀을 때만 호출된다.
export const POST = withUser(
  async (req, { user }) => {
    const body = await parseJson(req, Schema);
    if ("error" in body) return fail(body.error);

    const result = await repo.confirmSelection(user.id, body.data.card_id, Date.now());
    if (!result.ok) {
      if (result.reason === "not_found") return fail("추천 카드를 찾을 수 없어요.", 404);
      if (result.reason === "already_selected") return fail("오늘은 이미 자료를 선택했어요.", 409);
      return fail("추천이 교체되었어요. 새 추천을 확인해 주세요.", 409);
    }
    await repo.logEvent(user.id, "recommendation_selected", { content_id: result.item.content_id });
    return ok({ library_item_id: result.item.id });
  },
  { confirmed: true }
);
