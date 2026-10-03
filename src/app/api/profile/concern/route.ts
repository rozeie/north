import { z } from "zod";
import { fail, ok, parseJson, withUser } from "@/lib/api";
import * as repo from "@/lib/repo";

const Schema = z.object({ current_concern: z.string().trim().min(1, "고민을 입력해 주세요.") });

// 현재 커리어 고민 수정 (F9-1). AI 를 호출하지 않는다.
export const PATCH = withUser(
  async (req, { user }) => {
    const body = await parseJson(req, Schema);
    if ("error" in body) return fail(body.error);
    const updated = await repo.updateConcern(user.id, body.data.current_concern);
    if (!updated) return fail("프로필이 없어요.", 404);
    return ok();
  },
  { confirmed: true }
);
