import { NextResponse } from "next/server";
import {
  checkRateLimit,
  readJsonWithLimit,
  rejectCrossOriginRequest
} from "../../../lib/requestGuards";
import { createEmptyWorkSampleAnalysisReport } from "../../../lib/createEmptyWorkSampleAnalysisReport";
import type {
  WorkSampleAnalysisReport,
  WorkSampleCriterionAnalysis
} from "../../../lib/workSampleAnalysisTypes";
import {
  MVP_FULLSTACK_WORK_SAMPLE_RUBRIC,
  type EvidenceLevel
} from "../../../lib/workSampleRubric";
import { createSupabaseAdminClient } from "../../../lib/supabaseAdmin";

type AnalyzeWorkSampleRequest = {
  candidate_submission_id?: unknown;
  candidate_profile?: unknown;
  save_to_supabase?: unknown;
};

type WorkSampleAnswerPayload = {
  question_id: string;
  question: string;
  answer: string;
  process_note: string;
};

type WorkSampleTestPayload = {
  scenario_id: string;
  scenario_title: string;
  scenario_description: string;
  target_role: string;
  estimated_time_minutes: number | string;
  started_at: string;
  submitted_at: string;
  self_reported_time_minutes: string;
  answers: WorkSampleAnswerPayload[];
};

const MAX_ANALYSIS_BODY_BYTES = 1024 * 1024;
const MAX_TEXT_FIELD_LENGTH = 3000;
const MAX_LIST_ITEMS = 12;
const evidenceLevels: EvidenceLevel[] = [
  "insufficient",
  "weak",
  "moderate",
  "strong"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getString(value: unknown, maxLength = MAX_TEXT_FIELD_LENGTH) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function getOptionalEnv(name: string) {
  const rawValue = process.env[name];

  if (typeof rawValue !== "string") {
    return "";
  }

  const value = rawValue
    .trim()
    .replace(/^["']|["']$/g, "")
    .replace(/[\r\n]/g, "");

  if (!value || value === "undefined" || value === "null") {
    return "";
  }

  return value;
}

function getStringList(value: unknown, maxLength = MAX_TEXT_FIELD_LENGTH) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => getString(item, maxLength))
    .filter(Boolean)
    .slice(0, MAX_LIST_ITEMS);
}

function sanitizeErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown error";
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/g, "Bearer [redacted]")
    .replace(/sk-[A-Za-z0-9_-]+/g, "sk-[redacted]")
    .slice(0, 500);
}

function extractCandidateProfile(value: unknown) {
  if (!isRecord(value)) {
    return null;
  }

  if (isRecord(value.candidate_profile)) {
    return value.candidate_profile;
  }

  return value;
}

function extractCandidateBasicInfo(candidateProfile: Record<string, unknown>) {
  const basicInfo = isRecord(candidateProfile.candidate_basic_info)
    ? candidateProfile.candidate_basic_info
    : {};

  return {
    email: getString(basicInfo.email, 320),
    name_or_nickname:
      getString(basicInfo.name_or_nickname, 160) || getString(basicInfo.name, 160),
    tech_stack: getStringList(basicInfo.tech_stack, 120),
    preferred_work_type: getStringList(basicInfo.preferred_work_type, 120)
  };
}

function validateAndSanitizeWorkSampleTest(
  candidateProfile: Record<string, unknown>
): { workSampleTest?: WorkSampleTestPayload; error?: string } {
  const workSampleTest = candidateProfile.work_sample_test;

  if (!isRecord(workSampleTest)) {
    return { error: "candidate_profile.work_sample_test is required." };
  }

  const scenarioId = getString(workSampleTest.scenario_id, 120);
  if (scenarioId !== MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.scenario_id) {
    return { error: "work_sample_test.scenario_id is invalid." };
  }

  if (!Array.isArray(workSampleTest.answers)) {
    return { error: "work_sample_test.answers must be an array." };
  }

  const answers = workSampleTest.answers
    .map((answer) => {
      if (!isRecord(answer)) {
        return null;
      }

      const questionId = getString(answer.question_id, 120);
      const question = getString(answer.question, 800);
      const response = getString(answer.answer, MAX_TEXT_FIELD_LENGTH);

      if (!questionId || !question) {
        return null;
      }

      return {
        question_id: questionId,
        question,
        answer: response,
        process_note: getString(answer.process_note, 1800)
      };
    })
    .filter((answer): answer is WorkSampleAnswerPayload => Boolean(answer));

  if (answers.length === 0) {
    return { error: "work_sample_test.answers must include at least one answer." };
  }

  return {
    workSampleTest: {
      scenario_id: scenarioId,
      scenario_title: getString(workSampleTest.scenario_title, 240),
      scenario_description: getString(workSampleTest.scenario_description, 1600),
      target_role:
        getString(workSampleTest.target_role, 160) ||
        MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.target_role,
      estimated_time_minutes:
        typeof workSampleTest.estimated_time_minutes === "number"
          ? workSampleTest.estimated_time_minutes
          : getString(workSampleTest.estimated_time_minutes, 40),
      started_at: getString(workSampleTest.started_at, 80),
      submitted_at: getString(workSampleTest.submitted_at, 80),
      self_reported_time_minutes: getString(
        workSampleTest.self_reported_time_minutes,
        80
      ),
      answers
    }
  };
}

function normalizeEvidenceLevel(value: unknown): EvidenceLevel {
  return typeof value === "string" && evidenceLevels.includes(value as EvidenceLevel)
    ? (value as EvidenceLevel)
    : "insufficient";
}

function normalizeCriterionAnalysis(
  value: unknown,
  rubricCriterion: (typeof MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.criteria)[number]
): WorkSampleCriterionAnalysis {
  const record = isRecord(value) ? value : {};

  return {
    criterion_id: rubricCriterion.id,
    label: rubricCriterion.label,
    level: normalizeEvidenceLevel(record.level),
    evidence: getStringList(record.evidence, 500),
    concerns: getStringList(record.concerns, 500),
    missing_information: getStringList(record.missing_information, 500)
  };
}

function normalizeAnalysisReport(value: unknown): WorkSampleAnalysisReport {
  if (!isRecord(value)) {
    throw new Error("AI response was not a JSON object.");
  }

  const rawCriteria = Array.isArray(value.criteria) ? value.criteria : [];

  return {
    report_type: "work_sample_analysis",
    report_version: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.rubric_version,
    scenario_id: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.scenario_id,
    target_role: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.target_role,
    generated_at: new Date().toISOString(),
    source: "ai_generated",
    overall_summary: getString(value.overall_summary, 1200),
    criteria: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.criteria.map((criterion) => {
      const rawCriterion = rawCriteria.find((item) => {
        return isRecord(item) && getString(item.criterion_id, 120) === criterion.id;
      });
      return normalizeCriterionAnalysis(rawCriterion, criterion);
    }),
    best_fit_project_types: getStringList(value.best_fit_project_types, 240),
    potential_risks: getStringList(value.potential_risks, 500),
    recommended_follow_up_questions: getStringList(
      value.recommended_follow_up_questions,
      500
    ),
    prohibited_interpretations: getStringList(
      value.prohibited_interpretations,
      500
    )
  };
}

function createFallbackReport(fallbackReason: string): WorkSampleAnalysisReport {
  const report = createEmptyWorkSampleAnalysisReport();

  return {
    ...report,
    overall_summary:
      "AI 분석을 완료하지 못했습니다. 제출된 실무 테스트 답변은 저장되었으며, 루브릭 기준 수동 검토가 필요합니다.",
    criteria: report.criteria.map((criterion) => ({
      ...criterion,
      level: "insufficient",
      missing_information: [
        ...criterion.missing_information,
        "AI 분석 실패로 인해 수동 검토가 필요합니다."
      ]
    })),
    potential_risks: fallbackReason ? [`분석 API fallback 사유: ${fallbackReason}`] : []
  };
}

async function analyzeWithOpenAi({
  candidateBasicInfo,
  workSampleTest
}: {
  candidateBasicInfo: ReturnType<typeof extractCandidateBasicInfo>;
  workSampleTest: WorkSampleTestPayload;
}) {
  const openAiApiKey = getOptionalEnv("OPENAI_API_KEY");
  const openAiModel = getOptionalEnv("OPENAI_MODEL") || "gpt-4o-mini";

  if (!openAiApiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: openAiModel,
      response_format: { type: "json_object" },
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "너는 실무 시나리오 답변을 루브릭 기준으로 구조화하는 분석 보조자다. 제출 답변에 있는 내용만 근거로 사용하고 추측하지 않는다. 합격/불합격, 점수, 순위 표현을 쓰지 않는다. 사람의 성향이나 직무와 무관한 정보를 단정하거나 추론하지 않는다. 반드시 JSON 객체만 출력한다."
        },
        {
          role: "user",
          content: JSON.stringify({
            instruction:
              "work_sample_test.answers와 rubric만 사용해 WorkSampleAnalysisReport JSON을 생성한다. 각 criterion마다 level은 insufficient, weak, moderate, strong 중 하나만 선택한다. evidence에는 답변에서 확인된 구체적 근거, concerns에는 부족하거나 우려되는 부분, missing_information에는 추가 확인이 필요한 정보를 넣는다. recommended_follow_up_questions에는 기업 또는 의뢰자가 추가로 물어볼 질문을 넣는다. 마크다운 설명 없이 JSON만 반환한다.",
            required_shape: {
              report_type: "work_sample_analysis",
              report_version: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.rubric_version,
              scenario_id: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.scenario_id,
              target_role: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.target_role,
              generated_at: "ISO string",
              source: "ai_generated",
              overall_summary: "",
              criteria: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC.criteria.map((criterion) => ({
                criterion_id: criterion.id,
                label: criterion.label,
                level: "insufficient | weak | moderate | strong",
                evidence: [],
                concerns: [],
                missing_information: []
              })),
              best_fit_project_types: [],
              potential_risks: [],
              recommended_follow_up_questions: [],
              prohibited_interpretations:
                createEmptyWorkSampleAnalysisReport().prohibited_interpretations
            },
            candidate_basic_info: {
              name_or_nickname: candidateBasicInfo.name_or_nickname,
              tech_stack: candidateBasicInfo.tech_stack,
              preferred_work_type: candidateBasicInfo.preferred_work_type
            },
            work_sample_test: workSampleTest,
            rubric: MVP_FULLSTACK_WORK_SAMPLE_RUBRIC
          })
        }
      ],
      max_tokens: 3000
    }),
    signal: AbortSignal.timeout(25_000)
  });

  if (!response.ok) {
    throw new Error(`OpenAI API request failed with status ${response.status}.`);
  }

  const data = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content ?? "";

  if (!content) {
    throw new Error("OpenAI API returned an empty response.");
  }

  return normalizeAnalysisReport(JSON.parse(content) as unknown);
}

async function saveReportToSupabase({
  candidateSubmissionId,
  candidateEmail,
  candidateNameOrNickname,
  report,
  fallbackUsed,
  fallbackReason
}: {
  candidateSubmissionId: string;
  candidateEmail: string;
  candidateNameOrNickname: string;
  report: WorkSampleAnalysisReport;
  fallbackUsed: boolean;
  fallbackReason: string;
}) {
  const supabaseAdmin = createSupabaseAdminClient();
  const { data, error } = await supabaseAdmin
    .from("candidate_work_sample_reports")
    .insert({
      candidate_submission_id: candidateSubmissionId || null,
      candidate_email: candidateEmail || null,
      candidate_name_or_nickname: candidateNameOrNickname || null,
      report_type: report.report_type,
      report_version: report.report_version,
      scenario_id: report.scenario_id,
      target_role: report.target_role,
      report,
      source: report.source,
      fallback_used: fallbackUsed,
      fallback_reason: fallbackReason || null
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ? String(data.id) : "";
}

export async function POST(request: Request) {
  try {
    const originError = rejectCrossOriginRequest(request);
    if (originError) {
      return originError;
    }

    const rateLimitError = checkRateLimit(request, {
      bucket: "analyze-work-sample",
      limit: 10,
      windowMs: 10 * 60 * 1000
    });
    if (rateLimitError) {
      return rateLimitError;
    }

    const bodyResult = await readJsonWithLimit<AnalyzeWorkSampleRequest>(
      request,
      MAX_ANALYSIS_BODY_BYTES
    );
    if (bodyResult.response) {
      return bodyResult.response;
    }

    const body = bodyResult.data;
    const candidateProfile = extractCandidateProfile(body.candidate_profile);

    if (!candidateProfile) {
      return NextResponse.json(
        { error: "candidate_profile is required." },
        { status: 400 }
      );
    }

    const { workSampleTest, error } =
      validateAndSanitizeWorkSampleTest(candidateProfile);
    if (error || !workSampleTest) {
      return NextResponse.json(
        { error: error || "candidate_profile.work_sample_test is invalid." },
        { status: 400 }
      );
    }

    const candidateBasicInfo = extractCandidateBasicInfo(candidateProfile);
    const candidateSubmissionId = getString(body.candidate_submission_id, 120);
    let fallbackUsed = false;
    let fallbackReason = "";
    let report: WorkSampleAnalysisReport;

    try {
      report = await analyzeWithOpenAi({
        candidateBasicInfo,
        workSampleTest
      });
    } catch (error) {
      fallbackUsed = true;
      fallbackReason = sanitizeErrorMessage(error);
      report = createFallbackReport(fallbackReason);
    }

    let saved = false;
    let reportId = "";

    if (body.save_to_supabase === true) {
      try {
        reportId = await saveReportToSupabase({
          candidateSubmissionId,
          candidateEmail: candidateBasicInfo.email,
          candidateNameOrNickname: candidateBasicInfo.name_or_nickname,
          report,
          fallbackUsed,
          fallbackReason
        });
        saved = true;
      } catch (error) {
        return NextResponse.json(
          {
            error: "Failed to save work sample analysis report.",
            detail: sanitizeErrorMessage(error),
            report,
            fallback_used: fallbackUsed,
            fallback_reason: fallbackReason
          },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      report,
      saved,
      report_id: reportId,
      fallback_used: fallbackUsed,
      fallback_reason: fallbackReason || undefined
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to analyze work sample.",
        detail: sanitizeErrorMessage(error)
      },
      { status: 500 }
    );
  }
}
