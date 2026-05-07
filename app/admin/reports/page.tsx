"use client";

import {
  FileSearch,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { ButtonHTMLAttributes, FormEvent } from "react";
import { useMemo, useState } from "react";
import { CandidateReportPreview } from "../../../components/CandidateReportPreview";
import { buildCandidateReportDraft } from "../../../lib/buildCandidateReportDraft";
import type { CandidateAnalysisReport } from "../../../lib/reportTypes";

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

function extractProfilePayload(parsed: unknown) {
  if (
    typeof parsed === "object" &&
    parsed !== null &&
    "candidate_profile" in parsed
  ) {
    return (parsed as { candidate_profile: unknown }).candidate_profile;
  }

  return parsed;
}

function extractSubmissionId(parsed: unknown) {
  if (typeof parsed !== "object" || parsed === null) {
    return "";
  }

  const record = parsed as Record<string, unknown>;
  const candidates = [record.id, record.submission_id, record.source_submission_id];
  const id = candidates.find((value) => typeof value === "string");
  return typeof id === "string" ? id : "";
}

function AdminButton({
  children,
  loading,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={classNames(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary"
          ? "bg-sky-700 text-white hover:bg-sky-800"
          : "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50",
        props.className
      )}
    >
      {loading ? <Loader2 aria-hidden className="h-4 w-4 animate-spin" /> : null}
      <span>{children}</span>
    </button>
  );
}

export default function AdminReportsPage() {
  const [accessKey, setAccessKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [candidateJsonInput, setCandidateJsonInput] = useState("");
  const [report, setReport] = useState<CandidateAnalysisReport | null>(null);
  const [parseError, setParseError] = useState("");

  const reportJson = useMemo(
    () => (report ? JSON.stringify(report, null, 2) : ""),
    [report]
  );

  async function validateAccessKey(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setIsCheckingKey(true);

    try {
      const response = await fetch("/api/admin/validate-key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ access_key: accessKey })
      });
      const payload = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !payload.success) {
        setAuthError(payload.error || "관리자 키를 확인할 수 없습니다.");
        return;
      }

      setIsAuthorized(true);
      setAccessKey("");
    } catch (error) {
      setAuthError(
        error instanceof Error
          ? error.message
          : "관리자 키 확인 중 오류가 발생했습니다."
      );
    } finally {
      setIsCheckingKey(false);
    }
  }

  function buildReportDraft() {
    setParseError("");

    try {
      const parsed = JSON.parse(candidateJsonInput) as unknown;
      const candidateProfile = extractProfilePayload(parsed);
      const sourceSubmissionId = extractSubmissionId(parsed);
      setReport(buildCandidateReportDraft(candidateProfile, { sourceSubmissionId }));
    } catch (error) {
      setReport(null);
      setParseError(
        error instanceof Error
          ? `JSON 파싱 오류: ${error.message}`
          : "JSON을 읽는 중 오류가 발생했습니다."
      );
    }
  }

  if (!isAuthorized) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-900">
        <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-sky-50 text-sky-700">
              <ShieldCheck aria-hidden className="h-5 w-5" />
            </span>
            <div>
              <p className="text-sm font-semibold text-sky-700">Workerate Admin</p>
              <h1 className="text-2xl font-bold text-slate-950">
                후보자 분석 리포트
              </h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            공개 후보자 입력 폼과 분리된 관리자용 리포트 초안 생성 화면입니다.
            현재는 Supabase 목록 조회 없이 candidate_profile JSON 붙여넣기로만
            확인합니다.
          </p>

          <form onSubmit={validateAccessKey} className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-800">
                <KeyRound aria-hidden className="h-4 w-4" />
                ADMIN_ACCESS_KEY
              </span>
              <input
                type="password"
                value={accessKey}
                onChange={(event) => setAccessKey(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-600"
                placeholder="관리자 접근 키"
              />
            </label>
            {authError ? (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {authError}
              </p>
            ) : null}
            <AdminButton type="submit" loading={isCheckingKey}>
              관리자 화면 열기
            </AdminButton>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-start md:justify-between">
          <div>
            <p className="flex items-center gap-2 text-sm font-semibold text-sky-700">
              <FileSearch aria-hidden className="h-4 w-4" />
              리포트 초안 생성
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">
              후보자 분석 리포트 미리보기
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              candidate_profile JSON만 붙여넣으면 AI 호출 없이 표준 리포트 초안을
              생성합니다. Supabase 자동 조회는 이후 단계에서 붙일 수 있도록 화면을
              분리해 두었습니다.
            </p>
          </div>
          <AdminButton
            type="button"
            variant="secondary"
            onClick={() => {
              setIsAuthorized(false);
              setReport(null);
              setParseError("");
            }}
          >
            잠금
          </AdminButton>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-bold text-slate-950">
                candidate_profile JSON
              </h2>
              <AdminButton
                type="button"
                onClick={buildReportDraft}
                disabled={!candidateJsonInput.trim()}
              >
                <Sparkles aria-hidden className="h-4 w-4" />
                리포트 초안 생성
              </AdminButton>
            </div>
            <textarea
              value={candidateJsonInput}
              onChange={(event) => setCandidateJsonInput(event.target.value)}
              className="mt-4 min-h-[520px] w-full rounded-lg border border-slate-300 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100 shadow-sm focus:border-sky-500"
              spellCheck={false}
              placeholder={`{
  "candidate_basic_info": {
    "name_or_nickname": "workerate",
    "email": "candidate@example.com",
    "preferred_work_type": ["MVP 제작"],
    "tech_stack": ["Next.js", "TypeScript", "Supabase"]
  },
  "links": {
    "github_url": "https://github.com/example"
  },
  "projects": []
}`}
            />
            {parseError ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {parseError}
              </p>
            ) : null}
          </section>

          <section>
            {report ? (
              <div className="space-y-5">
                <CandidateReportPreview report={report} />
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-base font-bold text-slate-950">
                    report JSON preview
                  </h2>
                  <pre className="mt-4 max-h-[520px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                    {reportJson}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm leading-6 text-slate-500">
                candidate_profile JSON을 붙여넣고 리포트 초안 생성 버튼을 누르면
                미리보기가 표시됩니다.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
