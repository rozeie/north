// MVP 임시 저장소: 로컬 JSON 파일(.data/db.json).
// 실제 DB(예: Postgres)로 교체할 때는 이 파일과 repo.ts 만 바꾸면 된다.
import { promises as fs } from "fs";
import path from "path";
import type { Database } from "./types";

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

const emptyDb = (): Database => ({
  users: [],
  settings: [],
  profiles: [],
  directions: [],
  recommendations: [],
  cards: [],
  library: [],
  reflections: [],
  events: [],
});

async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    return { ...emptyDb(), ...(JSON.parse(raw) as Partial<Database>) };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return emptyDb();
    throw err;
  }
}

async function writeDb(db: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DB_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  await fs.rename(tmp, DB_FILE);
}

// 쓰기는 한 줄로 직렬화한다(읽기-수정-쓰기 경합 방지).
const g = globalThis as unknown as { __northQueue?: Promise<unknown> };

export async function readOnly<T>(fn: (db: Database) => T): Promise<T> {
  await (g.__northQueue ?? Promise.resolve()).catch(() => undefined);
  return fn(await readDb());
}

export function mutate<T>(fn: (db: Database) => T): Promise<T> {
  const run = async () => {
    const db = await readDb();
    const result = fn(db);
    await writeDb(db);
    return result;
  };
  const next = (g.__northQueue ?? Promise.resolve()).catch(() => undefined).then(run);
  g.__northQueue = next;
  return next;
}
