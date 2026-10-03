import { z } from "zod";
import { fail, ok, parseJson, withUser } from "@/lib/api";
import * as repo from "@/lib/repo";

const Schema = z.object({
  recommendation_time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "시각 형식이 올바르지 않아요."),
});

// 추천 교체 시각 저장. 현재 주기의 추천은 건드리지 않고 다음 주기부터 적용된다(F6-3).
export const PUT = withUser(
  async (req, { user }) => {
    const body = await parseJson(req, Schema);
    if ("error" in body) return fail(body.error);
    await repo.updateRecommendationTime(user.id, body.data.recommendation_time);
    return ok();
  },
  { confirmed: true }
);
