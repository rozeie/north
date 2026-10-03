import "server-only";
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { getSessionUser } from "./auth";
import * as repo from "./repo";
import type { User } from "./types";

export const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });
export const ok = <T extends object>(data: T = {} as T) => NextResponse.json({ ok: true, ...data });

type Handler = (req: Request, ctx: { user: User }) => Promise<NextResponse>;

/** 로그인 필수 API. confirmed=true 면 성장 방향 확정 이후에만 허용한다. */
export function withUser(handler: Handler, opts: { confirmed?: boolean } = {}) {
  return async (req: Request) => {
    const user = await getSessionUser();
    if (!user) return fail("로그인이 필요해요.", 401);
    if (opts.confirmed && (await repo.getOnboardingState(user.id)) !== "DirectionConfirmed") {
      return fail("성장 방향을 먼저 확정해 주세요.", 403);
    }
    try {
      return await handler(req, { user });
    } catch (err) {
      console.error(err);
      return fail("잠시 문제가 생겼어요. 다시 시도해 주세요.", 500);
    }
  };
}

export async function parseJson<T>(req: Request, schema: ZodType<T>): Promise<{ data: T } | { error: string }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: "요청 형식이 올바르지 않아요." };
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요." };
  return { data: parsed.data };
}
