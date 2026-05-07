"use client";

import {
  Download,
  FileSearch,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import type { ButtonHTMLAttributes, FormEvent } from "react";
import { useMemo, useState } from "react";
import { WorkSampleAnalysisPreview } from "../../../components/WorkSampleAnalysisPreview";
import type { WorkSampleAnalysisReport } from "../../../lib/workSampleAnalysisTypes";

type AnalyzeWorkSampleResponse = {
  success?: boolean;
  report?: WorkSampleAnalysisReport;
  saved?: boolean;
  report_id?: string;
  fallback_used?: boolean;
  fallback_reason?: string;
  error?: string;
  detail?: string;
};

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
  const candidates = [
    record.id,
    record.submission_id,
    record.source_submission_id,
    record.candidate_submission_id
  ];
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

function downloadJson(filename: string, content: string) {
  const blob = new Blob([content], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export default function AdminWorkSampleAnalysisPage() {
  const [accessKey, setAccessKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const [candidateJsonInput, setCandidateJsonInput] = useState("");
  const [candidateSubmissionId, setCandidateSubmissionId] = useState("");
  const [saveToSupabase, setSaveToSupabase] = useState(false);
  const [report, setReport] = useState<WorkSampleAnalysisReport | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [fallbackReason, setFallbackReason] = useState("");
  const [saved, setSaved] = useState(false);
  const [reportId, setReportId] = useState("");

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

  async function analyzeWorkSample() {
    setAnalysisError("");
    setReport(null);
    setFallbackUsed(false);
    setFallbackReason("");
    setSaved(false);
    setReportId("");
    setIsAnalyzing(true);

    try {
      const parsed = JSON.parse(candidateJsonInput) as unknown;
      const candidateProfile = extractProfilePayload(parsed);
      const submissionId = candidateSubmissionId.trim() || extractSubmissionId(parsed);
      const response = await fetch("/api/analyze-work-sample", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          candidate_submission_id: submissionId,
          candidate_profile: candidateProfile,
          save_to_supabase: saveToSupabase
        })
      });
      const payload = (await response.json()) as AnalyzeWorkSampleResponse;

      if (!response.ok || !payload.success || !payload.report) {
        throw new Error(
          payload.detail
            ? `${payload.error || "실무 테스트 분석에 실패했습니다."} ${payload.detail}`
            : payload.error || "실무 테스트 분석에 실패했습니다."
        );
      }

      setReport(payload.report);
      setFallbackUsed(payload.fallback_used === true);
      setFallbackReason(payload.fallback_reason || "");
      setSaved(payload.saved === true);
      setReportId(payload.report_id || "");
      if (submissionId) {
        setCandidateSubmissionId(submissionId);
      }
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "실무 테스트 분석 중 오류가 발생했습니다."
      );
    } finally {
      setIsAnalyzing(false);
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
                실무 테스트 분석
              </h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            이 페이지는 내부 검토용입니다. 후보자의 실무 시나리오 답변을 루브릭
            기준으로 분석해 리포트 초안을 생성합니다.
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
              실무 테스트 분석 리포트
            </p>
            <h1 className="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">
              실무 시나리오 답변 분석
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
              이 페이지는 내부 검토용입니다. candidate_profile JSON을 붙여넣으면
              `/api/analyze-work-sample`을 통해 루브릭 기반 리포트 초안을
              생성합니다.
            </p>
          </div>
          <AdminButton
            type="button"
            variant="secondary"
            onClick={() => {
              setIsAuthorized(false);
              setReport(null);
              setAnalysisError("");
            }}
          >
            잠금
          </AdminButton>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="text-base font-bold text-slate-950">
                candidate_profile JSON
              </h2>
              <AdminButton
                type="button"
                onClick={analyzeWorkSample}
                disabled={!candidateJsonInput.trim() || isAnalyzing}
                loading={isAnalyzing}
              >
                <Sparkles aria-hidden className="h-4 w-4" />
                실무 테스트 분석하기
              </AdminButton>
            </div>

            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-slate-800">
                candidate_submission_id
              </span>
              <input
                value={candidateSubmissionId}
                onChange={(event) => setCandidateSubmissionId(event.target.value)}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-sky-600"
                placeholder="선택 입력: Supabase candidate_submissions.id"
              />
            </label>

            <label className="mt-4 flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={saveToSupabase}
                onChange={(event) => setSaveToSupabase(event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700"
              />
              <span>
                생성된 리포트를 Supabase `candidate_work_sample_reports` 테이블에
                저장합니다. SQL 테이블이 먼저 생성되어 있어야 합니다.
              </span>
            </label>

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
  "work_sample_test": {
    "scenario_id": "mvp_fullstack_001",
    "answers": []
  }
}`}
            />

            {analysisError ? (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {analysisError}
              </p>
            ) : null}
          </section>

          <section>
            {report ? (
              <div className="space-y-5">
                <div
                  className={classNames(
                    "rounded-lg border p-4 text-sm leading-6",
                    fallbackUsed
                      ? "border-amber-200 bg-amber-50 text-amber-900"
                      : "border-teal-200 bg-teal-50 text-teal-900"
                  )}
                >
                  <p className="font-bold">
                    {fallbackUsed
                      ? "fallback 리포트가 생성되었습니다."
                      : "분석 리포트가 생성되었습니다."}
                  </p>
                  {fallbackReason ? <p className="mt-1">{fallbackReason}</p> : null}
                  {saved ? (
                    <p className="mt-1">
                      Supabase 저장 완료{reportId ? ` · report_id: ${reportId}` : ""}
                    </p>
                  ) : (
                    <p className="mt-1">Supabase 저장은 실행하지 않았습니다.</p>
                  )}
                </div>

                <WorkSampleAnalysisPreview report={report} />

                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <h2 className="text-base font-bold text-slate-950">
                      report JSON preview
                    </h2>
                    <AdminButton
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        downloadJson("work_sample_analysis_report.json", reportJson)
                      }
                    >
                      <Download aria-hidden className="h-4 w-4" />
                      report JSON 다운로드
                    </AdminButton>
                  </div>
                  <pre className="mt-4 max-h-[520px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
                    {reportJson}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center text-sm leading-6 text-slate-500">
                candidate_profile JSON을 붙여넣고 실무 테스트 분석하기 버튼을 누르면
                미리보기가 표시됩니다.
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
