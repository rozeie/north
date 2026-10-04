import mixpanel from "mixpanel-browser";

const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
let ready = false;

/** 브라우저에서 한 번만 초기화. 토큰이 없으면 모든 호출이 no-op. */
export function initAnalytics() {
  if (ready || !TOKEN || typeof window === "undefined") return;
  mixpanel.init(TOKEN, { track_pageview: false, persistence: "localStorage" });
  ready = true;
}

/** 모든 이벤트에 현재 route 를 기본으로 붙인다(props 의 route 가 우선). */
export function track(event: string, props?: Record<string, unknown>) {
  if (!ready) return;
  mixpanel.track(event, { route: window.location.pathname, ...props });
}

/** 핵심 행동 이벤트 공통 속성. 값이 없는 키는 보내지 않는다. */
export type EventMeta = {
  content_id?: string;
  content_type?: string;
  recommendation_reason?: string;
  source?: string;
};

export function trackPageView(path: string) {
  track("Page View", { path });
}
