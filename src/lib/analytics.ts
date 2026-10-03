import mixpanel from "mixpanel-browser";

const TOKEN = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
let ready = false;

/** 브라우저에서 한 번만 초기화. 토큰이 없으면 모든 호출이 no-op. */
export function initAnalytics() {
  if (ready || !TOKEN || typeof window === "undefined") return;
  mixpanel.init(TOKEN, { track_pageview: false, persistence: "localStorage" });
  ready = true;
}

export function track(event: string, props?: Record<string, unknown>) {
  if (!ready) return;
  mixpanel.track(event, props);
}

export function trackPageView(path: string) {
  track("Page View", { path });
}
