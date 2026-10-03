"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { CAREER_STAGES, JOB_FAMILIES, MAX_PDF_BYTES } from "@/lib/constants";
import { track } from "@/lib/analytics";

// 오류가 난 첫 필드로 포커스를 옮기기 위한 순서와 id
const FIELD_ORDER: [string, string][] = [
  ["jobFamily", "job-family-first"],
  ["stage", "stage"],
  ["role", "role"],
  ["concern", "concern"],
  ["file", "resume"],
];

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(bytes / 1024))}KB`;
}

function SectionHeader({ id, step, title, description, required }: { id: string; step: number; title: string; description: string; required: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <span className="badge badge-secondary badge-count mt-0.5 shrink-0">{step}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 id={id} className="text-lead font-semibold leading-snug">{title}</h2>
          <span className={required ? "badge badge-default" : "badge badge-outline"}>{required ? "필수" : "선택"}</span>
        </div>
        <p className="mt-0.5 text-body-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export function StartForm() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [jobFamily, setJobFamily] = useState("");
  const [stage, setStage] = useState("");
  const [role, setRole] = useState("");
  const [concern, setConcern] = useState("");
  const [cover, setCover] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  const filled = [jobFamily, stage, role.trim(), concern.trim()].filter(Boolean).length;

  function validate() {
    const e: Record<string, string> = {};
    if (!jobFamily) e.jobFamily = "직군을 선택해 주세요.";
    if (!stage) e.stage = "경력 단계를 선택해 주세요.";
    if (!role.trim()) e.role = "목표 직무를 입력해 주세요.";
    if (!concern.trim()) e.concern = "현재 커리어 또는 프로젝트 고민을 입력해 주세요.";
    const pdf = fileRef.current?.files?.[0];
    if (pdf && pdf.size > MAX_PDF_BYTES) e.file = `PDF 파일은 ${MAX_PDF_BYTES / 1024 / 1024}MB 이하로 올려 주세요.`;
    setErrors(e);
    const first = FIELD_ORDER.find(([k]) => e[k]);
    if (first) document.getElementById(first[1])?.focus();
    return Object.keys(e).length === 0;
  }

  function clearError(key: string) {
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function onFileChange(f: File | undefined) {
    if (!f) {
      setFile(null);
      return;
    }
    setFile({ name: f.name, size: f.size });
    if (f.size > MAX_PDF_BYTES) {
      setErrors((prev) => ({ ...prev, file: `PDF 파일은 ${MAX_PDF_BYTES / 1024 / 1024}MB 이하로 올려 주세요.` }));
    } else {
      clearError("file");
    }
  }

  function removeFile() {
    if (fileRef.current) fileRef.current.value = "";
    setFile(null);
    clearError("file");
  }

  async function submit(withoutPdf = false) {
    setServerError("");
    if (!validate()) return;
    track("Profile Analyze Submit", { withoutPdf });
    setLoading(true);
    const fd = new FormData();
    fd.set("job_family", jobFamily);
    fd.set("career_stage", stage);
    fd.set("target_role", role);
    fd.set("current_concern", concern);
    fd.set("cover_letter_text", cover);
    fd.set("portfolio_text", portfolio);
    const pdf = fileRef.current?.files?.[0];
    if (pdf && !withoutPdf) fd.set("resume", pdf);
    try {
      const res = await fetch("/api/profile/analyze", { method: "POST", body: fd });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!data.ok) {
        // 입력값은 상태에 그대로 남아 있다.
        setServerError(data.error ?? "분석 중 문제가 생겼어요. 다시 시도해 주세요.");
        setLoading(false);
        return;
      }
      router.push("/direction");
      router.refresh();
    } catch {
      setServerError("네트워크 문제로 분석하지 못했어요. 입력한 내용은 그대로 남아 있으니 다시 시도해 주세요.");
      setLoading(false);
    }
  }

  const err = (k: string, id?: string) =>
    errors[k] ? (
      <p role="alert" id={id ?? `${k}-error`} className="mt-1.5 text-sm text-destructive">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="space-y-4"
    >
      {/* 1. 기본 정보 (필수) */}
      <section aria-labelledby="sec-basic" className="card space-y-5">
        <SectionHeader id="sec-basic" step={1} title="기본 정보" description="추천 자료의 범위와 난이도를 정하는 데 쓰여요." required />
        <div className="space-y-5 sm:pl-8">
          <fieldset aria-describedby={errors.jobFamily ? "jobFamily-error" : undefined}>
            <legend className="label">직군</legend>
            <div className="grid gap-2">
              {JOB_FAMILIES.map((j, i) => (
                <label key={j.value} className={`choice ${jobFamily === j.value ? "is-selected" : ""}`}>
                  <input
                    id={i === 0 ? "job-family-first" : undefined}
                    type="radio"
                    name="job_family"
                    value={j.value}
                    checked={jobFamily === j.value}
                    onChange={() => {
                      setJobFamily(j.value);
                      clearError("jobFamily");
                    }}
                    className="accent-primary"
                  />
                  <span className="text-body-sm">{j.label}</span>
                </label>
              ))}
            </div>
            {err("jobFamily")}
          </fieldset>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="stage" className="label">
                경력 단계
              </label>
              <select
                id="stage"
                className="field"
                value={stage}
                aria-invalid={Boolean(errors.stage)}
                aria-describedby={errors.stage ? "stage-error" : undefined}
                onChange={(e) => {
                  setStage(e.target.value);
                  clearError("stage");
                }}
              >
                <option value="">선택해 주세요</option>
                {CAREER_STAGES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {err("stage")}
            </div>
            <div>
              <label htmlFor="role" className="label">
                목표 직무
              </label>
              <input
                id="role"
                className="field"
                value={role}
                aria-invalid={Boolean(errors.role)}
                aria-describedby={errors.role ? "role-error" : undefined}
                onChange={(e) => {
                  setRole(e.target.value);
                  clearError("role");
                }}
                placeholder="예: 프로덕트 디자이너"
              />
              {err("role")}
            </div>
          </div>
        </div>
      </section>

      {/* 2. 현재 고민 (필수) */}
      <section aria-labelledby="sec-concern" className="card space-y-4">
        <SectionHeader id="sec-concern" step={2} title="현재 커리어 고민" description="구체적으로 적을수록 초안이 고민에 가까워져요. 막힌 장면을 그대로 써도 좋아요." required />
        <div className="sm:pl-8">
          <label htmlFor="concern" className="sr-only">
            현재 커리어 또는 프로젝트 고민
          </label>
          <textarea
            id="concern"
            rows={6}
            className="field"
            value={concern}
            aria-invalid={Boolean(errors.concern)}
            aria-describedby={errors.concern ? "concern-error" : undefined}
            onChange={(e) => {
              setConcern(e.target.value);
              clearError("concern");
            }}
            placeholder="예: 인터뷰는 여러 번 했는데 솔루션으로 연결할 때마다 확신이 없어요."
          />
          {err("concern")}
        </div>
      </section>

      {/* 3. 이력과 경험 (선택) */}
      <section aria-labelledby="sec-extra" className="card space-y-4">
        <SectionHeader id="sec-extra" step={3} title="이력과 경험" description="없어도 괜찮아요. 더하면 초안이 내 경험에 더 가까워져요." required={false} />
        <div className="space-y-5 sm:pl-8">
          <div>
            <p className="label">이력서 PDF</p>
            {file ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-body-sm font-medium">{file.name}</p>
                  <p className="text-caption text-muted-foreground">{formatSize(file.size)}</p>
                </div>
                <button type="button" className="btn btn-ghost btn-sm shrink-0" onClick={removeFile}>
                  삭제
                </button>
              </div>
            ) : (
              <label
                htmlFor="resume"
                className="card-dashed block cursor-pointer !py-6 transition-colors hover:bg-secondary/40 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring"
              >
                <span className="btn btn-outline btn-sm pointer-events-none">PDF 파일 선택</span>
                <span className="mt-2 block text-caption">PDF · 최대 {MAX_PDF_BYTES / 1024 / 1024}MB</span>
              </label>
            )}
            <input
              id="resume"
              ref={fileRef}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              aria-describedby={errors.file ? "file-error" : "resume-hint"}
              onChange={(e) => onFileChange(e.target.files?.[0])}
            />
            <p id="resume-hint" className="hint mt-1.5">
              최초 1회만 분석하고, 이후 추천에는 분석해 정리한 프로필만 사용해요.
            </p>
            {err("file")}
          </div>

          <details className="group rounded-lg border border-border bg-card">
            <summary className="flex cursor-pointer items-center justify-between px-4 py-3 text-body-sm font-medium">
              자기소개서·포트폴리오 설명 직접 입력
              <span className="text-caption text-muted-foreground group-open:hidden">펼치기</span>
            </summary>
            <div className="space-y-4 border-t border-border p-4">
              <div>
                <label htmlFor="cover" className="label">
                  자기소개서
                </label>
                <textarea id="cover" rows={4} className="field" value={cover} onChange={(e) => setCover(e.target.value)} />
              </div>
              <div>
                <label htmlFor="portfolio" className="label">
                  포트폴리오 설명
                </label>
                <textarea id="portfolio" rows={4} className="field" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
              </div>
            </div>
          </details>
        </div>
      </section>

      {serverError && (
        <div role="alert" className="alert">
          <p>{serverError}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button type="button" className="btn btn-outline btn-sm" onClick={() => void submit()} disabled={loading}>
              다시 시도
            </button>
            {file && (
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => void submit(true)} disabled={loading}>
                PDF 없이 진행
              </button>
            )}
          </div>
        </div>
      )}

      {/* 제출 */}
      <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-body-sm text-muted-foreground" aria-live="polite">
          {loading ? "입력한 내용을 정리하고 있어요. 잠시만 기다려 주세요." : `필수 항목 ${filled}/4 입력됨`}
        </p>
        <button type="submit" className="btn btn-primary btn-lg w-full sm:w-auto" disabled={loading}>
          {loading ? "초안을 만들고 있어요…" : "성장 방향 초안 만들기"}
        </button>
      </div>
    </form>
  );
}
