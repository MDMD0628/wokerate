import type {
  CandidateAnalysisReport,
  ReportEvidenceSection,
  ReportLevel
} from "../lib/reportTypes";
import type { ReactNode } from "react";

const levelLabels: Record<ReportLevel, string> = {
  insufficient: "근거 부족",
  basic: "기초 근거",
  moderate: "보통 근거",
  strong: "충분한 근거"
};

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}

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
    <section className="rounded-lg border border-slate-200 bg-white p-5">
      <h2 className="text-base font-bold text-slate-950">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
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

function TextBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
        {value || "확인된 내용이 아직 없습니다."}
      </p>
    </div>
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

function TechnicalSection({
  title,
  section
}: {
  title: string;
  section: ReportEvidenceSection;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-slate-950">{title}</h3>
        <span className="rounded-md bg-sky-50 px-2.5 py-1 text-xs font-semibold text-sky-800">
          {levelLabels[section.level]}
        </span>
      </div>
      <div className="mt-3">
        <SimpleList items={section.evidence} />
      </div>
      {section.concerns.length > 0 ? (
        <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3">
          <SimpleList items={section.concerns} />
        </div>
      ) : null}
    </div>
  );
}

export function CandidateReportPreview({
  report
}: {
  report: CandidateAnalysisReport;
}) {
  const projectEvidence = unique([
    ...report.technical_fit.frontend.evidence,
    ...report.technical_fit.backend_api.evidence,
    ...report.technical_fit.database.evidence,
    ...report.technical_fit.deployment_operations.evidence
  ]);

  return (
    <div className="space-y-5">
      <Section title="후보자 요약">
        <div className="grid gap-4 md:grid-cols-2">
          <TextBlock
            label="이름 또는 닉네임"
            value={report.candidate_summary.name_or_nickname}
          />
          <TextBlock label="헤드라인" value={report.candidate_summary.headline} />
          <div className="md:col-span-2">
            <TextBlock
              label="관찰 요약"
              value={report.candidate_summary.overall_observation}
            />
          </div>
        </div>
      </Section>

      <Section title="확인된 기술 범위">
        <div className="grid gap-4 md:grid-cols-2">
          <TextBlock
            label="프로젝트 수"
            value={`${report.verified_experience.project_count}개`}
          />
          <TextBlock
            label="풀스택 범위"
            value={report.verified_experience.fullstack_scope}
          />
          <TextBlock
            label="배포 경험"
            value={report.verified_experience.deployment_experience}
          />
          <TextBlock
            label="협업 근거"
            value={report.verified_experience.collaboration_evidence}
          />
          <div className="md:col-span-2">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              기술스택
            </p>
            <TagList items={report.verified_experience.tech_stack} />
          </div>
        </div>
      </Section>

      <Section title="프로젝트 근거">
        <SimpleList items={projectEvidence.slice(0, 12)} />
      </Section>

      <Section title="기술 영역별 근거">
        <div className="grid gap-4 lg:grid-cols-2">
          <TechnicalSection title="프론트엔드" section={report.technical_fit.frontend} />
          <TechnicalSection
            title="백엔드/API"
            section={report.technical_fit.backend_api}
          />
          <TechnicalSection title="데이터베이스" section={report.technical_fit.database} />
          <TechnicalSection
            title="배포/운영"
            section={report.technical_fit.deployment_operations}
          />
        </div>
      </Section>

      <Section title="MVP 제작 적합성">
        <div className="grid gap-4 md:grid-cols-2">
          <TextBlock
            label="요구사항 분해"
            value={report.mvp_execution_fit.requirement_breakdown}
          />
          <TextBlock
            label="우선순위 판단"
            value={report.mvp_execution_fit.prioritization}
          />
          <TextBlock
            label="완료 근거"
            value={report.mvp_execution_fit.completion_evidence}
          />
          <TextBlock label="확인 필요 리스크" value={report.mvp_execution_fit.risk} />
        </div>
      </Section>

      <Section title="비개발자 협업 적합성">
        <div className="grid gap-4 md:grid-cols-2">
          <TextBlock
            label="커뮤니케이션 명확성"
            value={report.non_developer_collaboration_fit.communication_clarity}
          />
          <TextBlock
            label="요구사항 변경 대응"
            value={report.non_developer_collaboration_fit.requirement_change_response}
          />
          <TextBlock
            label="진행 상황 공유"
            value={report.non_developer_collaboration_fit.progress_sharing}
          />
          <TextBlock
            label="인수인계 준비도"
            value={report.non_developer_collaboration_fit.handover_readiness}
          />
        </div>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="잘 맞는 프로젝트 유형">
          <TagList items={report.best_fit_project_types} />
        </Section>
        <Section title="잠재 리스크">
          <SimpleList items={report.potential_risks} />
        </Section>
        <Section title="추가 확인 질문">
          <SimpleList items={report.recommended_follow_up_questions} />
        </Section>
        <Section title="근거 부족 항목">
          <SimpleList items={report.missing_information} />
        </Section>
      </div>
    </div>
  );
}
