import { z } from "zod";
import { fail, ok, parseJson, withUser } from "@/lib/api";
import * as repo from "@/lib/repo";

// 클라이언트에서 기록할 수 있는 이벤트는 단계 진입뿐이다.
const Schema = z.object({ name: z.enum(["step_entered"]), props: z.record(z.string(), z.unknown()).optional() });

export const POST = withUser(async (req, { user }) => {
  const body = await parseJson(req, Schema);
  if ("error" in body) return fail(body.error);
  await repo.logEvent(user.id, body.data.name, body.data.props ?? {});
  return ok();
});
