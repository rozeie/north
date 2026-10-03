import raw from "@/data/contents.json";
import type { Content } from "./types";

// 운영자가 검증해 등록한 콘텐츠 DB. (MVP: data/contents.json, scripts/import-contents.mjs 로 갱신)
const contents = raw as Content[];

export function allContents(): Content[] {
  return contents;
}

export function getContent(id: string): Content | undefined {
  return contents.find((c) => c.id === id);
}
