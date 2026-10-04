// 데이터 접근 계층. 화면/API 는 db.ts 를 직접 쓰지 않고 이 파일의 함수만 사용한다.
import { randomUUID } from "crypto";
import { mutate, readOnly } from "./db";
import { DEFAULT_RECOMMENDATION_TIME } from "./constants";
import type {
  CareerProfile,
  DailyRecommendation,
  Direction,
  DirectionBody,
  LibraryItem,
  OnboardingState,
  Reflection,
  RecommendationCard,
  User,
  UserSetting,
} from "./types";

const now = () => new Date().toISOString();

// ── 사용자 ─────────────────────────────────────────
export async function findOrCreateUser(input: { google_id: string; email: string; name: string }): Promise<User> {
  return mutate((db) => {
    let user = db.users.find((u) => u.google_id === input.google_id);
    if (!user) {
      user = { id: randomUUID(), created_at: now(), ...input };
      db.users.push(user);
      db.settings.push({ user_id: user.id, recommendation_time: DEFAULT_RECOMMENDATION_TIME });
    }
    return user;
  });
}

export async function getSetting(userId: string): Promise<UserSetting> {
  const found = await readOnly((db) => db.settings.find((s) => s.user_id === userId));
  return found ?? { user_id: userId, recommendation_time: DEFAULT_RECOMMENDATION_TIME };
}

export async function updateRecommendationTime(userId: string, time: string): Promise<UserSetting> {
  return mutate((db) => {
    let s = db.settings.find((x) => x.user_id === userId);
    if (!s) {
      s = { user_id: userId, recommendation_time: time };
      db.settings.push(s);
    } else s.recommendation_time = time;
    return s;
  });
}

// ── 프로필 / 성장 방향 ─────────────────────────────
export const getProfile = (userId: string) => readOnly((db) => db.profiles.find((p) => p.user_id === userId) ?? null);

export const getDirection = (userId: string) =>
  readOnly((db) => db.directions.find((d) => d.user_id === userId) ?? null);

/**
 * 분석 결과 저장: 프로필 + 미확정 초안. 이미 프로필이 있으면 false(최초 분석은 1회).
 * replace=true(프로필 다시 분석)이면 기존 프로필·성장 방향·현재 추천 세트를 교체한다.
 * 서재와 회고는 그대로 유지하고, 새 초안을 확정할 때까지 추천은 중단된다.
 */
export async function createProfileAndDraft(
  profile: CareerProfile,
  draft: DirectionBody,
  opts: { replace?: boolean } = {}
): Promise<boolean> {
  return mutate((db) => {
    const exists = db.profiles.some((p) => p.user_id === profile.user_id);
    if (exists && !opts.replace) return false;
    if (exists) {
      const setIds = new Set(db.recommendations.filter((r) => r.user_id === profile.user_id).map((r) => r.id));
      db.profiles = db.profiles.filter((p) => p.user_id !== profile.user_id);
      db.directions = db.directions.filter((d) => d.user_id !== profile.user_id);
      db.recommendations = db.recommendations.filter((r) => !setIds.has(r.id));
      db.cards = db.cards.filter((c) => !setIds.has(c.recommendation_id));
    }
    db.profiles.push(profile);
    db.directions.push({
      user_id: profile.user_id,
      ...draft,
      draft_snapshot: structuredClone(draft),
      confirmed_at: null,
      updated_at: now(),
    });
    return true;
  });
}

export async function updateConcern(userId: string, concern: string): Promise<CareerProfile | null> {
  return mutate((db) => {
    const p = db.profiles.find((x) => x.user_id === userId);
    if (!p) return null;
    p.current_concern = concern;
    return p;
  });
}

/** 확정 또는 확정 후 수정(덮어쓰기). 이력·버전은 보관하지 않는다. */
export async function saveDirection(
  userId: string,
  body: DirectionBody
): Promise<{ direction: Direction; firstConfirm: boolean } | null> {
  return mutate((db) => {
    const d = db.directions.find((x) => x.user_id === userId);
    if (!d) return null;
    const firstConfirm = d.confirmed_at === null;
    d.stuck_hypothesis = body.stuck_hypothesis;
    d.skills = body.skills;
    d.topics = body.topics;
    d.priority_topic_id = body.priority_topic_id;
    d.updated_at = now();
    if (firstConfirm) d.confirmed_at = d.updated_at;
    return { direction: structuredClone(d), firstConfirm };
  });
}

export async function getOnboardingState(userId: string): Promise<OnboardingState> {
  return readOnly((db) => {
    if (!db.profiles.some((p) => p.user_id === userId)) return "SignedIn";
    const d = db.directions.find((x) => x.user_id === userId);
    return d?.confirmed_at ? "DirectionConfirmed" : "DraftReady";
  });
}

// ── 추천 ───────────────────────────────────────────
export const getRecommendations = (userId: string) =>
  readOnly((db) => db.recommendations.filter((r) => r.user_id === userId));

export async function getCurrentRecommendation(userId: string, at: number) {
  return readOnly((db) => {
    const set = db.recommendations
      .filter((r) => r.user_id === userId && Date.parse(r.cycle_start_at) <= at && at < Date.parse(r.cycle_end_at))
      .sort((a, b) => b.cycle_start_at.localeCompare(a.cycle_start_at))[0];
    if (!set) return null;
    return { set, cards: db.cards.filter((c) => c.recommendation_id === set.id) };
  });
}

/**
 * 추천 세트 저장. (user_id, cycle_start_at) 유니크를 보장하며, 이미 있으면 기존 세트를 돌려준다.
 * 새 주기로 넘어가면 이전 주기의 미선택 카드는 삭제한다(지난 추천 다시 보기 없음).
 */
export async function insertRecommendation(
  set: DailyRecommendation,
  cards: RecommendationCard[]
): Promise<{ set: DailyRecommendation; cards: RecommendationCard[] }> {
  return mutate((db) => {
    const existing = db.recommendations.find(
      (r) => r.user_id === set.user_id && r.cycle_start_at === set.cycle_start_at
    );
    if (existing) return { set: existing, cards: db.cards.filter((c) => c.recommendation_id === existing.id) };

    const prevIds = new Set(db.recommendations.filter((r) => r.user_id === set.user_id).map((r) => r.id));
    db.cards = db.cards.filter(
      (c) =>
        !prevIds.has(c.recommendation_id) ||
        db.recommendations.some((r) => r.id === c.recommendation_id && r.selected_card_id === c.id)
    );
    db.recommendations.push(set);
    db.cards.push(...cards);
    return { set, cards };
  });
}

export type SelectResult =
  | { ok: true; item: LibraryItem }
  | { ok: false; reason: "not_found" | "already_selected" | "expired" };

/** 선택 확정 + 서재 보관을 하나의 트랜잭션(단일 쓰기)으로 처리한다. */
export async function confirmSelection(userId: string, cardId: string, at: number): Promise<SelectResult> {
  return mutate((db) => {
    const card = db.cards.find((c) => c.id === cardId);
    const set = card && db.recommendations.find((r) => r.id === card.recommendation_id && r.user_id === userId);
    if (!card || !set) return { ok: false, reason: "not_found" } as const;
    if (at >= Date.parse(set.cycle_end_at)) return { ok: false, reason: "expired" } as const;
    if (set.status !== "Ready") return { ok: false, reason: "already_selected" } as const;

    const item: LibraryItem = {
      id: randomUUID(),
      user_id: userId,
      content_id: card.content_id,
      source_card_id: card.id,
      reason_snapshot: card.reason,
      check_questions_snapshot: card.check_questions,
      basis_snapshot: card.basis,
      saved_at: now(),
    };
    set.status = "Selected";
    set.selected_card_id = card.id;
    set.selected_at = item.saved_at;
    db.library.push(item);
    return { ok: true, item } as const;
  });
}

export type SaveResult =
  | { ok: true; item: LibraryItem; created: boolean }
  | { ok: false; reason: "not_found" };

/** 추천 카드를 서재에 저장한다. 같은 자료는 한 번만 보관한다(이미 있으면 기존 항목 반환). */
export async function saveCardToLibrary(userId: string, cardId: string): Promise<SaveResult> {
  return mutate((db) => {
    const card = db.cards.find((c) => c.id === cardId);
    const set = card && db.recommendations.find((r) => r.id === card.recommendation_id && r.user_id === userId);
    if (!card || !set) return { ok: false, reason: "not_found" } as const;
    const existing = db.library.find((i) => i.user_id === userId && i.content_id === card.content_id);
    if (existing) return { ok: true, item: existing, created: false } as const;
    const item: LibraryItem = {
      id: randomUUID(),
      user_id: userId,
      content_id: card.content_id,
      source_card_id: card.id,
      reason_snapshot: card.reason,
      check_questions_snapshot: card.check_questions,
      basis_snapshot: card.basis,
      saved_at: now(),
    };
    db.library.push(item);
    return { ok: true, item, created: true } as const;
  });
}

export type UnsaveResult = { ok: true } | { ok: false; reason: "not_found" | "has_reflection" };

/** 저장 취소. 회고가 있는 자료는 회고 이력을 보존하기 위해 취소할 수 없다. */
export async function removeFromLibrary(userId: string, contentId: string): Promise<UnsaveResult> {
  return mutate((db) => {
    const item = db.library.find((i) => i.user_id === userId && i.content_id === contentId);
    if (!item) return { ok: false, reason: "not_found" } as const;
    if (db.reflections.some((r) => r.library_item_id === item.id)) return { ok: false, reason: "has_reflection" } as const;
    db.library = db.library.filter((i) => i.id !== item.id);
    return { ok: true } as const;
  });
}

// ── 서재 / 회고 ────────────────────────────────────
export const getLibrary = (userId: string) =>
  readOnly((db) => db.library.filter((i) => i.user_id === userId).sort((a, b) => b.saved_at.localeCompare(a.saved_at)));

export const getLibraryItem = (userId: string, id: string) =>
  readOnly((db) => db.library.find((i) => i.user_id === userId && i.id === id) ?? null);

export const getReflections = (userId: string) =>
  readOnly((db) => db.reflections.filter((r) => r.user_id === userId).sort((a, b) => b.saved_at.localeCompare(a.saved_at)));

export const getReflectionByItem = (userId: string, libraryItemId: string) =>
  readOnly((db) => db.reflections.find((r) => r.user_id === userId && r.library_item_id === libraryItemId) ?? null);

/** 자료당 회고 1개. 이미 있으면 null. */
export async function saveReflection(r: Omit<Reflection, "id" | "saved_at">): Promise<Reflection | null> {
  return mutate((db) => {
    if (!db.library.some((i) => i.id === r.library_item_id && i.user_id === r.user_id)) return null;
    if (db.reflections.some((x) => x.library_item_id === r.library_item_id)) return null;
    const row: Reflection = { id: randomUUID(), saved_at: now(), ...r };
    db.reflections.push(row);
    return row;
  });
}

// ── 개발 전용 ───────────────────────────────────────
/** 개발용 샘플 계정 초기화: 사용자의 프로필·방향·추천·서재·회고를 지운다(계정과 설정은 유지). /api/dev/seed 에서만 호출한다. */
export async function resetUserData(userId: string): Promise<void> {
  await mutate((db) => {
    const setIds = new Set(db.recommendations.filter((r) => r.user_id === userId).map((r) => r.id));
    db.profiles = db.profiles.filter((p) => p.user_id !== userId);
    db.directions = db.directions.filter((d) => d.user_id !== userId);
    db.recommendations = db.recommendations.filter((r) => r.user_id !== userId);
    db.cards = db.cards.filter((c) => !setIds.has(c.recommendation_id));
    db.library = db.library.filter((i) => i.user_id !== userId);
    db.reflections = db.reflections.filter((r) => r.user_id !== userId);
  });
}

// ── 이벤트 ─────────────────────────────────────────
export async function logEvent(userId: string, name: string, props: Record<string, unknown> = {}) {
  await mutate((db) => {
    db.events.push({ id: randomUUID(), user_id: userId, name, props, created_at: now() });
  });
}
