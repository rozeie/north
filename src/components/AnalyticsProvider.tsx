"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { initAnalytics, trackPageView } from "@/lib/analytics";

/** Mixpanel 초기화 + 라우트 변경마다 페이지뷰 기록 */
export function AnalyticsProvider() {
  const pathname = usePathname();
  useEffect(() => {
    initAnalytics();
    trackPageView(pathname);
  }, [pathname]);
  return null;
}
