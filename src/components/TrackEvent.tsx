"use client";

import Link from "next/link";
import { useEffect } from "react";
import { track, type EventMeta } from "@/lib/analytics";

/** 마운트 시 Mixpanel 이벤트 1회 기록 */
export function TrackOnMount({ event, props }: { event: string; props?: EventMeta & Record<string, unknown> }) {
  const key = JSON.stringify(props ?? {});
  useEffect(() => {
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, key]);
  return null;
}

/** 클릭 시 이벤트를 기록하는 링크 */
export function TrackedLink({
  event,
  props,
  ...rest
}: { event: string; props?: EventMeta & Record<string, unknown> } & React.ComponentProps<typeof Link>) {
  return <Link {...rest} onClick={(e) => { track(event, props); rest.onClick?.(e); }} />;
}
