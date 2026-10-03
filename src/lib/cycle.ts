// 추천 주기 계산 (PRD F5-8, F5-10, F6)
// 추천 주기 = 사용자의 교체 시각(기본 06:00 KST)부터 다음 교체 시각까지.
// 생성 시각과 무관하게 주기 끝까지 유효하다.

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

export function parseTime(time: string): { h: number; m: number } {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time);
  if (!match) return { h: 6, m: 0 };
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return { h: 6, m: 0 };
  return { h, m };
}

/** t 이하에서 가장 최근의 교체 시각 경계 */
export function latestBoundary(t: number, time: string): number {
  const { h, m } = parseTime(time);
  const k = new Date(t + KST_OFFSET_MS);
  let candidate = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate(), h, m) - KST_OFFSET_MS;
  while (candidate > t) candidate -= DAY_MS;
  return candidate;
}

/** t 보다 엄격히 이후인 첫 교체 시각 경계 */
export function nextBoundary(t: number, time: string): number {
  const { h, m } = parseTime(time);
  const k = new Date(t + KST_OFFSET_MS);
  let candidate = Date.UTC(k.getUTCFullYear(), k.getUTCMonth(), k.getUTCDate(), h, m) - KST_OFFSET_MS;
  while (candidate <= t) candidate += DAY_MS;
  return candidate;
}

/**
 * 새 추천 세트가 속할 주기를 계산한다.
 * - 시작 = max(현재 기준 최근 경계, 직전 세트의 cycle_end_at)
 *   → 교체 시각을 바꿔도 이미 생성된 주기는 끝까지 유지되고, 변경값은 다음 주기부터 적용된다.
 * - 끝 = 시작 이후 첫 경계
 */
export function resolveNewCycle(now: number, time: string, prevEnd?: number) {
  let start = latestBoundary(now, time);
  if (prevEnd !== undefined && prevEnd > start) start = prevEnd;
  const end = nextBoundary(start, time);
  return { start: new Date(start).toISOString(), end: new Date(end).toISOString() };
}

export function formatKst(iso: string, opts: { withDate?: boolean } = {}): string {
  const d = new Date(iso);
  const time = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(d);
  if (!opts.withDate) return time;
  const date = new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  }).format(d);
  return `${date} ${time}`;
}

export function formatDateKst(iso: string): string {
  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso));
}
