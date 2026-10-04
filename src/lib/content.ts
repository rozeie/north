import raw from "@/data/contents.json";
import { CONTENT_TYPE_LABEL } from "./constants";
import type { Content } from "./types";

// 운영자가 검증해 등록한 콘텐츠 DB. (MVP: data/contents.json, scripts/import-contents.mjs 로 갱신)
const contents = raw as Content[];

export function allContents(): Content[] {
  return contents;
}

export function getContent(id: string): Content | undefined {
  return contents.find((c) => c.id === id);
}

/** 한 줄 설명. 콘텐츠 DB에 summary 가 없으면 태그로 만든 임시 문구를 쓴다. */
export function contentSummary(c: Content): string {
  return c.summary ?? `${c.topic_tags.slice(0, 3).join(" · ")}을(를) 다루는 ${CONTENT_TYPE_LABEL[c.type]} 자료`;
}
