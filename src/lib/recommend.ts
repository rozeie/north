import "server-only";
import { randomUUID } from "crypto";
import { generateCardReasons, type RecommendCtx, type RecommendPick } from "./ai";
import { SLOT_ORDER, STAGE_DIFFICULTY } from "./constants";
import { allContents, getContent } from "./content";
import { resolveNewCycle } from "./cycle";
import * as repo from "./repo";
import type { Content, ContentType, DailyRecommendation, Direction, JobFamily, RecommendationCard } from "./types";

export type CardWithContent = RecommendationCard & { content: Content };
export interface TodayRecommendation {
  set: DailyRecommendation;
  cards: CardWithContent[];
}

// ── 후보 선정 (규칙 기반, F5-3 / F5-4) ───────────────
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, "");
const tagMatches = (tag: string, topic: string) => {
  const a = norm(tag);
  const b = norm(topic);
  return a === b || (b.length >= 2 && a.includes(b)) || (a.length >= 2 && b.includes(a));
};

function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return ((h >>> 0) % 1000) / 1000;
}

function scoreContent(c: Content, d: Direction) {
  let score = 0;
  let matched: { topic: string; weight: number } | null = null;
  for (const t of d.topics) {
    if (!c.topic_tags.some((tag) => tagMatches(tag, t.name))) continue;
    const weight = t.id === d.priority_topic_id ? 3 : 1; // 우선 주제 우선
    score += weight;
    if (!matched || weight > matched.weight) matched = { topic: t.name, weight };
  }
  return { score, matched: matched?.topic ?? null };
}

export function selectPicks(opts: {
  jobFamily: JobFamily;
  careerStage: string;
  direction: Direction;
  excludeIds: Set<string>;
  seed: string;
}): RecommendPick[] {
  const fit = STAGE_DIFFICULTY[opts.careerStage] ?? ["입문", "기본", "심화"];
  const picks: RecommendPick[] = [];

  for (const type of SLOT_ORDER as ContentType[]) {
    // 조건: 유형 슬롯 + 관련 직군 + 서재 보관 자료 제외. 주제 매칭이 없으면 직군 단독 조건으로 완화된다(점수 0).
    const ranked = allContents()
      .filter((c) => c.type === type && c.job_families.includes(opts.jobFamily) && !opts.excludeIds.has(c.id))
      .map((c) => {
        const { score, matched } = scoreContent(c, opts.direction);
        const rank = score * 10 + (fit.includes(c.difficulty) ? 5 : 0) + hash01(`${opts.seed}:${c.id}`) * 4;
        return { c, matched, rank };
      })
      .sort((a, b) => b.rank - a.rank);

    const top = ranked[0];
    if (!top) continue;
    picks.push({
      content_id: top.c.id,
      title: top.c.title,
      author_source: top.c.author_source,
      type,
      tags: top.c.topic_tags,
      matched_topic: top.matched,
    });
  }
  return picks;
}

// ── 지연 생성 (F5-9 ~ F5-11) ─────────────────────────
const locks = new Map<string, Promise<unknown>>();
function withLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const prev = locks.get(key) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(fn);
  locks.set(key, next);
  next.finally(() => locks.get(key) === next && locks.delete(key)).catch(() => undefined);
  return next;
}

function attach(cur: { set: DailyRecommendation; cards: RecommendationCard[] }): TodayRecommendation {
  const cards = cur.cards
    .map((c) => ({ ...c, content: getContent(c.content_id) }))
    .filter((c): c is CardWithContent => Boolean(c.content))
    .sort((a, b) => SLOT_ORDER.indexOf(a.slot_type) - SLOT_ORDER.indexOf(b.slot_type));
  return { set: cur.set, cards };
}

/**
 * 현재 추천 주기의 세트를 돌려준다. 해당 주기에 세트가 없을 때만 지금 생성한다(사전 생성 없음).
 * 접속하지 않은 주기에는 호출 자체가 없으므로 AI 비용이 발생하지 않는다.
 */
export async function getTodayRecommendation(userId: string): Promise<TodayRecommendation> {
  const existing = await repo.getCurrentRecommendation(userId, Date.now());
  if (existing) return attach(existing);

  return withLock(userId, async () => {
    const again = await repo.getCurrentRecommendation(userId, Date.now());
    if (again) return attach(again);

    const [profile, direction, setting, library, reflections, sets] = await Promise.all([
      repo.getProfile(userId),
      repo.getDirection(userId),
      repo.getSetting(userId),
      repo.getLibrary(userId),
      repo.getReflections(userId),
      repo.getRecommendations(userId),
    ]);
    if (!profile || !direction?.confirmed_at) throw new Error("확정된 성장 방향이 없습니다.");

    const prevEnd = sets.reduce((max, s) => Math.max(max, Date.parse(s.cycle_end_at)), 0) || undefined;
    const cycle = resolveNewCycle(Date.now(), setting.recommendation_time, prevEnd);

    const picks = selectPicks({
      jobFamily: profile.job_family,
      careerStage: profile.career_stage,
      direction,
      excludeIds: new Set(library.map((l) => l.content_id)),
      seed: `${userId}:${cycle.start}`,
    });
    if (picks.length === 0) throw new Error("추천할 수 있는 자료가 없습니다.");

    const priority = direction.topics.find((t) => t.id === direction.priority_topic_id)?.name ?? direction.topics[0].name;
    const ctx: RecommendCtx = {
      concern: profile.current_concern,
      job_family: profile.job_family,
      career_stage: profile.career_stage,
      profile: profile.structured, // 이력서 원본이 아닌 구조화 프로필만 전달
      direction: {
        stuck_hypothesis: direction.stuck_hypothesis,
        skills: direction.skills.map(({ name, description }) => ({ name, description })),
        topics: direction.topics.map(({ name, description }) => ({ name, description })),
        priority_topic: priority,
      },
      reflections: reflections.map((r) => r.summary),
    };

    const ai = await generateCardReasons(ctx, picks);
    const setId = randomUUID();
    const cards: RecommendationCard[] = picks.map((p) => {
      const r = ai.cards.find((c) => c.content_id === p.content_id);
      if (!r) throw new Error("AI 응답에 일부 자료의 추천 이유가 없습니다.");
      return {
        id: randomUUID(),
        recommendation_id: setId,
        content_id: p.content_id,
        slot_type: p.type,
        reason: r.reason,
        check_questions: r.check_questions.slice(0, 2),
        basis: { kind: r.basis_kind, label: r.basis_label, quote: r.basis_quote },
      };
    });
    const set: DailyRecommendation = {
      id: setId,
      user_id: userId,
      cycle_start_at: cycle.start,
      cycle_end_at: cycle.end,
      generated_at: new Date().toISOString(),
      status: "Ready",
      selected_card_id: null,
      selected_at: null,
    };

    const saved = await repo.insertRecommendation(set, cards);
    await repo.logEvent(userId, "recommendation_generated", { cycle_start_at: cycle.start });
    return attach(saved);
  });
}
