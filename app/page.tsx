"use client";

import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Download,
  FileJson,
  Link as LinkIcon,
  Loader2,
  MessageSquareText,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type CandidateBasicInfo = {
  name: string;
  email: string;
  experience_level: string;
};

type CandidateLinks = {
  github_url: string;
  portfolio_url: string;
  deployed_service_url: string;
  linkedin_or_blog_url: string;
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
  collaboration_type: string;
  difficulty: string;
  solution_process: string;
  result: string;
  ai_follow_up_answers: FollowUpAnswer[];
};

type CandidateDraft = {
  candidate_basic_info: CandidateBasicInfo;
  links: CandidateLinks;
  tech_stack: string[];
  preferred_work_type: string[];
  projects: Project[];
  raw_ai_follow_up_questions: FollowUpQuestion[];
};

type StoredState = {
  activeStep: number;
  draft: CandidateDraft;
};

const STORAGE_KEY = "workerate_candidate_profile_draft_v1";

const preferredWorkOptions = [
  "MVP 제작",
  "프론트엔드 중심",
  "백엔드 중심",
  "풀스택 전체",
  "유지보수",
  "SaaS 개발"
];

const techExamples = [
  "React",
  "Next.js",
  "Node.js",
  "Express",
  "NestJS",
  "PostgreSQL",
  "Supabase",
  "Firebase",
  "AWS",
  "Cloudflare"
];

const experienceOptions = [
  "주니어",
  "1~3년",
  "3~5년",
  "5년 이상",
  "프리랜서 경험 있음"
];

const projectTypeOptions = [
  "개인작업",
  "팀프로젝트",
  "외주",
  "실무",
  "클론코딩"
];

const steps: Array<{ title: string; icon: LucideIcon }> = [
  { title: "시작", icon: Sparkles },
  { title: "기본 정보", icon: UserRound },
  { title: "링크", icon: LinkIcon },
  { title: "대표 프로젝트", icon: BriefcaseBusiness },
  { title: "AI 질문", icon: MessageSquareText },
  { title: "답변", icon: ClipboardList },
  { title: "최종 확인", icon: CheckCircle2 },
  { title: "JSON Export", icon: FileJson }
];

function createProject(index: number): Project {
  return {
    id: `project-${index + 1}`,
    name: "",
    url: "",
    github_url: "",
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
    collaboration_type: "",
    difficulty: "",
    solution_process: "",
    result: "",
    ai_follow_up_answers: []
  };
}

function createDefaultDraft(): CandidateDraft {
  return {
    candidate_basic_info: {
      name: "",
      email: "",
      experience_level: ""
    },
    links: {
      github_url: "",
      portfolio_url: "",
      deployed_service_url: "",
      linkedin_or_blog_url: ""
    },
    tech_stack: [],
    preferred_work_type: [],
    projects: [createProject(0), createProject(1)],
    raw_ai_follow_up_questions: []
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

function buildCandidateProfile(draft: CandidateDraft) {
  return {
    candidate_basic_info: {
      name: draft.candidate_basic_info.name,
      email: draft.candidate_basic_info.email,
      experience_level: draft.candidate_basic_info.experience_level
    },
    links: draft.links,
    tech_stack: draft.tech_stack,
    preferred_work_type: draft.preferred_work_type,
    projects: draft.projects.map((project) => ({
      name: project.name,
      url: project.url,
      github_url: project.github_url,
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
      collaboration_type: project.collaboration_type,
      difficulty: project.difficulty,
      solution_process: project.solution_process,
      result: project.result,
      ai_follow_up_answers: project.ai_follow_up_answers.map((answer) => ({
        category: answer.category,
        question: answer.question,
        answer: answer.answer
      }))
    })),
    raw_ai_follow_up_questions: draft.raw_ai_follow_up_questions
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
    ghost:
      "text-slate-700 hover:bg-slate-100 disabled:text-slate-400",
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
  hint
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">{label}</span>
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

export default function CandidateIntakePage() {
  const [draft, setDraft] = useState<CandidateDraft>(() => createDefaultDraft());
  const [activeStep, setActiveStep] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [fallbackUsed, setFallbackUsed] = useState(false);

  const candidateProfile = useMemo(() => buildCandidateProfile(draft), [draft]);
  const jsonPreview = useMemo(
    () => JSON.stringify(candidateProfile, null, 2),
    [candidateProfile]
  );

  useEffect(() => {
    let restoredState: StoredState | null = null;

    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as StoredState;
        if (parsed?.draft?.projects?.length >= 2) {
          restoredState = parsed;
        }
      }
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }

    const timeout = window.setTimeout(() => {
      if (restoredState) {
        setDraft(restoredState.draft);
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
      const state: StoredState = { activeStep, draft };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [activeStep, draft, hydrated]);

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
      if (current.projects.length <= 2) {
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

  async function generateFollowUps() {
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
          tech_stack: draft.tech_stack,
          preferred_work_type: draft.preferred_work_type,
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
        detail?: string;
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
      setActiveStep(5);
    } catch (error) {
      setGenerationError(
        error instanceof Error ? error.message : "추가 질문 생성 중 오류가 발생했습니다."
      );
    } finally {
      setIsGenerating(false);
    }
  }

  function downloadJson() {
    const blob = new Blob([jsonPreview], {
      type: "application/json;charset=utf-8"
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "candidate_profile.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const progressPercent = Math.round(((activeStep + 1) / steps.length) * 100);
  const canProceed = activeStep !== 4 || draft.raw_ai_follow_up_questions.length > 0;

  return (
    <main className="min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-5 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-sky-800">Workerate MVP</p>
            <h1 className="mt-1 text-xl font-bold text-slate-950 sm:text-2xl">
              풀스택 개발자 후보자 데이터 수집
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
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const selected = index === activeStep;
              const completed = index < activeStep;
              return (
                <button
                  key={step.title}
                  type="button"
                  onClick={() => setActiveStep(index)}
                  className={classNames(
                    "flex min-h-12 items-center gap-2 rounded-md border px-3 py-2 text-left text-xs font-semibold transition",
                    selected
                      ? "border-sky-700 bg-sky-50 text-sky-900"
                      : completed
                        ? "border-teal-200 bg-teal-50 text-teal-900"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  )}
                >
                  <Icon aria-hidden className="h-4 w-4 shrink-0" />
                  <span className="truncate">{step.title}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-soft sm:p-7">
          {activeStep === 0 ? (
            <StartStep onStart={() => setActiveStep(1)} />
          ) : null}

          {activeStep === 1 ? (
            <BasicInfoStep
              draft={draft}
              updateBasicInfo={updateBasicInfo}
              setDraft={setDraft}
            />
          ) : null}

          {activeStep === 2 ? (
            <LinksStep links={draft.links} updateLinks={updateLinks} />
          ) : null}

          {activeStep === 3 ? (
            <ProjectsStep
              projects={draft.projects}
              addProject={addProject}
              removeProject={removeProject}
              updateProject={updateProject}
            />
          ) : null}

          {activeStep === 4 ? (
            <GenerateQuestionsStep
              draft={draft}
              isGenerating={isGenerating}
              generationError={generationError}
              fallbackUsed={fallbackUsed}
              generateFollowUps={generateFollowUps}
            />
          ) : null}

          {activeStep === 5 ? (
            <AnswerQuestionsStep
              draft={draft}
              updateFollowUpAnswer={updateFollowUpAnswer}
            />
          ) : null}

          {activeStep === 6 ? <ReviewStep draft={draft} /> : null}

          {activeStep === 7 ? (
            <ExportStep jsonPreview={jsonPreview} downloadJson={downloadJson} />
          ) : null}
        </section>

        {activeStep > 0 ? (
          <footer className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Button
              type="button"
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => setActiveStep((step) => Math.max(step - 1, 0))}
            >
              이전
            </Button>
            <Button
              type="button"
              icon={ArrowRight}
              disabled={!canProceed || activeStep === steps.length - 1}
              onClick={() =>
                setActiveStep((step) => Math.min(step + 1, steps.length - 1))
              }
            >
              다음
            </Button>
          </footer>
        ) : null}
      </div>
    </main>
  );
}

function StartStep({ onStart }: { onStart: () => void }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px] lg:items-center">
      <div>
        <SectionTitle
          eyebrow="Candidate Intake"
          title="매칭 전, 후보자 정보를 분석 가능한 JSON으로 정리합니다."
          description="이 첫 MVP의 목적은 풀스택 개발자 후보자의 GitHub, 포트폴리오, 대표 프로젝트, 협업 경험, 문제 해결 경험을 구조화된 데이터로 수집하는 것입니다."
        />
        <div className="grid gap-3 text-sm leading-6 text-slate-700 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-950">비정형 입력</p>
            <p className="mt-2">프로젝트 설명과 경험을 단계별 폼으로 받습니다.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-950">AI 추가 질문</p>
            <p className="mt-2">부족한 맥락을 보완하기 위한 질문만 생성합니다.</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="font-bold text-slate-950">JSON Export</p>
            <p className="mt-2">최종 결과를 candidate_profile.json으로 저장합니다.</p>
          </div>
        </div>
        <p className="mt-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
          현재 버전은 분석을 위한 데이터 수집만 다룹니다. 매칭 점수, 합격 가능성,
          사람에 대한 평가는 포함하지 않습니다.
        </p>
        <Button type="button" icon={ArrowRight} className="mt-6" onClick={onStart}>
          시작하기
        </Button>
      </div>
      <div className="rounded-lg border border-sky-100 bg-sky-50 p-5">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-white text-sky-800 shadow-sm">
          <FileJson aria-hidden className="h-6 w-6" />
        </div>
        <p className="text-sm font-bold text-sky-950">최종 산출물</p>
        <pre className="mt-3 overflow-hidden rounded-md bg-white p-4 text-xs leading-5 text-slate-700">
{`{
  "candidate_basic_info": {},
  "projects": [],
  "raw_ai_follow_up_questions": []
}`}
        </pre>
      </div>
    </div>
  );
}

function BasicInfoStep({
  draft,
  updateBasicInfo,
  setDraft
}: {
  draft: CandidateDraft;
  updateBasicInfo: <K extends keyof CandidateBasicInfo>(
    key: K,
    value: CandidateBasicInfo[K]
  ) => void;
  setDraft: React.Dispatch<React.SetStateAction<CandidateDraft>>;
}) {
  return (
    <div>
      <SectionTitle
        title="기본 정보 입력"
        description="후보자 분석용 데이터에 필요한 최소 기본 정보만 입력합니다. 나이, 성별, 외모, 출신지역, 결혼 여부, 가족관계는 수집하지 않습니다."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="이름">
          <TextInput
            value={draft.candidate_basic_info.name}
            onChange={(event) => updateBasicInfo("name", event.target.value)}
            placeholder="홍길동"
          />
        </Field>
        <Field label="이메일">
          <TextInput
            type="email"
            value={draft.candidate_basic_info.email}
            onChange={(event) => updateBasicInfo("email", event.target.value)}
            placeholder="name@example.com"
          />
        </Field>
        <Field label="경력 수준">
          <SelectInput
            value={draft.candidate_basic_info.experience_level}
            onChange={(event) => updateBasicInfo("experience_level", event.target.value)}
          >
            <option value="">선택해주세요</option>
            {experienceOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </SelectInput>
        </Field>
        <Field
          label="주요 기술스택"
          hint={`예: ${techExamples.join(", ")}`}
        >
          <TextArea
            value={listToText(draft.tech_stack)}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                tech_stack: parseList(event.target.value)
              }))
            }
            placeholder="React, Next.js, Node.js, PostgreSQL"
          />
        </Field>
        <div className="md:col-span-2">
          <Field
            label="희망 업무 유형"
            hint="여러 개를 선택할 수 있습니다."
          >
            <MultiSelectPills
              options={preferredWorkOptions}
              value={draft.preferred_work_type}
              onChange={(next) =>
                setDraft((current) => ({
                  ...current,
                  preferred_work_type: next
                }))
              }
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
        title="링크 입력"
        description="후보자의 작업물을 확인할 수 있는 공개 링크를 입력합니다. 없는 항목은 비워둘 수 있습니다."
      />
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="GitHub URL">
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
        <Field label="LinkedIn 또는 블로그 URL">
          <TextInput
            value={links.linkedin_or_blog_url}
            onChange={(event) => updateLinks("linkedin_or_blog_url", event.target.value)}
            placeholder="https://linkedin.com/in/... 또는 블로그 주소"
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
          description="대표 프로젝트는 최소 2개, 최대 3개까지 입력합니다. 분석을 위한 데이터 수집이므로 가능한 한 본인의 역할과 구현 범위를 구체적으로 적어주세요."
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
                disabled={projects.length <= 2}
              >
                삭제
              </Button>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <Field label="프로젝트 이름">
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
              <Field label="프로젝트가 가까운 유형">
                <SelectInput
                  value={project.collaboration_type}
                  onChange={(event) =>
                    updateProject(projectIndex, "collaboration_type", event.target.value)
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
              <Field label="프론트엔드에서 담당한 부분">
                <TextArea
                  value={project.frontend_scope}
                  onChange={(event) =>
                    updateProject(projectIndex, "frontend_scope", event.target.value)
                  }
                />
              </Field>
              <Field label="백엔드/API에서 담당한 부분">
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
              <Field label="인증/권한 구현 여부">
                <TextArea
                  value={project.auth_experience}
                  onChange={(event) =>
                    updateProject(projectIndex, "auth_experience", event.target.value)
                  }
                  placeholder="예: JWT, OAuth, Supabase Auth, 관리자 권한"
                />
              </Field>
              <Field label="배포 경험">
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
                <Field label="그 문제를 어떻게 해결했는지">
                  <TextArea
                    value={project.solution_process}
                    onChange={(event) =>
                      updateProject(projectIndex, "solution_process", event.target.value)
                    }
                    placeholder="원인 파악, 시도한 방법, 선택한 해결책, 결과를 순서대로 적어주세요."
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
        description="대표 프로젝트 입력 내용을 바탕으로 분석용 데이터에 부족한 맥락을 보완하는 질문을 생성합니다."
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
          생성되는 질문은 본인 기여도, 풀스택 구현 범위, 문제 해결 과정, 배포/운영,
          협업, 요구사항 이해와 커뮤니케이션을 더 명확히 하기 위한 항목입니다.
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
        description="각 질문 아래에 후보자의 답변을 입력합니다. 답변은 해당 프로젝트 데이터에 함께 저장됩니다."
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

function ReviewStep({ draft }: { draft: CandidateDraft }) {
  return (
    <div>
      <SectionTitle
        title="최종 확인"
        description="수집된 데이터를 사람이 읽기 쉬운 형태로 확인합니다. 이 화면은 평가가 아니라 입력 누락과 구조화를 확인하기 위한 단계입니다."
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <SummaryBlock title="기본 정보">
          <SummaryRow label="이름" value={draft.candidate_basic_info.name} />
          <SummaryRow label="이메일" value={draft.candidate_basic_info.email} />
          <SummaryRow
            label="경력 수준"
            value={draft.candidate_basic_info.experience_level}
          />
          <SummaryRow
            label="희망 업무 유형"
            value={draft.preferred_work_type.join(", ")}
          />
        </SummaryBlock>

        <SummaryBlock title="주요 기술스택">
          <TagList items={draft.tech_stack} />
        </SummaryBlock>

        <SummaryBlock title="링크">
          <SummaryRow label="GitHub" value={draft.links.github_url} />
          <SummaryRow label="포트폴리오" value={draft.links.portfolio_url} />
          <SummaryRow label="배포 서비스" value={draft.links.deployed_service_url} />
          <SummaryRow label="LinkedIn/블로그" value={draft.links.linkedin_or_blog_url} />
        </SummaryBlock>

        <SummaryBlock title="AI 추가 질문 답변">
          <SummaryRow
            label="생성 질문 수"
            value={`${draft.raw_ai_follow_up_questions.length}개`}
          />
          <SummaryRow
            label="답변 수"
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

      <div className="mt-6 space-y-5">
        {draft.projects.map((project, index) => (
          <div key={project.id} className="rounded-lg border border-slate-200 p-4">
            <h2 className="text-lg font-bold text-slate-950">
              {projectDisplayName(project, index)}
            </h2>
            <div className="mt-4 grid gap-5 lg:grid-cols-2">
              <SummaryBlock title="대표 프로젝트">
                <SummaryRow label="목적" value={project.purpose} />
                <SummaryRow label="역할" value={project.role} />
                <SummaryRow label="유형" value={project.collaboration_type} />
                <SummaryRow label="실제 사용자/고객" value={project.real_user_or_client} />
                <SummaryRow label="성과" value={project.result} />
              </SummaryBlock>
              <SummaryBlock title="풀스택 경험 범위">
                <SummaryRow label="프론트엔드" value={project.frontend_scope} />
                <SummaryRow label="백엔드/API" value={project.backend_scope} />
                <SummaryRow label="DB" value={project.database_scope} />
                <SummaryRow label="인증/권한" value={project.auth_experience} />
                <SummaryRow label="배포" value={project.deployment_experience} />
              </SummaryBlock>
              <SummaryBlock title="협업 경험">
                <SummaryRow label="협업 인원" value={project.collaboration_people} />
                <SummaryRow label="프로젝트 유형" value={project.collaboration_type} />
              </SummaryBlock>
              <SummaryBlock title="문제 해결 사례">
                <SummaryRow label="어려웠던 문제" value={project.difficulty} />
                <SummaryRow label="해결 과정" value={project.solution_process} />
              </SummaryBlock>
            </div>
            {project.ai_follow_up_answers.length > 0 ? (
              <div className="mt-5">
                <h3 className="mb-3 text-sm font-bold text-slate-800">
                  AI 추가 질문 답변
                </h3>
                <div className="space-y-3">
                  {project.ai_follow_up_answers.map((answer) => (
                    <div
                      key={serializeQuestion(answer)}
                      className="rounded-md bg-slate-50 p-3 text-sm"
                    >
                      <p className="font-semibold text-slate-900">
                        {answer.category} · {answer.question}
                      </p>
                      <p className="mt-2 leading-6 text-slate-600">
                        {answer.answer || "답변 없음"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ))}
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
  jsonPreview,
  downloadJson
}: {
  jsonPreview: string;
  downloadJson: () => void;
}) {
  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <SectionTitle
          title="JSON Export"
          description="아래 미리보기는 candidate_profile.json으로 다운로드되는 최종 데이터입니다."
        />
        <Button type="button" icon={Download} onClick={downloadJson} className="shrink-0">
          JSON 다운로드
        </Button>
      </div>
      <pre className="max-h-[560px] overflow-auto rounded-lg border border-slate-200 bg-slate-950 p-4 text-xs leading-5 text-slate-100">
        {jsonPreview}
      </pre>
    </div>
  );
}
