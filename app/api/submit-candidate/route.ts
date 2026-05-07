import { NextResponse } from "next/server";
import {
  checkRateLimit,
  readJsonWithLimit,
  rejectCrossOriginRequest
} from "../../../lib/requestGuards";
import { createSupabaseAdminClient } from "../../../lib/supabaseAdmin";

type CandidateProfilePayload = {
  candidate_basic_info?: {
    name_or_nickname?: unknown;
    name?: unknown;
    email?: unknown;
    preferred_work_type?: unknown;
    tech_stack?: unknown;
  };
  links?: {
    github_url?: unknown;
  };
  projects?: unknown;
  work_sample_test?: unknown;
  [key: string]: unknown;
};

type ConsentLogPayload = {
  privacy_collection_required?: unknown;
  ai_analysis_required?: unknown;
  third_party_matching_optional?: unknown;
  marketing_optional?: unknown;
  [key: string]: unknown;
};

const MAX_SUBMISSION_BODY_BYTES = 1024 * 1024;
const requiredWorkSampleQuestionIds = [
  "requirement_understanding",
  "mvp_prioritization",
  "risk_communication",
  "handover_readiness"
];

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value
        .map((item) => getString(item))
        .filter((item) => item.length > 0)
    : [];
}

function isHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

function extractEmail(candidateProfile: CandidateProfilePayload) {
  return getString(candidateProfile.candidate_basic_info?.email);
}

function extractName(candidateProfile: CandidateProfilePayload) {
  return (
    getString(candidateProfile.candidate_basic_info?.name_or_nickname) ||
    getString(candidateProfile.candidate_basic_info?.name)
  );
}

function validateProjects(candidateProfile: CandidateProfilePayload) {
  if (!Array.isArray(candidateProfile.projects)) {
    return "candidate_profile.projects must be an array.";
  }

  if (candidateProfile.projects.length < 1) {
    return "At least one project is required.";
  }

  if (candidateProfile.projects.length > 3) {
    return "A maximum of three projects is allowed.";
  }

  const firstProject = candidateProfile.projects[0];
  if (!isRecord(firstProject)) {
    return "The first project must be an object.";
  }

  const requiredTextFields = [
    ["name", "project name"],
    ["project_type", "project type"],
    ["purpose", "project purpose"],
    ["role", "project role"],
    ["difficulty", "project difficulty"],
    ["solution_process", "project solution process"]
  ] as const;

  const missingTextField = requiredTextFields.find(
    ([field]) => !getString(firstProject[field])
  );

  if (missingTextField) {
    return `The first project's ${missingTextField[1]} is required.`;
  }

  if (getStringArray(firstProject.tech_stack).length < 1) {
    return "The first project must include at least one tech_stack item.";
  }

  if (getStringArray(firstProject.implemented_features).length < 1) {
    return "The first project must include at least one implemented_features item.";
  }

  return "";
}

function validateWorkSampleTest(candidateProfile: CandidateProfilePayload) {
  const workSampleTest = candidateProfile.work_sample_test;

  if (!isRecord(workSampleTest)) {
    return "candidate_profile.work_sample_test is required.";
  }

  if (getString(workSampleTest.scenario_id) !== "mvp_fullstack_001") {
    return "work_sample_test.scenario_id is invalid.";
  }

  if (!Array.isArray(workSampleTest.answers)) {
    return "work_sample_test.answers must be an array.";
  }

  const answers = workSampleTest.answers;
  const missingRequiredAnswer = requiredWorkSampleQuestionIds.find((questionId) => {
    return !answers.some((answer) => {
      return (
        isRecord(answer) &&
        getString(answer.question_id) === questionId &&
        getString(answer.answer).length > 0
      );
    });
  });

  if (missingRequiredAnswer) {
    return "Required work_sample_test answers are missing.";
  }

  return "";
}

function validateCandidateProfile(candidateProfile: CandidateProfilePayload) {
  const name = extractName(candidateProfile);
  if (!name) {
    return "candidate_profile.candidate_basic_info.name_or_nickname is required.";
  }

  const email = extractEmail(candidateProfile);
  if (!email) {
    return "candidate_profile.candidate_basic_info.email is required.";
  }

  if (!isValidEmail(email)) {
    return "candidate_profile.candidate_basic_info.email must be valid.";
  }

  if (getStringArray(candidateProfile.candidate_basic_info?.tech_stack).length < 1) {
    return "candidate_profile.candidate_basic_info.tech_stack must include at least one item.";
  }

  if (
    getStringArray(candidateProfile.candidate_basic_info?.preferred_work_type).length <
    1
  ) {
    return "candidate_profile.candidate_basic_info.preferred_work_type must include at least one item.";
  }

  const githubUrl = getString(candidateProfile.links?.github_url);
  if (!githubUrl) {
    return "candidate_profile.links.github_url is required.";
  }

  if (!isHttpUrl(githubUrl)) {
    return "candidate_profile.links.github_url must be a valid URL.";
  }

  return validateProjects(candidateProfile) || validateWorkSampleTest(candidateProfile);
}

export async function POST(request: Request) {
  try {
    const originError = rejectCrossOriginRequest(request);
    if (originError) {
      return originError;
    }

    const rateLimitError = checkRateLimit(request, {
      bucket: "submit-candidate",
      limit: 8,
      windowMs: 10 * 60 * 1000
    });
    if (rateLimitError) {
      return rateLimitError;
    }

    const bodyResult = await readJsonWithLimit<{
      candidate_profile?: CandidateProfilePayload;
      consent_log?: ConsentLogPayload;
    }>(request, MAX_SUBMISSION_BODY_BYTES);
    if (bodyResult.response) {
      return bodyResult.response;
    }

    const body = bodyResult.data;

    const candidateProfile = body.candidate_profile;
    const consentLog = body.consent_log;

    if (!candidateProfile || typeof candidateProfile !== "object") {
      return NextResponse.json(
        { error: "candidate_profile is required." },
        { status: 400 }
      );
    }

    if (!consentLog || typeof consentLog !== "object") {
      return NextResponse.json(
        { error: "consent_log is required." },
        { status: 400 }
      );
    }

    const profileValidationError = validateCandidateProfile(candidateProfile);
    if (profileValidationError) {
      return NextResponse.json(
        { error: profileValidationError },
        { status: 400 }
      );
    }

    if (consentLog.privacy_collection_required !== true) {
      return NextResponse.json(
        { error: "privacy_collection_required consent is required." },
        { status: 400 }
      );
    }

    if (consentLog.ai_analysis_required !== true) {
      return NextResponse.json(
        { error: "ai_analysis_required consent is required." },
        { status: 400 }
      );
    }

    const supabaseAdmin = createSupabaseAdminClient();
    const email = extractEmail(candidateProfile);
    const { data, error } = await supabaseAdmin
      .from("candidate_submissions")
      .insert({
        name_or_nickname: extractName(candidateProfile),
        email,
        candidate_profile: candidateProfile,
        consent_log: consentLog,
        source: "community_form",
        third_party_matching_consent:
          consentLog.third_party_matching_optional === true,
        marketing_consent: consentLog.marketing_optional === true
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to save candidate submission.", detail: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, id: data?.id });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to submit candidate profile.",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
