import type {
  CandidateAnalysisReport,
  ReportEvidenceSection,
  ReportLevel
} from "./reportTypes";

type UnknownRecord = Record<string, unknown>;

type BuildReportOptions = {
  sourceSubmissionId?: string;
  generatedAt?: string;
};

type ProjectForReport = {
  name: string;
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
};

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readRecord(source: UnknownRecord, key: string): UnknownRecord {
  const value = source[key];
  return isRecord(value) ? value : {};
}

function readString(source: UnknownRecord, key: string): string {
  const value = source[key];
  return typeof value === "string" ? value.trim() : "";
}

function readStringArray(source: UnknownRecord, key: string): string[] {
  const value = source[key];

  if (Array.isArray(value)) {
    return compactStrings(value);
  }

  if (typeof value === "string") {
    return splitTextList(value);
  }

  return [];
}

function splitTextList(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function compactStrings(values: unknown[]): string[] {
  return values
    .map((value) => (typeof value === "string" ? value.trim() : ""))
    .filter(Boolean);
}

function unique(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function truncate(value: string, maxLength = 180): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength).trim()}...`;
}

function getProjects(candidateProfile: UnknownRecord): ProjectForReport[] {
  const projects = candidateProfile.projects;

  if (!Array.isArray(projects)) {
    return [];
  }

  return projects.filter(isRecord).map((project, index) => ({
    name: readString(project, "name") || `프로젝트 ${index + 1}`,
    project_type: readString(project, "project_type"),
    purpose: readString(project, "purpose"),
    role: readString(project, "role"),
    tech_stack: readStringArray(project, "tech_stack"),
    implemented_features: readStringArray(project, "implemented_features"),
    frontend_scope: readString(project, "frontend_scope"),
    backend_scope: readString(project, "backend_scope"),
    database_scope: readString(project, "database_scope"),
    auth_experience: readString(project, "auth_experience"),
    deployment_experience: readString(project, "deployment_experience"),
    real_user_or_client: readString(project, "real_user_or_client"),
    collaboration_people: readString(project, "collaboration_people"),
    difficulty: readString(project, "difficulty"),
    solution_process: readString(project, "solution_process"),
    result: readString(project, "result"),
    capacity_reason: readString(project, "capacity_reason")
  }));
}

function evidenceFromProjects(
  projects: ProjectForReport[],
  fields: Array<keyof ProjectForReport>,
  label: string
) {
  return projects.flatMap((project) =>
    fields.flatMap((field) => {
      const value = project[field];

      if (Array.isArray(value)) {
        return value.length > 0
          ? [`${project.name} - ${label}: ${truncate(value.join(", "))}`]
          : [];
      }

      return value ? [`${project.name} - ${label}: ${truncate(value)}`] : [];
    })
  );
}

function levelFromEvidence(evidence: string[]): ReportLevel {
  if (evidence.length === 0) {
    return "insufficient";
  }

  if (evidence.length === 1) {
    return "basic";
  }

  if (evidence.length <= 3) {
    return "moderate";
  }

  return "strong";
}

function buildTechnicalSection(
  evidence: string[],
  missingMessage: string
): ReportEvidenceSection {
  return {
    level: levelFromEvidence(evidence),
    evidence,
    concerns: evidence.length > 0 ? [] : [missingMessage]
  };
}

function summarizeEvidence(evidence: string[], fallback: string) {
  return evidence.length > 0 ? evidence.slice(0, 3).join("\n") : fallback;
}

function readFollowUpQuestions(candidateProfile: UnknownRecord): string[] {
  const rawQuestions =
    candidateProfile.ai_follow_up_questions ??
    candidateProfile.raw_ai_follow_up_questions ??
    [];

  if (!Array.isArray(rawQuestions)) {
    return [];
  }

  return rawQuestions.filter(isRecord).map((question) => {
    const category = readString(question, "category");
    const text = readString(question, "question");
    return category && text ? `[${category}] ${text}` : text;
  });
}

function addIfMissing(
  missingInformation: string[],
  condition: boolean,
  message: string
) {
  if (condition) {
    missingInformation.push(message);
  }
}

export function buildCandidateReportDraft(
  candidateProfileInput: unknown,
  options: BuildReportOptions = {}
): CandidateAnalysisReport {
  const candidateProfile = isRecord(candidateProfileInput)
    ? candidateProfileInput
    : {};
  const basicInfo = readRecord(candidateProfile, "candidate_basic_info");
  const links = readRecord(candidateProfile, "links");
  const collaboration = readRecord(candidateProfile, "collaboration_experience");
  const projects = getProjects(candidateProfile);

  const nameOrNickname =
    readString(basicInfo, "name_or_nickname") ||
    readString(basicInfo, "name") ||
    "이름 미입력";
  const techStack = unique([
    ...readStringArray(basicInfo, "tech_stack"),
    ...projects.flatMap((project) => project.tech_stack)
  ]);
  const preferredWorkTypes = unique(readStringArray(basicInfo, "preferred_work_type"));

  const frontendEvidence = evidenceFromProjects(
    projects,
    ["frontend_scope", "implemented_features"],
    "프론트엔드 및 구현 기능"
  );
  const backendEvidence = evidenceFromProjects(
    projects,
    ["backend_scope", "auth_experience"],
    "백엔드/API 및 인증"
  );
  const databaseEvidence = evidenceFromProjects(
    projects,
    ["database_scope"],
    "DB 설계 또는 연동"
  );
  const deploymentEvidence = evidenceFromProjects(
    projects,
    ["deployment_experience", "real_user_or_client"],
    "배포/운영 및 사용자 확인"
  );
  const collaborationEvidence = unique([
    ...evidenceFromProjects(projects, ["collaboration_people"], "협업 인원"),
    readString(collaboration, "pr_issue_code_review"),
    readString(collaboration, "role_distribution"),
    readString(collaboration, "requirement_change_response"),
    readString(collaboration, "delay_or_error_communication"),
    readString(collaboration, "non_developer_communication"),
    readString(collaboration, "collaboration_difficulty_solution")
  ]);
  const problemSolvingEvidence = evidenceFromProjects(
    projects,
    ["difficulty", "solution_process", "capacity_reason"],
    "문제 해결 과정"
  );
  const resultEvidence = evidenceFromProjects(projects, ["result"], "결과 또는 성과");
  const purposeEvidence = evidenceFromProjects(
    projects,
    ["purpose", "implemented_features"],
    "목적 및 핵심 기능"
  );

  const missingInformation: string[] = [];
  addIfMissing(
    missingInformation,
    !readString(basicInfo, "email"),
    "후보자 이메일이 입력되지 않았습니다."
  );
  addIfMissing(
    missingInformation,
    !readString(links, "github_url"),
    "GitHub URL이 입력되지 않았습니다."
  );
  addIfMissing(
    missingInformation,
    techStack.length === 0,
    "주요 기술스택 근거가 부족합니다."
  );
  addIfMissing(
    missingInformation,
    projects.length === 0,
    "대표 프로젝트가 입력되지 않았습니다."
  );
  addIfMissing(
    missingInformation,
    frontendEvidence.length === 0,
    "프론트엔드 담당 범위 설명이 부족합니다."
  );
  addIfMissing(
    missingInformation,
    backendEvidence.length === 0,
    "백엔드/API 담당 범위 설명이 부족합니다."
  );
  addIfMissing(
    missingInformation,
    databaseEvidence.length === 0,
    "DB 설계 또는 연동 경험 설명이 부족합니다."
  );
  addIfMissing(
    missingInformation,
    deploymentEvidence.length === 0,
    "배포/운영 경험 근거가 부족합니다."
  );
  addIfMissing(
    missingInformation,
    collaborationEvidence.length === 0,
    "협업 및 커뮤니케이션 경험 설명이 부족합니다."
  );
  addIfMissing(
    missingInformation,
    problemSolvingEvidence.length === 0,
    "문제 해결 과정 설명이 부족합니다."
  );
  addIfMissing(
    missingInformation,
    resultEvidence.length === 0,
    "프로젝트 결과 또는 성과 설명이 부족합니다."
  );

  const existingFollowUps = readFollowUpQuestions(candidateProfile);
  const recommendedFollowUps = unique([
    ...missingInformation.map((item) => `${item.replace(/\.$/, "")}를 보완해 주세요.`),
    ...existingFollowUps
  ]);
  const deploymentLink = readString(links, "deployed_service_url");
  const bestFitProjectTypes = unique([
    ...preferredWorkTypes,
    ...projects.map((project) => project.project_type)
  ]);
  const topTech = techStack.slice(0, 3).join(", ");

  return {
    candidate_summary: {
      name_or_nickname: nameOrNickname,
      headline: topTech
        ? `${topTech} 기반 프로젝트 경험 후보자`
        : "프로젝트 경험 기반 후보자",
      overall_observation:
        projects.length > 0
          ? `제출 자료 기준으로 ${projects.length}개 프로젝트와 ${techStack.length}개 기술스택이 확인됩니다. 이 초안은 후보자가 직접 입력한 정보에서 확인 가능한 범위만 정리합니다.`
          : "대표 프로젝트 정보가 부족하여 후보자 경험을 구조화하려면 추가 입력이 필요합니다."
    },
    verified_experience: {
      tech_stack: techStack,
      project_count: projects.length,
      deployment_experience: deploymentLink
        ? `배포 서비스 URL 확인: ${deploymentLink}`
        : summarizeEvidence(
            deploymentEvidence,
            "입력 데이터에서 배포/운영 경험을 확인할 근거가 부족합니다."
          ),
      fullstack_scope: [
        `프론트엔드 근거 ${frontendEvidence.length}건`,
        `백엔드/API 근거 ${backendEvidence.length}건`,
        `DB 근거 ${databaseEvidence.length}건`,
        `배포/운영 근거 ${deploymentEvidence.length}건`
      ].join(", "),
      collaboration_evidence: summarizeEvidence(
        collaborationEvidence,
        "입력 데이터에서 협업 경험을 확인할 근거가 부족합니다."
      )
    },
    technical_fit: {
      frontend: buildTechnicalSection(
        frontendEvidence,
        "프론트엔드 담당 범위가 구체적으로 입력되지 않았습니다."
      ),
      backend_api: buildTechnicalSection(
        backendEvidence,
        "백엔드/API 담당 범위가 구체적으로 입력되지 않았습니다."
      ),
      database: buildTechnicalSection(
        databaseEvidence,
        "DB 설계 또는 연동 경험이 구체적으로 입력되지 않았습니다."
      ),
      deployment_operations: buildTechnicalSection(
        deploymentEvidence,
        "배포/운영 경험이 구체적으로 입력되지 않았습니다."
      )
    },
    mvp_execution_fit: {
      requirement_breakdown: summarizeEvidence(
        purposeEvidence,
        "프로젝트 목적과 핵심 기능 설명이 더 필요합니다."
      ),
      prioritization:
        projects.some((project) => project.implemented_features.length > 0)
          ? "구현한 핵심 기능 목록이 있어 기능 범위 논의의 출발점으로 사용할 수 있습니다."
          : "핵심 기능과 우선순위 판단 근거가 아직 부족합니다.",
      completion_evidence: summarizeEvidence(
        resultEvidence,
        "완성 결과, 사용자 반응, 운영 상태에 대한 설명이 더 필요합니다."
      ),
      risk:
        missingInformation.length > 0
          ? "일부 항목의 근거가 부족하여 프로젝트 투입 전 추가 확인이 필요합니다."
          : "제출 자료 기준으로 주요 확인 항목이 입력되어 있습니다."
    },
    non_developer_collaboration_fit: {
      communication_clarity:
        readString(collaboration, "non_developer_communication") ||
        "비개발자와의 소통 경험 설명이 더 필요합니다.",
      requirement_change_response:
        readString(collaboration, "requirement_change_response") ||
        "요구사항 변경 대응 경험 설명이 더 필요합니다.",
      progress_sharing:
        readString(collaboration, "delay_or_error_communication") ||
        "일정 지연 또는 오류 발생 시 공유 방식 설명이 더 필요합니다.",
      handover_readiness:
        readString(collaboration, "collaboration_difficulty_solution") ||
        "협업 산출물 인수인계와 정리 방식에 대한 설명이 더 필요합니다."
    },
    best_fit_project_types: bestFitProjectTypes,
    potential_risks: missingInformation.map((item) =>
      `${item.replace(/\.$/, "")}: 추가 확인 필요`
    ),
    missing_information: unique(missingInformation),
    recommended_follow_up_questions: recommendedFollowUps,
    report_meta: {
      generated_at: options.generatedAt ?? new Date().toISOString(),
      source_submission_id:
        options.sourceSubmissionId ?? readString(candidateProfile, "id"),
      ai_generated: false
    }
  };
}
