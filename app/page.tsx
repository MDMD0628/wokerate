"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  ClipboardList,
  Download,
  FileCheck2,
  FileJson,
  Link as LinkIcon,
  Loader2,
  MailCheck,
  MessageSquareText,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UsersRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { WorkSampleAnswer, WorkSampleTest } from "../lib/workSampleTypes";

type CandidateBasicInfo = {
  name_or_nickname: string;
  email: string;
  current_status: string;
  preferred_work_type: string[];
  tech_stack: string[];
};

type CandidateLinks = {
  github_url: string;
  portfolio_url: string;
  deployed_service_url: string;
  blog_url: string;
  linkedin_url: string;
};

type FollowUpQuestion = {
  project_name: string;
  category: string;
  question: string;
};

type FollowUpAnswer = FollowUpQuestion & {
  answer: string;
};

type Project = {
  id: string;
  name: string;
  url: string;
  github_url: string;
  project_type: string;
  purpose: string;
  role: string;
  tech_stack: string[];
  implemented_features: string[];
  frontend_scope: string;
  backend_scope: string;
  database_scope: string;
  auth_experience: string;
  deployment_experience: string;
  real_user_or_client: string;
  collaboration_people: string;
  difficulty: string;
  solution_process: string;
  result: string;
  capacity_reason: string;
  ai_follow_up_answers: FollowUpAnswer[];
};

type CollaborationExperience = {
  pr_issue_code_review: string;
  role_distribution: string;
  requirement_change_response: string;
  delay_or_error_communication: string;
  non_developer_communication: string;
  collaboration_difficulty_solution: string;
};

type CandidateDraft = {
  candidate_basic_info: CandidateBasicInfo;
  links: CandidateLinks;
  projects: Project[];
  collaboration_experience: CollaborationExperience;
  work_sample_test: WorkSampleTest;
  raw_ai_follow_up_questions: FollowUpQuestion[];
};

type ConsentState = {
  privacy_collection_required: boolean;
  ai_analysis_required: boolean;
  third_party_matching_optional: boolean;
  marketing_optional: boolean;
  consented_at: string;
};

type ConsentLog = {
  privacy_collection_required: boolean;
  ai_analysis_required: boolean;
  third_party_matching_optional: boolean;
  marketing_optional: boolean;
  consent_version: string;
  consented_at: string;
  policy_summary: {
    retention_period: string;
    purpose: string;
    third_party_provision: string;
  };
};

type SubmitResult = {
  candidate_profile: ReturnType<typeof buildCandidateProfile>;
  consent_log: ConsentLog;
};

type StoredState = {
  activeStep: number;
  draft: CandidateDraft;
  consent: ConsentState;
  submitted: boolean;
  database_submitted?: boolean;
  database_submission_id?: string;
};

const STORAGE_KEY = "workerate_candidate_profile_consent_draft_v2";
const CONSENT_VERSION = "2026-05-06-v1";
const DELETE_REQUEST_TEXT = "삭제 요청: 운영자 이메일 입력 예정";

const currentStatusOptions = [
  "취업 준비 중",
  "재직 중",
  "프리랜서",
  "학생",
  "사이드프로젝트 중",
  "기타"
];

const preferredWorkOptions = [
  "MVP 제작",
  "SaaS 개발",
  "프론트엔드 중심",
  "백엔드 중심",
  "풀스택 전체",
  "유지보수",
  "관리자 페이지 개발",
  "API 연동",
  "AI 기능 연동"
];

const techExamples = [
  "React",
  "Next.js",
  "TypeScript",
  "Node.js",
  "NestJS",
  "Express",
  "PostgreSQL",
  "Supabase",
  "Firebase",
  "AWS",
  "Cloudflare",
  "Vercel",
  "Docker"
];

const projectTypeOptions = [
  "개인 프로젝트",
  "팀 프로젝트",
  "외주",
  "실무",
  "클론코딩",
  "사이드프로젝트",
  "오픈소스"
];

const steps: Array<{ title: string; icon: LucideIcon }> = [
  { title: "랜딩", icon: Sparkles },
  { title: "개인정보 동의", icon: ShieldCheck },
  { title: "AI 분석 동의", icon: FileCheck2 },
  { title: "선택 동의", icon: Building2 },
  { title: "기본 정보", icon: UserRound },
  { title: "링크", icon: LinkIcon },
  { title: "프로젝트", icon: BriefcaseBusiness },
  { title: "협업 경험", icon: UsersRound },
  { title: "실무 테스트", icon: ClipboardList },
  { title: "AI 질문", icon: MessageSquareText },
  { title: "답변", icon: FileCheck2 },
  { title: "최종 확인", icon: CheckCircle2 },
  { title: "JSON Export", icon: FileJson }
];

const WORK_SAMPLE_STEP_INDEX = 8;
const AI_QUESTIONS_STEP_INDEX = 9;
const AI_ANSWERS_STEP_INDEX = 10;
const REVIEW_STEP_INDEX = 11;
const EXPORT_STEP_INDEX = 12;

const requiredWorkSampleQuestionIds = [
  "requirement_understanding",
  "mvp_prioritization",
  "risk_communication",
  "handover_readiness"
];

const workSampleQuestions: Array<Pick<WorkSampleAnswer, "question_id" | "question">> = [
  {
    question_id: "requirement_understanding",
    question:
      "의뢰자의 요구사항을 읽고, 당신이 이해한 프로젝트 목표를 정리해주세요. 추가로 의뢰자에게 꼭 확인해야 할 질문도 적어주세요."
  },
  {
    question_id: "mvp_prioritization",
    question:
      "4주 안에 MVP를 만든다고 가정했을 때, 꼭 먼저 구현해야 할 기능과 나중으로 미뤄도 되는 기능을 나눠주세요. 그렇게 나눈 이유도 설명해주세요."
  },
  {
    question_id: "technical_structuring",
    question:
      "이 서비스를 만든다면 프론트엔드, 백엔드/API, DB는 각각 어떤 구조가 필요하다고 보나요? 너무 전문적인 코드가 아니라, 의뢰자도 이해할 수 있는 수준으로 설명해주세요."
  },
  {
    question_id: "work_plan",
    question:
      "4주 동안 어떤 순서로 작업을 진행하겠습니까? 주차별 또는 단계별로 작업 계획을 작성해주세요."
  },
  {
    question_id: "risk_communication",
    question:
      "개발 중 결제 기능 구현이 예상보다 지연된다고 가정해봅시다. 비개발 의뢰자에게 현재 상황, 대안, 일정 영향을 어떻게 설명하겠습니까? 실제 메시지처럼 작성해주세요."
  },
  {
    question_id: "problem_solving",
    question:
      "예약 시간이 중복으로 잡히는 버그가 발생했다고 가정해봅시다. 문제 원인을 어떤 순서로 확인하고 해결하겠습니까?"
  },
  {
    question_id: "handover_readiness",
    question:
      "프로젝트가 끝난 뒤 의뢰자가 유지보수나 인수인계를 받을 수 있도록 어떤 자료를 남기겠습니까? README, 환경변수, 계정, 배포, DB 구조 등을 고려해 작성해주세요."
  },
  {
    question_id: "process_reflection",
    question:
      "이 테스트를 풀면서 어떤 순서로 생각했는지, 가장 중요하게 판단한 기준은 무엇이었는지 적어주세요."
  }
];

function createProject(index: number): Project {
  return {
    id: `project-${index + 1}`,
    name: "",
    url: "",
    github_url: "",
    project_type: "",
    purpose: "",
    role: "",
    tech_stack: [],
    implemented_features: [],
    frontend_scope: "",
    backend_scope: "",
    database_scope: "",
    auth_experience: "",
    deployment_experience: "",
    real_user_or_client: "",
    collaboration_people: "",
    difficulty: "",
    solution_process: "",
    result: "",
    capacity_reason: "",
    ai_follow_up_answers: []
  };
}

function createDefaultWorkSampleTest(): WorkSampleTest {
  return {
    scenario_id: "mvp_fullstack_001",
    scenario_title: "비개발 창업자의 PT샵 예약 웹서비스 MVP",
    scenario_description:
      "비개발 창업자가 동네 PT샵 예약 웹서비스 MVP를 만들고 싶어 합니다. 의뢰자는 회원가입, 예약, 관리자 페이지, 결제, 알림 기능이 모두 있으면 좋겠다고 말합니다. 다만 예산과 기간은 제한적이며, 4주 안에 첫 MVP를 만들고 싶어 합니다. 의뢰자는 개발 지식이 많지 않으며, 중간 진행상황과 리스크를 쉽게 이해할 수 있기를 원합니다.",
    target_role: "MVP 제작형 풀스택 개발자",
    estimated_time_minutes: 60,
    started_at: "",
    submitted_at: "",
    self_reported_time_minutes: "",
    answers: workSampleQuestions.map((question) => ({
      ...question,
      answer: "",
      process_note: ""
    }))
  };
}

function createDefaultDraft(): CandidateDraft {
  return {
    candidate_basic_info: {
      name_or_nickname: "",
      email: "",
      current_status: "",
      preferred_work_type: [],
      tech_stack: []
    },
    links: {
      github_url: "",
      portfolio_url: "",
      deployed_service_url: "",
      blog_url: "",
      linkedin_url: ""
    },
    projects: [createProject(0)],
    collaboration_experience: {
      pr_issue_code_review: "",
      role_distribution: "",
      requirement_change_response: "",
      delay_or_error_communication: "",
      non_developer_communication: "",
      collaboration_difficulty_solution: ""
    },
    work_sample_test: createDefaultWorkSampleTest(),
    raw_ai_follow_up_questions: []
  };
}

function normalizeWorkSampleTest(
  savedWorkSampleTest?: Partial<WorkSampleTest>
): WorkSampleTest {
  const defaultTest = createDefaultWorkSampleTest();
  const savedAnswers = Array.isArray(savedWorkSampleTest?.answers)
    ? savedWorkSampleTest.answers
    : [];

  return {
    ...defaultTest,
    ...savedWorkSampleTest,
    scenario_id: savedWorkSampleTest?.scenario_id || defaultTest.scenario_id,
    scenario_title: savedWorkSampleTest?.scenario_title || defaultTest.scenario_title,
    scenario_description:
      savedWorkSampleTest?.scenario_description || defaultTest.scenario_description,
    target_role: savedWorkSampleTest?.target_role || defaultTest.target_role,
    estimated_time_minutes:
      typeof savedWorkSampleTest?.estimated_time_minutes === "number"
        ? savedWorkSampleTest.estimated_time_minutes
        : defaultTest.estimated_time_minutes,
    started_at: savedWorkSampleTest?.started_at || "",
    submitted_at: savedWorkSampleTest?.submitted_at || "",
    self_reported_time_minutes:
      savedWorkSampleTest?.self_reported_time_minutes || "",
    answers: defaultTest.answers.map((defaultAnswer) => {
      const savedAnswer = savedAnswers.find(
        (answer) => answer.question_id === defaultAnswer.question_id
      );

      return {
        ...defaultAnswer,
        answer: savedAnswer?.answer ?? "",
        process_note: savedAnswer?.process_note ?? ""
      };
    })
  };
}

function normalizeDraft(savedDraft: CandidateDraft): CandidateDraft {
  const defaultDraft = createDefaultDraft();

  return {
    ...defaultDraft,
    ...savedDraft,
    candidate_basic_info: {
      ...defaultDraft.candidate_basic_info,
      ...savedDraft.candidate_basic_info
    },
    links: {
      ...defaultDraft.links,
      ...savedDraft.links
    },
    projects:
      Array.isArray(savedDraft.projects) && savedDraft.projects.length > 0
        ? savedDraft.projects
        : defaultDraft.projects,
    collaboration_experience: {
      ...defaultDraft.collaboration_experience,
      ...savedDraft.collaboration_experience
    },
    work_sample_test: normalizeWorkSampleTest(savedDraft.work_sample_test),
    raw_ai_follow_up_questions: Array.isArray(savedDraft.raw_ai_follow_up_questions)
      ? savedDraft.raw_ai_follow_up_questions
      : defaultDraft.raw_ai_follow_up_questions
  };
}

function createDefaultConsent(): ConsentState {
  return {
    privacy_collection_required: false,
    ai_analysis_required: false,
    third_party_matching_optional: false,
    marketing_optional: false,
    consented_at: ""
  };
}

function parseList(value: string) {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function listToText(items: string[]) {
  return items.join(", ");
}

function projectDisplayName(project: Project, index: number) {
  return project.name.trim() || `대표 프로젝트 ${index + 1}`;
}

function serializeQuestion(question: FollowUpQuestion) {
  return `${question.project_name}::${question.category}::${question.question}`;
}

function hasRequiredConsents(consent: ConsentState) {
  return consent.privacy_collection_required && consent.ai_analysis_required;
}

function getConsentTimestamp(consent: ConsentState) {
  return consent.consented_at || new Date().toISOString();
}

function getWorkSampleCompletedAnswerCount(workSampleTest: WorkSampleTest) {
  return workSampleTest.answers.filter((answer) => answer.answer.trim()).length;
}

function hasRequiredWorkSampleAnswers(workSampleTest: WorkSampleTest) {
  return requiredWorkSampleQuestionIds.every((questionId) =>
    workSampleTest.answers.some(
      (answer) => answer.question_id === questionId && answer.answer.trim()
    )
  );
}

function getWorkSampleValidationMessage(workSampleTest: WorkSampleTest) {
  if (hasRequiredWorkSampleAnswers(workSampleTest)) {
    return "";
  }

  return "실무 적합도 분석을 위해 요구사항 이해, MVP 우선순위, 리스크 커뮤니케이션, 인수인계 관련 답변은 필수입니다.";
}

function ensureWorkSampleStarted(draft: CandidateDraft): CandidateDraft {
  if (draft.work_sample_test.started_at) {
    return draft;
  }

  return {
    ...draft,
    work_sample_test: {
      ...draft.work_sample_test,
      started_at: new Date().toISOString()
    }
  };
}

function ensureWorkSampleSubmitted(draft: CandidateDraft): CandidateDraft {
  if (draft.work_sample_test.submitted_at) {
    return draft;
  }

  return {
    ...draft,
    work_sample_test: {
      ...draft.work_sample_test,
      submitted_at: new Date().toISOString()
    }
  };
}

function summarizeWorkSampleAnswer(answer: WorkSampleAnswer) {
  const trimmed = answer.answer.trim();

  if (!trimmed) {
    return "입력 없음";
  }

  return trimmed.length > 140 ? `${trimmed.slice(0, 140).trim()}...` : trimmed;
}

function buildCandidateProfile(draft: CandidateDraft) {
  const aiFollowUpAnswers = draft.projects.flatMap((project, index) =>
    project.ai_follow_up_answers.map((answer) => ({
      project_name: projectDisplayName(project, index),
      category: answer.category,
      question: answer.question,
      answer: answer.answer
    }))
  );

  return {
    candidate_basic_info: draft.candidate_basic_info,
    links: draft.links,
    projects: draft.projects.map((project) => ({
      name: project.name,
      url: project.url,
      github_url: project.github_url,
      project_type: project.project_type,
      purpose: project.purpose,
      role: project.role,
      tech_stack: project.tech_stack,
      implemented_features: project.implemented_features,
      frontend_scope: project.frontend_scope,
      backend_scope: project.backend_scope,
      database_scope: project.database_scope,
      auth_experience: project.auth_experience,
      deployment_experience: project.deployment_experience,
      real_user_or_client: project.real_user_or_client,
      collaboration_people: project.collaboration_people,
      difficulty: project.difficulty,
      solution_process: project.solution_process,
      result: project.result,
      capacity_reason: project.capacity_reason
    })),
    collaboration_experience: draft.collaboration_experience,
    work_sample_test: {
      scenario_id: draft.work_sample_test.scenario_id,
      scenario_title: draft.work_sample_test.scenario_title,
      scenario_description: draft.work_sample_test.scenario_description,
      target_role: draft.work_sample_test.target_role,
      estimated_time_minutes: draft.work_sample_test.estimated_time_minutes,
      started_at: draft.work_sample_test.started_at,
      submitted_at: draft.work_sample_test.submitted_at,
      self_reported_time_minutes: draft.work_sample_test.self_reported_time_minutes,
      answers: draft.work_sample_test.answers.map((answer) => ({
        question_id: answer.question_id,
        question: answer.question,
        answer: answer.answer,
        process_note: answer.process_note
      }))
    },
    ai_follow_up_questions: draft.raw_ai_follow_up_questions,
    ai_follow_up_answers: aiFollowUpAnswers
  };
}

function buildConsentLog(consent: ConsentState): ConsentLog {
  return {
    privacy_collection_required: consent.privacy_collection_required,
    ai_analysis_required: consent.ai_analysis_required,
    third_party_matching_optional: consent.third_party_matching_optional,
    marketing_optional: consent.marketing_optional,
    consent_version: CONSENT_VERSION,
    consented_at: getConsentTimestamp(consent),
    policy_summary: {
      retention_period: "수집일로부터 1년 또는 삭제 요청 시까지",
      purpose: "풀스택 개발자 매칭 서비스 실험 및 후보자 데이터 구조화",
      third_party_provision: "선택 동의한 경우에만 향후 기업 매칭 실험에 활용"
    }
  };
}

function submitCandidateProfile(
  draft: CandidateDraft,
  consent: ConsentState
): SubmitResult {
  return {
    candidate_profile: buildCandidateProfile(draft),
    consent_log: buildConsentLog(consent)
  };
}

function mergeQuestionsIntoProjects(
  draft: CandidateDraft,
  questions: FollowUpQuestion[]
): CandidateDraft {
  return {
    ...draft,
    raw_ai_follow_up_questions: questions,
    projects: draft.projects.map((project, projectIndex) => {
      const displayName = projectDisplayName(project, projectIndex);
      const relatedQuestions = questions.filter(
        (question) => question.project_name === displayName
      );
      const existingByKey = new Map(
        project.ai_follow_up_answers.map((answer) => [
          serializeQuestion(answer),
          answer.answer
        ])
      );

      return {
        ...project,
        ai_follow_up_answers: relatedQuestions.map((question) => ({
          ...question,
          answer: existingByKey.get(serializeQuestion(question)) ?? ""
        }))
      };
    })
  };
}

function classNames(...items: Array<string | false | null | undefined>) {
  return items.filter(Boolean).join(" ");
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  icon?: LucideIcon;
  variant?: "primary" | "secondary" | "ghost" | "danger";
};

function Button({
  children,
  icon: Icon,
  variant = "primary",
  className,
  disabled,
  ...props
}: ButtonProps) {
  const variants = {
    primary:
      "bg-sky-700 text-white hover:bg-sky-800 disabled:bg-slate-300 disabled:text-slate-600",
    secondary:
      "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 disabled:text-slate-400",
    ghost: "text-slate-700 hover:bg-slate-100 disabled:text-slate-400",
    danger:
      "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:text-red-300"
  };

  return (
    <button
      className={classNames(
        "inline-flex min-h-10 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition",
        variants[variant],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {Icon ? <Icon aria-hidden className="h-4 w-4 shrink-0" /> : null}
      <span>{children}</span>
    </button>
  );
}

function Field({
  label,
  children,
  hint,
  required
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
        {required ? <span className="text-red-600"> *</span> : null}
      </span>
      {children}
      {hint ? <span className="mt-2 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={classNames(
        "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-600",
        props.className
      )}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={classNames(
        "min-h-28 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm leading-6 text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:border-sky-600",
        props.className
      )}
    />
  );
}

function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={classNames(
        "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm transition focus:border-sky-600",
        props.className
      )}
    />
  );
}

function SectionTitle({
  eyebrow,
  title,
  description
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-6">
      {eyebrow ? (
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-teal-700">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="text-2xl font-bold text-slate-950 sm:text-3xl">{title}</h1>
      {description ? (
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
    </div>
  );
}

function MultiSelectPills({
  options,
  value,
  onChange
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option);
        return (
          <button
            key={option}
            type="button"
            onClick={() => {
              onChange(
                selected ? value.filter((item) => item !== option) : [...value, option]
              );
            }}
            className={classNames(
              "rounded-md border px-3 py-2 text-sm font-medium transition",
              selected
                ? "border-sky-700 bg-sky-700 text-white"
                : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
            )}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}

function TagList({ items }: { items: string[] }) {
  if (items.length === 0) {
    return <span className="text-sm text-slate-400">입력된 항목 없음</span>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function ConsentCheckbox({
  checked,
  onChange,
  label,
  required
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  required?: boolean;
}) {
  return (
    <label className="flex gap-3 rounded-lg border border-slate-200 bg-white p-4 text-sm font-semibold text-slate-900">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-700"
      />
      <span>
        {label}
        {required ? <span className="text-red-600"> (필수)</span> : null}
      </span>
    </label>
  );
}

export default function CandidateIntakePage() {
  const [draft, setDraft] = useState<CandidateDraft>(() => createDefaultDraft());
  const [consent, setConsent] = useState<ConsentState>(() => createDefaultConsent());
  const [activeStep, setActiveStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [fallbackUsed, setFallbackUsed] = useState(false);
  const [stepError, setStepError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmittingToSupabase, setIsSubmittingToSupabase] = useState(false);
  const [databaseSubmitted, setDatabaseSubmitted] = useState(false);
  const [databaseSubmissionId, setDatabaseSubmissionId] = useState("");
  const [submissionError, setSubmissionError] = useState("");

  const candidateProfile = useMemo(() => buildCandidateProfile(draft), [draft]);
  const consentLog = useMemo(() => buildConsentLog(consent), [consent]);
  const candidateJsonPreview = useMemo(
    () => JSON.stringify(candidateProfile, null, 2),
    [candidateProfile]
  );
  const consentJsonPreview = useMemo(
    () => JSON.stringify(consentLog, null, 2),
    [consentLog]
  );

  useEffect(() => {
    let restoredState: StoredState | null = null;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        restoredState = JSON.parse(saved) as StoredState;
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    const timeout = window.setTimeout(() => {
      if (restoredState?.draft && restoredState?.consent) {
        const restoredDraft = normalizeDraft(restoredState.draft);
        setDraft(
          restoredState.activeStep === WORK_SAMPLE_STEP_INDEX
            ? ensureWorkSampleStarted(restoredDraft)
            : restoredDraft
        );
        setConsent(restoredState.consent);
        setSubmitted(Boolean(restoredState.submitted));
        setDatabaseSubmitted(Boolean(restoredState.database_submitted));
        setDatabaseSubmissionId(restoredState.database_submission_id ?? "");
        setActiveStep(Math.min(restoredState.activeStep ?? 0, steps.length - 1));
      }
      setHydrated(true);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    const timeout = window.setTimeout(() => {
      const state: StoredState = {
        activeStep,
        draft,
        consent,
        submitted,
        database_submitted: databaseSubmitted,
        database_submission_id: databaseSubmissionId
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [
    activeStep,
    draft,
    consent,
    submitted,
    databaseSubmitted,
    databaseSubmissionId,
    hydrated
  ]);

  function updateConsent<K extends keyof ConsentState>(
    key: K,
    value: ConsentState[K]
  ) {
    setConsent((current) => {
      const next = {
        ...current,
        [key]: value
      };

      if (hasRequiredConsents(next) && !next.consented_at) {
        next.consented_at = new Date().toISOString();
      }

      return next;
    });
  }

  function updateBasicInfo<K extends keyof CandidateBasicInfo>(
    key: K,
    value: CandidateBasicInfo[K]
  ) {
    setDraft((current) => ({
      ...current,
      candidate_basic_info: {
        ...current.candidate_basic_info,
        [key]: value
      }
    }));
  }

  function updateLinks<K extends keyof CandidateLinks>(key: K, value: CandidateLinks[K]) {
    setDraft((current) => ({
      ...current,
      links: {
        ...current.links,
        [key]: value
      }
    }));
  }

  function updateProject<K extends keyof Project>(
    projectIndex: number,
    key: K,
    value: Project[K]
  ) {
    setDraft((current) => ({
      ...current,
      projects: current.projects.map((project, index) =>
        index === projectIndex ? { ...project, [key]: value } : project
      )
    }));
  }

  function updateCollaboration<K extends keyof CollaborationExperience>(
    key: K,
    value: CollaborationExperience[K]
  ) {
    setDraft((current) => ({
      ...current,
      collaboration_experience: {
        ...current.collaboration_experience,
        [key]: value
      }
    }));
  }

  function updateWorkSampleAnswer(
    questionId: string,
    key: "answer" | "process_note",
    value: string
  ) {
    setDraft((current) => ({
      ...current,
      work_sample_test: {
        ...current.work_sample_test,
        answers: current.work_sample_test.answers.map((answer) =>
          answer.question_id === questionId ? { ...answer, [key]: value } : answer
        )
      }
    }));
  }

  function updateWorkSampleTime(value: string) {
    setDraft((current) => ({
      ...current,
      work_sample_test: {
        ...current.work_sample_test,
        self_reported_time_minutes: value
      }
    }));
  }

  function addProject() {
    setDraft((current) => {
      if (current.projects.length >= 3) {
        return current;
      }

      return {
        ...current,
        projects: [
          ...current.projects,
          {
            ...createProject(current.projects.length),
            id: `project-${Date.now()}`
          }
        ]
      };
    });
  }

  function removeProject(projectIndex: number) {
    setDraft((current) => {
      if (current.projects.length <= 1) {
        return current;
      }

      return {
        ...current,
        projects: current.projects.filter((_, index) => index !== projectIndex)
      };
    });
  }

  function updateFollowUpAnswer(
    projectIndex: number,
    question: FollowUpQuestion,
    answer: string
  ) {
    setDraft((current) => ({
      ...current,
      projects: current.projects.map((project, index) => {
        if (index !== projectIndex) {
          return project;
        }

        const key = serializeQuestion(question);
        const nextAnswers = project.ai_follow_up_answers.some(
          (item) => serializeQuestion(item) === key
        )
          ? project.ai_follow_up_answers.map((item) =>
              serializeQuestion(item) === key ? { ...item, answer } : item
            )
          : [...project.ai_follow_up_answers, { ...question, answer }];

        return {
          ...project,
          ai_follow_up_answers: nextAnswers
        };
      })
    }));
  }

  function getStepValidationMessage(step: number) {
    if (step === 1 && !consent.privacy_collection_required) {
      return "개인정보 수집·이용 필수 동의가 필요합니다.";
    }

    if (step === 2 && !consent.ai_analysis_required) {
      return "후보자 제출자료의 AI 분석 필수 동의가 필요합니다.";
    }

    if (step >= 4 && !hasRequiredConsents(consent)) {
      return "필수 동의 2개가 체크되어야 후보자 입력 단계로 넘어갈 수 있습니다.";
    }

    if (step === 4) {
      if (!draft.candidate_basic_info.name_or_nickname.trim()) {
        return "이름 또는 닉네임을 입력해주세요.";
      }
      if (!draft.candidate_basic_info.email.trim()) {
        return "이메일을 입력해주세요.";
      }
    }

    if (step === 5 && !draft.links.github_url.trim()) {
      return "GitHub URL을 입력해주세요.";
    }

    if (step === 6) {
      if (draft.projects.length < 1) {
        return "대표 프로젝트를 최소 1개 입력해주세요.";
      }
      if (!draft.projects.some((project) => project.name.trim())) {
        return "대표 프로젝트명을 최소 1개 입력해주세요.";
      }
    }

    if (step === WORK_SAMPLE_STEP_INDEX) {
      return getWorkSampleValidationMessage(draft.work_sample_test);
    }

    if (
      step === AI_QUESTIONS_STEP_INDEX &&
      draft.raw_ai_follow_up_questions.length === 0
    ) {
      return "AI 추가 질문을 생성한 뒤 다음 단계로 이동할 수 있습니다.";
    }

    return "";
  }

  function goToStep(targetStep: number) {
    setStepError("");

    if (targetStep >= 4 && !hasRequiredConsents(consent)) {
      setStepError("필수 동의 2개가 체크되어야 후보자 입력 단계로 넘어갈 수 있습니다.");
      setActiveStep(consent.privacy_collection_required ? 2 : 1);
      return;
    }

    if (targetStep > WORK_SAMPLE_STEP_INDEX) {
      const workSampleValidation = getWorkSampleValidationMessage(
        draft.work_sample_test
      );

      if (workSampleValidation) {
        setStepError(workSampleValidation);
        setDraft((current) => ensureWorkSampleStarted(current));
        setActiveStep(WORK_SAMPLE_STEP_INDEX);
        return;
      }
    }

    if (targetStep === WORK_SAMPLE_STEP_INDEX) {
      setDraft((current) => ensureWorkSampleStarted(current));
    }

    if (activeStep === WORK_SAMPLE_STEP_INDEX && targetStep > activeStep) {
      setDraft((current) => ensureWorkSampleSubmitted(current));
    }

    setActiveStep(Math.max(0, Math.min(targetStep, steps.length - 1)));
  }

  function goNext() {
    const message = getStepValidationMessage(activeStep);
    if (message) {
      setStepError(message);
      return;
    }
    setStepError("");
    goToStep(activeStep + 1);
  }

  async function generateFollowUps() {
    const projectValidation = getStepValidationMessage(6);
    const workSampleValidation = getStepValidationMessage(WORK_SAMPLE_STEP_INDEX);
    if (projectValidation) {
      setGenerationError(projectValidation);
      return;
    }
    if (workSampleValidation) {
      setGenerationError(workSampleValidation);
      return;
    }

    setIsGenerating(true);
    setGenerationError("");
    setFallbackUsed(false);

    try {
      const response = await fetch("/api/generate-followups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          candidate_basic_info: draft.candidate_basic_info,
          tech_stack: draft.candidate_basic_info.tech_stack,
          preferred_work_type: draft.candidate_basic_info.preferred_work_type,
          collaboration_experience: draft.collaboration_experience,
          projects: draft.projects.map((project, index) => ({
            ...project,
            name: projectDisplayName(project, index)
          }))
        })
      });

      const data = (await response.json()) as {
        follow_up_questions?: FollowUpQuestion[];
        fallback_used?: boolean;
        error?: string;
      };

      if (!response.ok || !Array.isArray(data.follow_up_questions)) {
        throw new Error(data.error || "추가 질문을 생성하지 못했습니다.");
      }

      const questions = data.follow_up_questions.map((question) => ({
        project_name: question.project_name,
        category: question.category,
        question: question.question
      }));

      setDraft((current) => mergeQuestionsIntoProjects(current, questions));
      setFallbackUsed(Boolean(data.fallback_used));
      setStepError("");
      setActiveStep(AI_ANSWERS_STEP_INDEX);
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "추가 질문 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function downloadJson(filename: string, content: string) {
    const blob = new Blob([content], {
      type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function submitToSupabase(
    nextConsent: ConsentState,
    nextDraft: CandidateDraft = draft
  ) {
    setIsSubmittingToSupabase(true);
    setSubmissionError("");

    try {
      const payload = submitCandidateProfile(nextDraft, nextConsent);
      const response = await fetch("/api/submit-candidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      const data = (await response.json()) as {
        success?: boolean;
        id?: string | number;
        error?: string;
        detail?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(
          data.detail
            ? `${data.error || "후보자 제출 정보를 저장하지 못했습니다."} ${data.detail}`
            : data.error || "후보자 제출 정보를 저장하지 못했습니다."
        );
      }

      setDatabaseSubmitted(true);
      setDatabaseSubmissionId(data.id ? String(data.id) : "");
      setSubmissionError("");
    } catch (error) {
      setDatabaseSubmitted(false);
      setSubmissionError(
        error instanceof Error
          ? error.message
          : "후보자 제출 정보를 저장하는 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmittingToSupabase(false);
    }
  }

  async function handleSubmit() {
    const basicValidation = getStepValidationMessage(4);
    const linkValidation = getStepValidationMessage(5);
    const projectValidation = getStepValidationMessage(6);
    const workSampleValidation = getStepValidationMessage(WORK_SAMPLE_STEP_INDEX);
    const consentValidation = !hasRequiredConsents(consent)
      ? "필수 동의 2개가 체크되어야 제출할 수 있습니다."
      : "";
    const message =
      consentValidation ||
      basicValidation ||
      linkValidation ||
      projectValidation ||
      workSampleValidation;

    if (message) {
      setStepError(message);
      return;
    }

    const nextDraft = ensureWorkSampleSubmitted(draft);
    const nextConsent = {
      ...consent,
      consented_at: getConsentTimestamp(consent)
    };
    setDraft(nextDraft);
    setConsent(nextConsent);
    setSubmitted(true);
    setStepError("");
    setActiveStep(EXPORT_STEP_INDEX);
    await submitToSupabase(nextConsent, nextDraft);
  }

  const progressPercent = Math.round(((activeStep + 1) / steps.length) * 100);
  const canGoNext = activeStep < steps.length - 1;

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-800">Workerate Experiment</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
              풀스택 개발자 후보자 데이터 수집 및 개인정보 동의 폼
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <Save aria-hidden className="h-4 w-4 text-teal-700" />
            {hydrated ? "localStorage 자동 저장 중" : "저장 상태 확인 중"}
          </div>
        </header>

        <nav aria-label="입력 진행률" className="mb-6">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-semibold text-slate-700">
              {activeStep + 1} / {steps.length}단계
            </span>
            <span className="font-semibold text-sky-800">{progressPercent}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-sky-700 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const selected = index === activeStep;
              const completed = index < activeStep;
              const locked = index >= 4 && !hasRequiredConsents(consent);
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => goToStep(index)}
                  className={classNames(
                    "flex min-h-12 items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-semibold transition",
                    selected
                      ? "border-sky-700 bg-sky-50 text-sky-900"
                      : completed
                        ? "border-teal-200 bg-teal-50 text-teal-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                    locked && "opacity-60"
                  )}
                >
                  <Icon aria-hidden className="h-4 w-4 shrink-0" />
                  <span className="truncate">{step.title}</span>
                </button>
              );
            })}
          </div>
        </nav>

        {stepError ? (
          <div className="mb-4 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            <p>{stepError}</p>
          </div>
        ) : null}

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
          {activeStep === 0 ? <LandingStep onStart={() => goToStep(1)} /> : null}

          {activeStep === 1 ? (
            <PrivacyConsentStep
              checked={consent.privacy_collection_required}
              onChange={(checked) => updateConsent("privacy_collection_required", checked)}
            />
          ) : null}

          {activeStep === 2 ? (
            <AiConsentStep
              checked={consent.ai_analysis_required}
              onChange={(checked) => updateConsent("ai_analysis_required", checked)}
            />
          ) : null}

          {activeStep === 3 ? (
            <OptionalConsentStep consent={consent} updateConsent={updateConsent} />
          ) : null}

          {activeStep === 4 ? (
            <BasicInfoStep draft={draft} updateBasicInfo={updateBasicInfo} />
          ) : null}

          {activeStep === 5 ? (
            <LinksStep links={draft.links} updateLinks={updateLinks} />
          ) : null}

          {activeStep === 6 ? (
            <ProjectsStep
              projects={draft.projects}
              addProject={addProject}
              removeProject={removeProject}
              updateProject={updateProject}
            />
          ) : null}

          {activeStep === 7 ? (
            <CollaborationStep
              collaboration={draft.collaboration_experience}
              updateCollaboration={updateCollaboration}
            />
          ) : null}

          {activeStep === WORK_SAMPLE_STEP_INDEX ? (
            <WorkSampleStep
              workSampleTest={draft.work_sample_test}
              updateWorkSampleAnswer={updateWorkSampleAnswer}
              updateWorkSampleTime={updateWorkSampleTime}
            />
          ) : null}

          {activeStep === AI_QUESTIONS_STEP_INDEX ? (
            <GenerateQuestionsStep
              draft={draft}
              isGenerating={isGenerating}
              generationError={generationError}
              fallbackUsed={fallbackUsed}
              generateFollowUps={generateFollowUps}
            />
          ) : null}

          {activeStep === AI_ANSWERS_STEP_INDEX ? (
            <AnswerQuestionsStep
              draft={draft}
              updateFollowUpAnswer={updateFollowUpAnswer}
            />
          ) : null}

          {activeStep === REVIEW_STEP_INDEX ? (
            <ReviewStep
              draft={draft}
              consent={consent}
              handleSubmit={handleSubmit}
              isSubmittingToSupabase={isSubmittingToSupabase}
            />
          ) : null}

          {activeStep === EXPORT_STEP_INDEX ? (
            <ExportStep
              submitted={submitted}
              databaseSubmitted={databaseSubmitted}
              databaseSubmissionId={databaseSubmissionId}
              submissionError={submissionError}
              isSubmittingToSupabase={isSubmittingToSupabase}
              candidateJsonPreview={candidateJsonPreview}
              consentJsonPreview={consentJsonPreview}
              submitToSupabase={handleSubmit}
              downloadCandidate={() =>
                downloadJson("candidate_profile.json", candidateJsonPreview)
              }
              downloadConsent={() => downloadJson("consent_log.json", consentJsonPreview)}
            />
          ) : null}
        </section>

        <footer className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-slate-500">{DELETE_REQUEST_TEXT}</p>
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            {activeStep > 0 ? (
              <Button
                type="button"
                variant="secondary"
                icon={ArrowLeft}
                onClick={() => goToStep(activeStep - 1)}
              >
                이전
              </Button>
            ) : null}
            {activeStep === REVIEW_STEP_INDEX ? (
              <Button
                type="button"
                icon={isSubmittingToSupabase ? Loader2 : Send}
                onClick={handleSubmit}
                disabled={isSubmittingToSupabase}
              >
                {isSubmittingToSupabase ? "제출 중" : "제출하기"}
              </Button>
            ) : (
              <Button
                type="button"
                icon={ArrowRight}
                disabled={!canGoNext}
                onClick={goNext}
              >
                다음
              </Button>
            )}
          </div>
        </footer>
      </div>
    </main>
  );
}

function LandingStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:items-start">
      <div>
        <SectionTitle
          eyebrow="Community Intake"
          title="풀스택 개발자 매칭 서비스 실험 참여자 모집"
          description="Workerate는 풀스택 개발자의 GitHub, 포트폴리오, 프로젝트 경험을 바탕으로 기업의 업무조건과 후보자의 실제 업무 경험을 더 정확히 연결하는 매칭 시스템을 실험하고 있습니다."
        />
        <div className="space-y-4 text-sm leading-6 text-slate-700">
          <p>
            현재 단계에서는 채용 여부를 결정하지 않습니다. 입력된 정보는 후보자의
            개발 경험을 구조화하고, 향후 업무적합도 분석 모델을 개선하기 위한
            목적으로만 사용됩니다.
          </p>
          <p className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900">
            본 폼은 자발적 참여 기반입니다. 제출 전 개인정보 수집·이용 및 AI 분석
            동의를 확인해주세요.
          </p>
        </div>
        <div className="mt-6">
          <h2 className="text-base font-bold text-slate-950">참여 대상</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              "풀스택 개발자",
              "프론트엔드와 백엔드를 모두 다뤄본 개발자",
              "GitHub 또는 포트폴리오가 있는 개발자",
              "MVP 제작, SaaS 개발, 웹서비스 개발 경험이 있는 개발자",
              "프리랜서 또는 외주 프로젝트 경험이 있는 개발자"
            ].map((item) => (
              <div key={item} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-800">{item}</p>
              </div>
            ))}
          </div>
        </div>
        <Button type="button" icon={ArrowRight} className="mt-6" onClick={onStart}>
          동의 확인하고 시작하기
        </Button>
      </div>
      <div className="rounded-lg border border-sky-100 bg-sky-50 p-5">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-sky-800 shadow-sm">
          <FileJson aria-hidden className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-sky-950">생성되는 JSON</p>
        <div className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
          <p>candidate_profile: 후보자가 직접 제출한 경험 데이터</p>
          <p>consent_log: 필수/선택 동의 기록</p>
          <p className="text-xs text-slate-500">
            현재 DB 저장은 하지 않으며 localStorage와 JSON Export만 사용합니다.
          </p>
        </div>
      </div>
    </div>
  );
}

function PrivacyConsentStep({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div>
      <SectionTitle
        title="[필수] 개인정보 수집·이용 동의"
        description="Workerate는 풀스택 개발자 매칭 서비스 실험을 위해 아래와 같이 개인정보를 수집·이용합니다."
      />
      <ConsentTextGrid
        sections={[
          {
            title: "수집·이용 목적",
            items: [
              "풀스택 개발자 후보자 데이터 수집",
              "후보자의 프로젝트 경험 및 기술역량 구조화",
              "업무적합도 분석 및 매칭 시스템 실험",
              "후보자 입력자료 기반 AI 추가 질문 생성",
              "서비스 개선을 위한 비식별 통계 분석"
            ]
          },
          {
            title: "필수 항목",
            items: [
              "이름 또는 닉네임",
              "이메일",
              "GitHub URL",
              "주요 기술스택",
              "희망 업무 유형",
              "대표 프로젝트 설명",
              "프로젝트별 본인 역할",
              "구현 기능",
              "문제 해결 경험",
              "배포 경험",
              "협업 경험"
            ]
          },
          {
            title: "선택 항목",
            items: [
              "포트폴리오 URL",
              "배포 서비스 URL",
              "블로그 또는 LinkedIn URL",
              "프리랜서/외주 경험",
              "프로젝트 성과 또는 사용자 피드백"
            ]
          },
          {
            title: "수집하지 않는 항목",
            items: [
              "나이",
              "성별",
              "얼굴 사진",
              "주소",
              "출신지역",
              "결혼 여부",
              "가족관계",
              "건강정보",
              "종교",
              "정치성향",
              "장애 여부",
              "기타 직무와 무관한 민감정보"
            ]
          }
        ]}
      />
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <InfoPanel
          title="보유 및 이용 기간"
          text="수집일로부터 1년까지 보유하며, 참여자가 삭제를 요청할 경우 지체 없이 삭제합니다. 서비스 정식 출시 전 별도 동의를 받지 않는 한 기업 제공에는 사용하지 않습니다."
        />
        <InfoPanel
          title="동의 거부권"
          text="개인정보 수집·이용 동의를 거부할 수 있습니다. 다만 필수 항목 수집에 동의하지 않을 경우 본 실험 참여 및 데이터 분석이 제한될 수 있습니다."
        />
      </div>
      <div className="mt-6">
        <ConsentCheckbox
          checked={checked}
          onChange={onChange}
          label="위 개인정보 수집·이용에 동의합니다."
          required
        />
      </div>
    </div>
  );
}

function AiConsentStep({
  checked,
  onChange
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div>
      <SectionTitle
        title="[필수] 후보자 제출자료의 AI 분석 동의"
        description="Workerate는 후보자가 제출한 GitHub URL, 프로젝트 설명, 포트폴리오 정보, 기술스택, 문제 해결 경험, 협업 경험을 AI로 분석하여 구조화된 후보자 프로필을 생성합니다."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <ConsentTextGrid
          sections={[
            {
              title: "AI 분석 목적",
              items: [
                "프로젝트 경험에서 확인 가능한 기술역량 정리",
                "풀스택 개발 범위 확인",
                "문제 해결 과정 구조화",
                "협업 및 커뮤니케이션 경험 정리",
                "추가 확인이 필요한 항목 도출",
                "업무적합도 분석 모델 개선"
              ]
            }
          ]}
          compact
        />
        <ConsentTextGrid
          sections={[
            {
              title: "AI가 하지 않는 것",
              items: [
                "채용 여부 결정",
                "사람 자체에 대한 단정",
                "성격 추정",
                "민감정보 추론",
                "나이, 성별, 외모, 출신지역 등 차별 가능 정보 기반 분석",
                "후보자 몰래 기업에 정보 제공"
              ]
            }
          ]}
          compact
        />
      </div>
      <p className="mt-5 rounded-lg border border-sky-100 bg-sky-50 p-4 text-sm leading-6 text-sky-950">
        AI 분석 결과는 실험 및 서비스 개선 목적으로 사용됩니다. 추후 기업 매칭에
        활용할 경우 별도의 동의를 다시 받습니다.
      </p>
      <div className="mt-6">
        <ConsentCheckbox
          checked={checked}
          onChange={onChange}
          label="후보자 제출자료의 AI 분석에 동의합니다."
          required
        />
      </div>
    </div>
  );
}

function OptionalConsentStep({
  consent,
  updateConsent
}: {
  consent: ConsentState;
  updateConsent: <K extends keyof ConsentState>(key: K, value: ConsentState[K]) => void;
}) {
  return (
    <div>
      <SectionTitle
        title="선택 동의"
        description="아래 항목은 선택입니다. 선택하지 않아도 데이터 수집 실험 참여는 가능합니다."
      />
      <div className="space-y-5">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-bold text-slate-950">
            [선택] 기업 매칭 활용 및 제3자 제공 동의
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            현재 단계에서는 입력된 정보를 기업에 제공하지 않습니다. 향후 실제 매칭
            실험을 진행할 경우, 후보자가 별도로 동의한 경우에만 기업에게 제한된
            후보자 프로필이 제공될 수 있습니다.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <InfoPanel
              title="제공 가능 항목"
              text="이름 또는 닉네임, 이메일 또는 연락 가능한 수단, GitHub/포트폴리오 URL, 주요 기술스택, 대표 프로젝트 요약, 업무적합도 분석 요약, 추가 확인이 필요한 항목"
            />
            <InfoPanel
              title="제공받는 자와 목적"
              text="향후 Workerate와 매칭 실험에 참여하는 기업 또는 프로젝트 의뢰자에게 프로젝트 매칭, 후보자 검토, 제안 및 연락 목적으로 제공될 수 있습니다."
            />
            <InfoPanel
              title="보유 기간"
              text="매칭 검토 종료 후 6개월 또는 후보자 삭제 요청 시까지입니다."
            />
          </div>
          <div className="mt-4">
            <ConsentCheckbox
              checked={consent.third_party_matching_optional}
              onChange={(checked) =>
                updateConsent("third_party_matching_optional", checked)
              }
              label="향후 실제 매칭 실험 시 기업 제공에 동의합니다."
            />
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-lg font-bold text-slate-950">
            [선택] 후속 실험 및 서비스 소식 수신 동의
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-700">
            Workerate의 후속 테스트, 인터뷰 요청, 베타 서비스 안내를 이메일로 받을
            수 있습니다.
          </p>
          <div className="mt-4">
            <ConsentCheckbox
              checked={consent.marketing_optional}
              onChange={(checked) => updateConsent("marketing_optional", checked)}
              label="후속 실험 및 서비스 안내를 이메일로 받겠습니다."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConsentTextGrid({
  sections,
  compact
}: {
  sections: Array<{ title: string; items: string[] }>;
  compact?: boolean;
}) {
  return (
    <div className={classNames("grid gap-4", compact ? "grid-cols-1" : "md:grid-cols-2")}>
      {sections.map((section) => (
        <div key={section.title} className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <h2 className="text-sm font-bold text-slate-950">{section.title}</h2>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
            {section.items.map((item) => (
              <li key={item}>- {item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function InfoPanel({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-bold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-700">{text}</p>
    </div>
  );
}

function BasicInfoStep({
  draft,
  updateBasicInfo
}: {
  draft: CandidateDraft;
  updateBasicInfo: <K extends keyof CandidateBasicInfo>(
    key: K,
    value: CandidateBasicInfo[K]
  ) => void;
}) {
  return (
    <div>
      <SectionTitle
        title="후보자 기본 정보 입력"
        description="후보자가 직접 제출하는 정보만 수집합니다. 나이, 성별, 외모, 출신지역, 결혼 여부, 가족관계, 건강정보, 종교, 정치성향 등 직무와 무관하거나 민감한 정보는 입력받지 않습니다."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="이름 또는 닉네임" required>
          <TextInput
            value={draft.candidate_basic_info.name_or_nickname}
            onChange={(event) =>
              updateBasicInfo("name_or_nickname", event.target.value)
            }
            placeholder="예: workerate-dev"
          />
        </Field>
        <Field label="이메일" required>
          <TextInput
            type="email"
            value={draft.candidate_basic_info.email}
            onChange={(event) => updateBasicInfo("email", event.target.value)}
            placeholder="name@example.com"
          />
        </Field>
        <Field label="현재 상태">
          <SelectInput
            value={draft.candidate_basic_info.current_status}
            onChange={(event) => updateBasicInfo("current_status", event.target.value)}
          >
            <option value="">선택해주세요</option>
            {currentStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field
          label="주요 기술스택"
          hint={`쉼표 또는 줄바꿈으로 입력하세요. 예: ${techExamples.join(", ")}`}
        >
          <TextArea
            value={listToText(draft.candidate_basic_info.tech_stack)}
            onChange={(event) =>
              updateBasicInfo("tech_stack", parseList(event.target.value))
            }
            placeholder="React, Next.js, TypeScript, Node.js, PostgreSQL"
          />
        </Field>
        <div className="md:col-span-2">
          <Field label="희망 업무 유형" hint="여러 개를 선택할 수 있습니다.">
            <MultiSelectPills
              options={preferredWorkOptions}
              value={draft.candidate_basic_info.preferred_work_type}
              onChange={(next) => updateBasicInfo("preferred_work_type", next)}
            />
          </Field>
        </div>
      </div>
    </div>
  );
}

function LinksStep({
  links,
  updateLinks
}: {
  links: CandidateLinks;
  updateLinks: <K extends keyof CandidateLinks>(key: K, value: CandidateLinks[K]) => void;
}) {
  return (
    <div>
      <SectionTitle
        title="GitHub 및 포트폴리오 링크 입력"
        description="GitHub URL은 필수입니다. 나머지 링크는 후보자가 공개 가능한 항목만 입력합니다."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="GitHub URL" required>
          <TextInput
            value={links.github_url}
            onChange={(event) => updateLinks("github_url", event.target.value)}
            placeholder="https://github.com/username"
          />
        </Field>
        <Field label="포트폴리오 URL">
          <TextInput
            value={links.portfolio_url}
            onChange={(event) => updateLinks("portfolio_url", event.target.value)}
            placeholder="https://portfolio.example.com"
          />
        </Field>
        <Field label="배포된 서비스 URL">
          <TextInput
            value={links.deployed_service_url}
            onChange={(event) => updateLinks("deployed_service_url", event.target.value)}
            placeholder="https://service.example.com"
          />
        </Field>
        <Field label="기술 블로그 URL">
          <TextInput
            value={links.blog_url}
            onChange={(event) => updateLinks("blog_url", event.target.value)}
            placeholder="https://blog.example.com"
          />
        </Field>
        <Field label="LinkedIn URL">
          <TextInput
            value={links.linkedin_url}
            onChange={(event) => updateLinks("linkedin_url", event.target.value)}
            placeholder="https://linkedin.com/in/..."
          />
        </Field>
      </div>
    </div>
  );
}

function ProjectsStep({
  projects,
  addProject,
  removeProject,
  updateProject
}: {
  projects: Project[];
  addProject: () => void;
  removeProject: (projectIndex: number) => void;
  updateProject: <K extends keyof Project>(
    projectIndex: number,
    key: K,
    value: Project[K]
  ) => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title="대표 프로젝트 입력"
          description="대표 프로젝트는 최소 1개, 최대 3개까지 입력합니다. 분석을 위한 데이터 구조화가 목적이므로 본인의 역할과 구현 범위를 구체적으로 적어주세요."
        />
        <Button
          type="button"
          variant="secondary"
          icon={Plus}
          onClick={addProject}
          disabled={projects.length >= 3}
          className="shrink-0"
        >
          프로젝트 추가
        </Button>
      </div>

      <div className="space-y-6">
        {projects.map((project, projectIndex) => (
          <div
            key={project.id}
            className="rounded-lg border border-slate-200 bg-slate-50 p-4 sm:p-5"
          >
            <div className="mb-5 flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-950">
                대표 프로젝트 {projectIndex + 1}
              </h2>
              <Button
                type="button"
                variant="danger"
                icon={Trash2}
                onClick={() => removeProject(projectIndex)}
                disabled={projects.length <= 1}
              >
                삭제
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="프로젝트명" required>
                <TextInput
                  value={project.name}
                  onChange={(event) =>
                    updateProject(projectIndex, "name", event.target.value)
                  }
                  placeholder="예: 예약 관리 SaaS"
                />
              </Field>
              <Field label="프로젝트 URL">
                <TextInput
                  value={project.url}
                  onChange={(event) =>
                    updateProject(projectIndex, "url", event.target.value)
                  }
                  placeholder="https://..."
                />
              </Field>
              <Field label="GitHub repository URL">
                <TextInput
                  value={project.github_url}
                  onChange={(event) =>
                    updateProject(projectIndex, "github_url", event.target.value)
                  }
                  placeholder="https://github.com/..."
                />
              </Field>
              <Field label="프로젝트 유형">
                <SelectInput
                  value={project.project_type}
                  onChange={(event) =>
                    updateProject(projectIndex, "project_type", event.target.value)
                  }
                >
                  <option value="">선택해주세요</option>
                  {projectTypeOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="프로젝트 목적">
                <TextArea
                  value={project.purpose}
                  onChange={(event) =>
                    updateProject(projectIndex, "purpose", event.target.value)
                  }
                  placeholder="어떤 문제를 해결하기 위해 만든 프로젝트인지 적어주세요."
                />
              </Field>
              <Field label="본인이 맡은 역할">
                <TextArea
                  value={project.role}
                  onChange={(event) =>
                    updateProject(projectIndex, "role", event.target.value)
                  }
                  placeholder="기획, 프론트엔드, API, DB, 배포 등 담당 범위를 적어주세요."
                />
              </Field>
              <Field label="사용 기술스택">
                <TextArea
                  value={listToText(project.tech_stack)}
                  onChange={(event) =>
                    updateProject(projectIndex, "tech_stack", parseList(event.target.value))
                  }
                  placeholder="Next.js, NestJS, PostgreSQL, AWS"
                />
              </Field>
              <Field label="구현한 핵심 기능">
                <TextArea
                  value={listToText(project.implemented_features)}
                  onChange={(event) =>
                    updateProject(
                      projectIndex,
                      "implemented_features",
                      parseList(event.target.value)
                    )
                  }
                  placeholder="회원가입, 결제, 예약 캘린더, 관리자 대시보드"
                />
              </Field>
              <Field label="프론트엔드 담당 범위">
                <TextArea
                  value={project.frontend_scope}
                  onChange={(event) =>
                    updateProject(projectIndex, "frontend_scope", event.target.value)
                  }
                />
              </Field>
              <Field label="백엔드/API 담당 범위">
                <TextArea
                  value={project.backend_scope}
                  onChange={(event) =>
                    updateProject(projectIndex, "backend_scope", event.target.value)
                  }
                />
              </Field>
              <Field label="DB 설계 또는 연동 경험">
                <TextArea
                  value={project.database_scope}
                  onChange={(event) =>
                    updateProject(projectIndex, "database_scope", event.target.value)
                  }
                />
              </Field>
              <Field label="인증/권한 구현 경험">
                <TextArea
                  value={project.auth_experience}
                  onChange={(event) =>
                    updateProject(projectIndex, "auth_experience", event.target.value)
                  }
                  placeholder="예: JWT, OAuth, Supabase Auth, 관리자 권한"
                />
              </Field>
              <Field label="배포/운영 경험">
                <TextArea
                  value={project.deployment_experience}
                  onChange={(event) =>
                    updateProject(
                      projectIndex,
                      "deployment_experience",
                      event.target.value
                    )
                  }
                  placeholder="예: Vercel, AWS, Docker, 환경 변수, 도메인 연결"
                />
              </Field>
              <Field label="실제 사용자 또는 고객 여부">
                <TextArea
                  value={project.real_user_or_client}
                  onChange={(event) =>
                    updateProject(projectIndex, "real_user_or_client", event.target.value)
                  }
                  placeholder="예: 지인 테스트, 실제 고객, 내부 운영자, 개인 학습"
                />
              </Field>
              <Field label="협업 인원">
                <TextInput
                  value={project.collaboration_people}
                  onChange={(event) =>
                    updateProject(
                      projectIndex,
                      "collaboration_people",
                      event.target.value
                    )
                  }
                  placeholder="예: 1명, 3명, 디자이너 1명 + 개발자 2명"
                />
              </Field>
              <Field label="결과 또는 성과">
                <TextArea
                  value={project.result}
                  onChange={(event) =>
                    updateProject(projectIndex, "result", event.target.value)
                  }
                  placeholder="완성도, 사용자 반응, 운영 여부, 배운 점 등을 적어주세요."
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="가장 어려웠던 문제">
                  <TextArea
                    value={project.difficulty}
                    onChange={(event) =>
                      updateProject(projectIndex, "difficulty", event.target.value)
                    }
                    placeholder="기술적 문제, 요구사항 변경, 협업 이슈 등 구체적으로 적어주세요."
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="문제 해결 과정">
                  <TextArea
                    value={project.solution_process}
                    onChange={(event) =>
                      updateProject(projectIndex, "solution_process", event.target.value)
                    }
                    placeholder="원인 파악, 시도한 방법, 선택한 해결책, 결과를 순서대로 적어주세요."
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Field label="이 프로젝트가 본인의 역량을 보여준다고 생각하는 이유">
                  <TextArea
                    value={project.capacity_reason}
                    onChange={(event) =>
                      updateProject(projectIndex, "capacity_reason", event.target.value)
                    }
                    placeholder="본인의 기술적 판단, 구현 범위, 문제 해결 방식이 드러나는 지점을 적어주세요."
                  />
                </Field>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CollaborationStep({
  collaboration,
  updateCollaboration
}: {
  collaboration: CollaborationExperience;
  updateCollaboration: <K extends keyof CollaborationExperience>(
    key: K,
    value: CollaborationExperience[K]
  ) => void;
}) {
  return (
    <div>
      <SectionTitle
        title="협업 경험 입력"
        description="협업 방식과 커뮤니케이션 경험을 구조화합니다. 사람 자체에 대한 평가는 하지 않습니다."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="PR/이슈/코드리뷰 경험 여부">
          <TextArea
            value={collaboration.pr_issue_code_review}
            onChange={(event) =>
              updateCollaboration("pr_issue_code_review", event.target.value)
            }
          />
        </Field>
        <Field label="팀원과 역할을 나눈 경험">
          <TextArea
            value={collaboration.role_distribution}
            onChange={(event) =>
              updateCollaboration("role_distribution", event.target.value)
            }
          />
        </Field>
        <Field label="요구사항이 바뀌었을 때 대응한 경험">
          <TextArea
            value={collaboration.requirement_change_response}
            onChange={(event) =>
              updateCollaboration("requirement_change_response", event.target.value)
            }
          />
        </Field>
        <Field label="일정 지연 또는 오류 발생 시 공유한 경험">
          <TextArea
            value={collaboration.delay_or_error_communication}
            onChange={(event) =>
              updateCollaboration("delay_or_error_communication", event.target.value)
            }
          />
        </Field>
        <Field label="비개발자와 소통한 경험">
          <TextArea
            value={collaboration.non_developer_communication}
            onChange={(event) =>
              updateCollaboration("non_developer_communication", event.target.value)
            }
          />
        </Field>
        <Field label="협업에서 어려웠던 점과 해결 방식">
          <TextArea
            value={collaboration.collaboration_difficulty_solution}
            onChange={(event) =>
              updateCollaboration(
                "collaboration_difficulty_solution",
                event.target.value
              )
            }
          />
        </Field>
      </div>
    </div>
  );
}

function WorkSampleStep({
  workSampleTest,
  updateWorkSampleAnswer,
  updateWorkSampleTime
}: {
  workSampleTest: WorkSampleTest;
  updateWorkSampleAnswer: (
    questionId: string,
    key: "answer" | "process_note",
    value: string
  ) => void;
  updateWorkSampleTime: (value: string) => void;
}) {
  return (
    <div>
      <SectionTitle
        title="실무 시나리오 테스트"
        description="이 테스트는 정답을 맞히는 시험이 아니라, 실제 업무상황에서 요구사항을 이해하고, 우선순위를 정하고, 리스크를 설명하는 과정을 확인하기 위한 자료입니다."
      />

      <div className="rounded-lg border border-sky-100 bg-sky-50 p-5">
        <div className="grid gap-4 md:grid-cols-3">
          <SummaryRow label="시나리오 제목" value={workSampleTest.scenario_title} />
          <SummaryRow label="대상 역할" value={workSampleTest.target_role} />
          <SummaryRow
            label="예상 소요 시간"
            value={`${workSampleTest.estimated_time_minutes}분`}
          />
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-sky-950">
          {workSampleTest.scenario_description}
        </p>
      </div>

      <div className="mt-6 space-y-5">
        {workSampleTest.answers.map((answer, index) => {
          const required = requiredWorkSampleQuestionIds.includes(answer.question_id);

          return (
            <div
              key={answer.question_id}
              className="rounded-lg border border-slate-200 bg-white p-4"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-teal-700">
                    질문 {index + 1}
                    {required ? " · 필수" : " · 선택"}
                  </p>
                  <h2 className="mt-2 text-base font-bold leading-7 text-slate-950">
                    {answer.question}
                  </h2>
                </div>
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Field label="답변" required={required}>
                  <TextArea
                    value={answer.answer}
                    onChange={(event) =>
                      updateWorkSampleAnswer(
                        answer.question_id,
                        "answer",
                        event.target.value
                      )
                    }
                    className="min-h-40"
                    placeholder="어떤 기준으로 판단했는지, 의뢰자에게 어떻게 설명할지 구체적으로 작성해주세요."
                  />
                </Field>
                <Field label="생각한 과정 / 판단 기준">
                  <TextArea
                    value={answer.process_note}
                    onChange={(event) =>
                      updateWorkSampleAnswer(
                        answer.question_id,
                        "process_note",
                        event.target.value
                      )
                    }
                    className="min-h-40"
                    placeholder="이 답변을 작성할 때 어떤 순서로 생각했는지, 무엇을 중요하게 봤는지 적어주세요."
                  />
                </Field>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 max-w-sm">
        <Field label="실제 작성에 걸린 시간">
          <TextInput
            value={workSampleTest.self_reported_time_minutes}
            onChange={(event) => updateWorkSampleTime(event.target.value)}
            placeholder="예: 45분"
          />
        </Field>
      </div>
    </div>
  );
}

function GenerateQuestionsStep({
  draft,
  isGenerating,
  generationError,
  fallbackUsed,
  generateFollowUps
}: {
  draft: CandidateDraft;
  isGenerating: boolean;
  generationError: string;
  fallbackUsed: boolean;
  generateFollowUps: () => void;
}) {
  return (
    <div>
      <SectionTitle
        title="AI 추가 질문 생성"
        description="기본 정보와 프로젝트 데이터를 입력한 뒤 기존 /api/generate-followups를 사용해 부족한 정보를 확인합니다."
      />
      <div className="grid gap-4 md:grid-cols-3">
        {draft.projects.map((project, index) => (
          <div key={project.id} className="rounded-lg border border-slate-200 p-4">
            <p className="font-bold text-slate-950">{projectDisplayName(project, index)}</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {project.purpose || "프로젝트 목적이 아직 비어 있습니다."}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-lg border border-sky-100 bg-sky-50 p-4">
        <p className="text-sm leading-6 text-sky-950">
          추가 질문은 본인 기여도 명확화, 실제 풀스택 범위 확인, 문제 해결 과정
          확인, 배포/운영 경험 확인, 협업 경험 확인, 요구사항 이해와 커뮤니케이션
          확인 범주를 포함합니다.
        </p>
      </div>
      {generationError ? (
        <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {generationError}
        </p>
      ) : null}
      {fallbackUsed ? (
        <p className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          OpenAI API 키가 없어 테스트용 기본 질문을 사용했습니다. `.env.local`에
          `OPENAI_API_KEY`를 설정하면 API 질문 생성으로 전환됩니다.
        </p>
      ) : null}
      <Button
        type="button"
        icon={isGenerating ? Loader2 : Sparkles}
        disabled={isGenerating}
        onClick={generateFollowUps}
        className="mt-6"
      >
        {isGenerating ? "질문 생성 중" : "부족한 정보 확인하기"}
      </Button>
    </div>
  );
}

function AnswerQuestionsStep({
  draft,
  updateFollowUpAnswer
}: {
  draft: CandidateDraft;
  updateFollowUpAnswer: (
    projectIndex: number,
    question: FollowUpQuestion,
    answer: string
  ) => void;
}) {
  return (
    <div>
      <SectionTitle
        title="AI 추가 질문 답변"
        description="각 질문 아래에 후보자의 답변을 입력합니다. 답변은 최종 candidate_profile JSON에 포함됩니다."
      />
      {draft.raw_ai_follow_up_questions.length === 0 ? (
        <p className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          생성된 추가 질문이 없습니다. 이전 단계에서 질문을 먼저 생성해주세요.
        </p>
      ) : (
        <div className="space-y-6">
          {draft.projects.map((project, projectIndex) => {
            const displayName = projectDisplayName(project, projectIndex);
            const questions = draft.raw_ai_follow_up_questions.filter(
              (question) => question.project_name === displayName
            );

            return (
              <div key={project.id} className="rounded-lg border border-slate-200 p-4">
                <h2 className="text-lg font-bold text-slate-950">{displayName}</h2>
                <div className="mt-4 space-y-4">
                  {questions.map((question) => {
                    const answer =
                      project.ai_follow_up_answers.find(
                        (item) => serializeQuestion(item) === serializeQuestion(question)
                      )?.answer ?? "";

                    return (
                      <Field
                        key={serializeQuestion(question)}
                        label={`${question.category} · ${question.question}`}
                      >
                        <TextArea
                          value={answer}
                          onChange={(event) =>
                            updateFollowUpAnswer(
                              projectIndex,
                              question,
                              event.target.value
                            )
                          }
                          placeholder="답변을 입력해주세요."
                        />
                      </Field>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ReviewStep({
  draft,
  consent,
  handleSubmit,
  isSubmittingToSupabase
}: {
  draft: CandidateDraft;
  consent: ConsentState;
  handleSubmit: () => void | Promise<void>;
  isSubmittingToSupabase: boolean;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title="최종 제출 전 확인"
          description="수집된 데이터와 동의 상태를 확인합니다. 제출 시 candidate_profile과 consent_log가 생성되고, 설정된 경우 Supabase에 저장됩니다."
        />
        <Button
          type="button"
          icon={isSubmittingToSupabase ? Loader2 : Send}
          onClick={handleSubmit}
          disabled={isSubmittingToSupabase}
          className="shrink-0"
        >
          {isSubmittingToSupabase ? "제출 중" : "제출하기"}
        </Button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <SummaryBlock title="동의 상태">
          <SummaryRow
            label="개인정보 수집·이용 필수 동의"
            value={consent.privacy_collection_required ? "동의" : "미동의"}
          />
          <SummaryRow
            label="AI 분석 필수 동의"
            value={consent.ai_analysis_required ? "동의" : "미동의"}
          />
          <SummaryRow
            label="기업 매칭 활용 및 제3자 제공 선택 동의"
            value={consent.third_party_matching_optional ? "동의" : "미동의"}
          />
          <SummaryRow
            label="후속 실험 및 서비스 안내 수신 선택 동의"
            value={consent.marketing_optional ? "동의" : "미동의"}
          />
        </SummaryBlock>

        <SummaryBlock title="기본 정보">
          <SummaryRow
            label="이름 또는 닉네임"
            value={draft.candidate_basic_info.name_or_nickname}
          />
          <SummaryRow label="이메일" value={draft.candidate_basic_info.email} />
          <SummaryRow
            label="현재 상태"
            value={draft.candidate_basic_info.current_status}
          />
          <SummaryRow
            label="희망 업무 유형"
            value={draft.candidate_basic_info.preferred_work_type.join(", ")}
          />
        </SummaryBlock>

        <SummaryBlock title="주요 기술스택">
          <TagList items={draft.candidate_basic_info.tech_stack} />
        </SummaryBlock>

        <SummaryBlock title="링크">
          <SummaryRow label="GitHub" value={draft.links.github_url} />
          <SummaryRow label="포트폴리오" value={draft.links.portfolio_url} />
          <SummaryRow label="배포 서비스" value={draft.links.deployed_service_url} />
          <SummaryRow label="기술 블로그" value={draft.links.blog_url} />
          <SummaryRow label="LinkedIn" value={draft.links.linkedin_url} />
        </SummaryBlock>
      </div>

      <div className="mt-6 space-y-5">
        {draft.projects.map((project, index) => (
          <div key={project.id} className="rounded-lg border border-slate-200 p-4">
            <h2 className="text-lg font-bold text-slate-950">
              {projectDisplayName(project, index)}
            </h2>
            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              <SummaryBlock title="대표 프로젝트">
                <SummaryRow label="유형" value={project.project_type} />
                <SummaryRow label="목적" value={project.purpose} />
                <SummaryRow label="역할" value={project.role} />
                <SummaryRow label="실제 사용자/고객" value={project.real_user_or_client} />
                <SummaryRow label="성과" value={project.result} />
              </SummaryBlock>
              <SummaryBlock title="풀스택 경험 범위">
                <SummaryRow label="프론트엔드" value={project.frontend_scope} />
                <SummaryRow label="백엔드/API" value={project.backend_scope} />
                <SummaryRow label="DB" value={project.database_scope} />
                <SummaryRow label="인증/권한" value={project.auth_experience} />
                <SummaryRow label="배포/운영" value={project.deployment_experience} />
              </SummaryBlock>
              <SummaryBlock title="문제 해결 사례">
                <SummaryRow label="어려웠던 문제" value={project.difficulty} />
                <SummaryRow label="해결 과정" value={project.solution_process} />
                <SummaryRow label="역량을 보여주는 이유" value={project.capacity_reason} />
              </SummaryBlock>
              <SummaryBlock title="AI 추가 질문 답변">
                <SummaryRow
                  label="답변 수"
                  value={`${project.ai_follow_up_answers.filter((answer) => answer.answer.trim()).length}개`}
                />
              </SummaryBlock>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <SummaryBlock title="협업 경험">
          <SummaryRow
            label="PR/이슈/코드리뷰"
            value={draft.collaboration_experience.pr_issue_code_review}
          />
          <SummaryRow
            label="역할 분담"
            value={draft.collaboration_experience.role_distribution}
          />
          <SummaryRow
            label="요구사항 변경 대응"
            value={draft.collaboration_experience.requirement_change_response}
          />
          <SummaryRow
            label="일정 지연/오류 공유"
            value={draft.collaboration_experience.delay_or_error_communication}
          />
          <SummaryRow
            label="비개발자 소통"
            value={draft.collaboration_experience.non_developer_communication}
          />
          <SummaryRow
            label="협업 어려움과 해결"
            value={draft.collaboration_experience.collaboration_difficulty_solution}
          />
        </SummaryBlock>
        <SummaryBlock title="AI 추가 질문">
          <SummaryRow
            label="생성 질문 수"
            value={`${draft.raw_ai_follow_up_questions.length}개`}
          />
          <SummaryRow
            label="전체 답변 수"
            value={`${draft.projects.reduce(
              (sum, project) =>
                sum +
                project.ai_follow_up_answers.filter((answer) => answer.answer.trim())
                  .length,
              0
            )}개`}
          />
        </SummaryBlock>
      </div>

      <div className="mt-6">
        <SummaryBlock title="실무 시나리오 테스트">
          <SummaryRow
            label="시나리오 제목"
            value={draft.work_sample_test.scenario_title}
          />
          <SummaryRow label="대상 역할" value={draft.work_sample_test.target_role} />
          <SummaryRow
            label="작성 시간"
            value={draft.work_sample_test.self_reported_time_minutes}
          />
          <SummaryRow
            label="답변 완료 문항 수"
            value={`${getWorkSampleCompletedAnswerCount(draft.work_sample_test)} / ${draft.work_sample_test.answers.length}개`}
          />
          <SummaryRow
            label="필수 문항 완료 여부"
            value={
              hasRequiredWorkSampleAnswers(draft.work_sample_test)
                ? "필수 문항 완료"
                : "필수 문항 추가 입력 필요"
            }
          />
          <div className="grid gap-3 md:grid-cols-2">
            {draft.work_sample_test.answers.map((answer, index) => (
              <SummaryRow
                key={answer.question_id}
                label={`Q${index + 1}. ${answer.question}`}
                value={summarizeWorkSampleAnswer(answer)}
              />
            ))}
          </div>
        </SummaryBlock>
      </div>
    </div>
  );
}

function SummaryBlock({
  title,
  children
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-slate-950">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-500">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-800">
        {value && value.trim() ? value : "입력 없음"}
      </p>
    </div>
  );
}

function ExportStep({
  submitted,
  databaseSubmitted,
  databaseSubmissionId,
  submissionError,
  isSubmittingToSupabase,
  candidateJsonPreview,
  consentJsonPreview,
  submitToSupabase,
  downloadCandidate,
  downloadConsent
}: {
  submitted: boolean;
  databaseSubmitted: boolean;
  databaseSubmissionId: string;
  submissionError: string;
  isSubmittingToSupabase: boolean;
  candidateJsonPreview: string;
  consentJsonPreview: string;
  submitToSupabase: () => void | Promise<void>;
  downloadCandidate: () => void;
  downloadConsent: () => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title={databaseSubmitted ? "제출이 완료되었습니다" : submitted ? "JSON이 생성되었습니다" : "JSON Export"}
          description="candidate_profile JSON과 consent_log JSON을 별도로 다운로드할 수 있으며, 제출하기 버튼으로 Supabase candidate_submissions 테이블에 저장할 수 있습니다."
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            icon={isSubmittingToSupabase ? Loader2 : Send}
            onClick={submitToSupabase}
            disabled={isSubmittingToSupabase}
            className="shrink-0"
          >
            {isSubmittingToSupabase ? "제출 중" : databaseSubmitted ? "다시 제출하기" : "제출하기"}
          </Button>
          <Button
            type="button"
            icon={Download}
            onClick={downloadCandidate}
            className="shrink-0"
          >
            candidate_profile 다운로드
          </Button>
          <Button
            type="button"
            variant="secondary"
            icon={Download}
            onClick={downloadConsent}
            className="shrink-0"
          >
            consent_log 다운로드
          </Button>
        </div>
      </div>
      {databaseSubmitted ? (
        <div className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          제출이 완료되었습니다.
          {databaseSubmissionId ? ` 제출 ID: ${databaseSubmissionId}` : null}
        </div>
      ) : null}
      {submissionError ? (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {submissionError}
        </div>
      ) : null}
      <div className="grid gap-5 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-950">candidate_profile</h2>
          <pre className="max-h-[560px] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100">
            {candidateJsonPreview}
          </pre>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-bold text-slate-950">consent_log</h2>
          <pre className="max-h-[560px] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100">
            {consentJsonPreview}
          </pre>
        </div>
      </div>
    </div>
  );
}
