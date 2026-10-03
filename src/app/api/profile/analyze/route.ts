import { randomUUID } from "crypto";
import { z } from "zod";
import { analyzeInitial } from "@/lib/ai";
import { fail, ok, withUser } from "@/lib/api";
import { CAREER_STAGES, MAX_PDF_BYTES } from "@/lib/constants";
import * as repo from "@/lib/repo";

export const runtime = "nodejs";
export const maxDuration = 60;

const InputSchema = z.object({
  job_family: z.enum(["design", "pm", "marketing"], "직군을 선택해 주세요."),
  career_stage: z.enum(CAREER_STAGES, "경력 단계를 선택해 주세요."),
  target_role: z.string().trim().min(1, "희망 직무를 입력해 주세요."),
  current_concern: z.string().trim().min(1, "현재 고민을 입력해 주세요."),
  cover_letter_text: z.string().trim().optional(),
  portfolio_text: z.string().trim().optional(),
});

// 최초 입력 제출: 이력서 PDF 1회 분석 → 구조화 프로필 저장 + 성장 방향 초안 생성 (F2, F3-1)
export const POST = withUser(async (req, { user }) => {
  if ((await repo.getOnboardingState(user.id)) !== "SignedIn") {
    return fail("이미 최초 분석이 끝났어요. 성장 방향 화면에서 이어서 진행해 주세요.", 409);
  }

  const form = await req.formData();
  const parsed = InputSchema.safeParse({
    job_family: form.get("job_family"),
    career_stage: form.get("career_stage"),
    target_role: form.get("target_role"),
    current_concern: form.get("current_concern"),
    cover_letter_text: (form.get("cover_letter_text") as string) || undefined,
    portfolio_text: (form.get("portfolio_text") as string) || undefined,
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "입력값이 올바르지 않아요.");
  const input = parsed.data;

  let pdf: { data: Buffer; name: string } | undefined;
  const file = form.get("resume");
  if (file instanceof File && file.size > 0) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return fail("이력서는 PDF 파일만 올릴 수 있어요.");
    }
    if (file.size > MAX_PDF_BYTES) return fail(`PDF 파일은 ${MAX_PDF_BYTES / 1024 / 1024}MB 이하로 올려 주세요.`);
    pdf = { data: Buffer.from(await file.arrayBuffer()), name: file.name };
  }

  await repo.logEvent(user.id, "input_submitted", { has_pdf: Boolean(pdf), has_cover: Boolean(input.cover_letter_text), has_portfolio: Boolean(input.portfolio_text) });

  let analysis;
  try {
    analysis = await analyzeInitial({ ...input, pdf });
  } catch (err) {
    console.error(err);
    await repo.logEvent(user.id, "analysis_failed", { has_pdf: Boolean(pdf) });
    return fail(
      pdf
        ? "분석 중 문제가 생겼어요. 다시 시도하거나, PDF 없이 진행할 수도 있어요."
        : "분석 중 문제가 생겼어요. 입력한 내용은 그대로 남아 있으니 다시 시도해 주세요.",
      502
    );
  }

  const topics = analysis.draft.topics.map((t) => ({ id: randomUUID(), ...t }));
  const skills = analysis.draft.skills.map((s) => ({ id: randomUUID(), ...s }));
  const priority = topics.find((t) => t.name === analysis.draft.priority_topic_name) ?? topics[0];

  const created = await repo.createProfileAndDraft(
    {
      user_id: user.id,
      job_family: input.job_family,
      career_stage: input.career_stage,
      target_role: input.target_role,
      current_concern: input.current_concern,
      cover_letter_text: input.cover_letter_text,
      portfolio_text: input.portfolio_text,
      structured: analysis.profile, // 이력서 원본은 저장하지 않는다
      created_at: new Date().toISOString(),
    },
    { stuck_hypothesis: analysis.draft.stuck_hypothesis, skills, topics, priority_topic_id: priority.id }
  );
  if (!created) return fail("이미 최초 분석이 끝났어요.", 409);

  await repo.logEvent(user.id, "draft_generated");
  return ok();
});
