import { z } from "zod";
import { summarizeReflection } from "@/lib/ai";
import { fail, ok, parseJson, withUser } from "@/lib/api";
import { getContent } from "@/lib/content";
import * as repo from "@/lib/repo";

export const maxDuration = 60;

const AnswersSchema = z.object({
  q1: z.string().trim().min(1, "첫 번째 질문에 답해 주세요."),
  q2: z.string().trim().min(1, "두 번째 질문에 답해 주세요."),
  q3: z.string().trim().optional(),
});
const Schema = z.object({ library_item_id: z.string().min(1), answers: AnswersSchema });

// 회고 AI 정리 (저장은 하지 않는다). 사용자가 수정한 뒤 /api/reflections 로 저장한다.
export const POST = withUser(
  async (req, { user }) => {
    const body = await parseJson(req, Schema);
    if ("error" in body) return fail(body.error);

    const item = await repo.getLibraryItem(user.id, body.data.library_item_id);
    const content = item && getContent(item.content_id);
    if (!item || !content) return fail("서재에서 자료를 찾을 수 없어요.", 404);
    if (await repo.getReflectionByItem(user.id, item.id)) return fail("이미 회고를 작성한 자료예요.", 409);

    const direction = await repo.getDirection(user.id);
    if (!direction) return fail("성장 방향이 없어요.", 404);
    const priority = direction.topics.find((t) => t.id === direction.priority_topic_id)?.name ?? "";

    try {
      const summary = await summarizeReflection({
        answers: body.data.answers,
        content: { title: content.title, author_source: content.author_source, tags: content.topic_tags },
        direction: { priority_topic: priority, topics: direction.topics.map((t) => t.name) },
      });
      await repo.logEvent(user.id, "reflection_summarized");
      return ok({ summary });
    } catch (err) {
      console.error(err);
      return fail("정리 중 문제가 생겼어요. 작성한 내용은 그대로 남아 있으니 다시 시도해 주세요.", 502);
    }
  },
  { confirmed: true }
);
