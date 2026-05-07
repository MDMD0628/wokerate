import type { ReactNode } from "react";
import type { EvidenceLevel } from "../lib/workSampleRubric";
import type {
  WorkSampleAnalysisReport,
  WorkSampleCriterionAnalysis
} from "../lib/workSampleAnalysisTypes";

const levelLabels: Record<EvidenceLevel, string> = {
  insufficient: "근거 부족",
  weak: "제한적 근거",
  moderate: "보통 근거",
  strong: "충분한 근거"
};

function EmptyState({ children }: { children: ReactNode }) {
  return <p className="text-sm leading-6 text-slate-500">{children}</p>;
}

function Section({
  title,
  children
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function SimpleList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <EmptyState>확인된 항목이 아직 없습니다.</EmptyState>;
  }

  return (
    <ul className="space-y-2 text-sm leading-6 text-slate-800">
      {items.map((item) => (
        <li key={item} className="rounded-md bg-slate-50 px-3 py-2">
          {item}
        </li>
      ))}
    </ul>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <EmptyState>확인된 항목이 아직 없습니다.</EmptyState>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function CriterionCard({ criterion }: { criterion: WorkSampleCriterionAnalysis }) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {criterion.criterion_id}
          </p>
          <h3 className="mt-1 text-base font-bold text-slate-950">
            {criterion.label}
          </h3>
        </div>
        <span className="w-fit rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
          {levelLabels[criterion.level]}
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-teal-700">
            확인된 근거
          </p>
          <SimpleList items={criterion.evidence} />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-amber-700">
            우려점
          </p>
          <SimpleList items={criterion.concerns} />
        </div>
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-600">
            추가 확인 필요 정보
          </p>
          <SimpleList items={criterion.missing_information} />
        </div>
      </div>
    </div>
  );
}

export function WorkSampleAnalysisPreview({
  report
}: {
  report: WorkSampleAnalysisReport;
}) {
  return (
    <div className="space-y-5">
      <Section title="전체 요약">
        <p className="whitespace-pre-wrap text-sm leading-6 text-slate-800">
          {report.overall_summary || "요약이 아직 생성되지 않았습니다."}
        </p>
        <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-500">시나리오</p>
            <p className="mt-1 font-semibold text-slate-900">{report.scenario_id}</p>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-500">대상 역할</p>
            <p className="mt-1 font-semibold text-slate-900">{report.target_role}</p>
          </div>
          <div className="rounded-md bg-slate-50 px-3 py-2">
            <p className="text-xs font-semibold text-slate-500">생성 방식</p>
            <p className="mt-1 font-semibold text-slate-900">{report.source}</p>
          </div>
        </div>
      </Section>

      <Section title="기준별 분석">
        <div className="space-y-4">
          {report.criteria.map((criterion) => (
            <CriterionCard key={criterion.criterion_id} criterion={criterion} />
          ))}
        </div>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="잘 맞을 수 있는 프로젝트 유형">
          <TagList items={report.best_fit_project_types} />
        </Section>
        <Section title="잠재 리스크">
          <SimpleList items={report.potential_risks} />
        </Section>
        <Section title="추천 추가 질문">
          <SimpleList items={report.recommended_follow_up_questions} />
        </Section>
        <Section title="해석 제한 안내">
          <SimpleList items={report.prohibited_interpretations} />
        </Section>
      </div>
    </div>
  );
}
