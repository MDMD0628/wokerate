"use client";

import { FileCheck2, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import type { ButtonHTMLAttributes, FormEvent } from "react";
import { useMemo, useState } from "react";
import { createEmptyWorkSampleAnalysisReport } from "../../../lib/createEmptyWorkSampleAnalysisReport";
import { MVP_FULLSTACK_WORK_SAMPLE_RUBRIC } from "../../../lib/workSampleRubric";
import type { WorkSampleRubricCriterion } from "../../../lib/workSampleRubric";

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
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

function EvidenceDetails({
  title,
  items,
  defaultOpen
}: {
  title: string;
  items: string[];
  defaultOpen?: boolean;
}) {
  return (
    <details
      className="rounded-md border border-slate-200 bg-slate-50 p-3"
      open={defaultOpen}
    >
      <summary className="cursor-pointer text-sm font-bold text-slate-900">
        {title}
      </summary>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
        {items.map((item) => (
          <li key={item} className="rounded-md bg-white px-3 py-2">
            {item}
          </li>
        ))}
      </ul>
    </details>
  );
}

function CriterionCard({
  criterion,
  index
}: {
  criterion: WorkSampleRubricCriterion;
  index: number;
}) {
  return (
    <article className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
            기준 {index + 1} · {criterion.id}
          </p>
          <h2 className="mt-2 text-xl font-bold text-slate-950">
            {criterion.label}
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {criterion.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 md:justify-end">
          {criterion.related_question_ids.map((questionId) => (
            <span
              key={questionId}
              className="rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800"
            >
              {questionId}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <EvidenceDetails
          title="strong evidence"
          items={criterion.strong_evidence}
          defaultOpen
        />
        <EvidenceDetails title="moderate evidence" items={criterion.moderate_evidence} />
        <EvidenceDetails title="weak evidence" items={criterion.weak_evidence} />
        <EvidenceDetails
          title="insufficient evidence"
          items={criterion.insufficient_evidence}
        />
        <div className="lg:col-span-2">
          <EvidenceDetails title="warning signals" items={criterion.warning_signals} />
        </div>
      </div>
    </article>
  );
}

export default function WorkSampleRubricPage() {
  const [accessKey, setAccessKey] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isCheckingKey, setIsCheckingKey] = useState(false);
  const emptyReportJson = useMemo(
    () => JSON.stringify(createEmptyWorkSampleAnalysisReport(), null, 2),
    []
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
                실무 시나리오 테스트 루브릭
              </h1>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            내부 검토용 루브릭 확인 화면입니다. Supabase 데이터와 service role key는
            사용하지 않습니다.
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
              루브릭 확인하기
            </AdminButton>
          </form>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <p className="flex items-center gap-2 text-sm font-semibold text-sky-700">
            <FileCheck2 aria-hidden className="h-4 w-4" />
            내부 검토용
          </p>
          <h1 className="mt-2 text-2xl font-bold text-slate-950 md:text-3xl">
            실무 시나리오 테스트 분석 루브릭
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            AI 호출 없이 기준표와 빈 리포트 출력 구조만 확인합니다. 목적은
            업무상황 답변에서 확인 가능한 근거를 일관된 기준으로 분류하기 위한
            준비입니다.
          </p>
          <div className="mt-4 grid gap-3 text-sm md:grid-cols-4">
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">rubric_id</p>
              <p className="mt-1 font-semibold text-slate-900">
                {MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.rubric_id}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">version</p>
              <p className="mt-1 font-semibold text-slate-900">
                {MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.rubric_version}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">scenario</p>
              <p className="mt-1 font-semibold text-slate-900">
                {MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.scenario_id}
              </p>
            </div>
            <div className="rounded-md bg-slate-50 p-3">
              <p className="text-xs font-semibold text-slate-500">target role</p>
              <p className="mt-1 font-semibold text-slate-900">
                {MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.target_role}
              </p>
            </div>
          </div>
        </header>

        <div className="space-y-5">
          {MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.criteria.map((criterion, index) => (
            <CriterionCard
              key={criterion.id}
              criterion={criterion}
              index={index}
            />
          ))}
        </div>

        <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold text-slate-950">
            빈 분석 리포트 JSON 초안
          </h2>
          <pre className="mt-4 max-h-[520px] overflow-auto rounded-lg bg-slate-950 p-4 text-xs leading-5 text-slate-100">
            {emptyReportJson}
          </pre>
        </section>
      </div>
    </main>
  );
}
