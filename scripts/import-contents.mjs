// 운영자용 콘텐츠 임포트 스크립트 (PRD F4-5). 별도 어드민 UI는 없다.
// 사용: npm run import:contents -- <file.json|file.csv>
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const TYPES = ["concept", "case", "evidence"];
const FAMILIES = ["design", "pm", "marketing"];
const DIFFICULTIES = ["입문", "기본", "심화"];

const file = process.argv[2];
if (!file) {
  console.error("사용법: npm run import:contents -- <file.json|file.csv>");
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((c) => c !== "")) rows.push(row);
      row = [];
    } else cell += ch;
  }
  row.push(cell);
  if (row.some((c) => c !== "")) rows.push(row);
  const [header, ...body] = rows;
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h.trim(), (r[i] ?? "").trim()])));
}

const raw = readFileSync(file, "utf8").replace(/^﻿/, "");
let items = file.toLowerCase().endsWith(".csv") ? parseCsv(raw) : JSON.parse(raw);

items = items.map((it) => ({
  id: String(it.id),
  title: String(it.title),
  author_source: String(it.author_source),
  url: String(it.url),
  type: it.type,
  est_read_min: Number(it.est_read_min),
  job_families: Array.isArray(it.job_families) ? it.job_families : String(it.job_families).split("|").map((s) => s.trim()),
  topic_tags: Array.isArray(it.topic_tags) ? it.topic_tags : String(it.topic_tags).split("|").map((s) => s.trim()),
  difficulty: it.difficulty,
}));

const errors = [];
const ids = new Set();
items.forEach((it, i) => {
  const where = `#${i + 1} (${it.id})`;
  if (!it.id || ids.has(it.id)) errors.push(`${where}: id 누락 또는 중복`);
  ids.add(it.id);
  if (!it.title) errors.push(`${where}: title 누락`);
  if (!it.author_source) errors.push(`${where}: author_source 누락`);
  if (!/^https?:\/\//.test(it.url)) errors.push(`${where}: url 형식 오류`);
  if (!TYPES.includes(it.type)) errors.push(`${where}: type 은 ${TYPES.join("/")} 중 하나`);
  if (!Number.isFinite(it.est_read_min) || it.est_read_min <= 0) errors.push(`${where}: est_read_min 오류`);
  if (!it.job_families.length || it.job_families.some((f) => !FAMILIES.includes(f))) errors.push(`${where}: job_families 오류`);
  if (!it.topic_tags.length || it.topic_tags.some((t) => !t)) errors.push(`${where}: topic_tags 누락`);
  if (!DIFFICULTIES.includes(it.difficulty)) errors.push(`${where}: difficulty 는 ${DIFFICULTIES.join("/")} 중 하나`);
});

if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const out = path.join(process.cwd(), "src", "data", "contents.json");
writeFileSync(out, JSON.stringify(items, null, 2) + "\n", "utf8");
console.log(`${items.length}건을 ${out} 에 저장했습니다.`);
