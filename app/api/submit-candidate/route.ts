import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "../../../lib/supabaseAdmin";

type CandidateProfilePayload = {
  candidate_basic_info?: {
    name_or_nickname?: unknown;
    name?: unknown;
    email?: unknown;
  };
  [key: string]: unknown;
};

type ConsentLogPayload = {
  privacy_collection_required?: unknown;
  ai_analysis_required?: unknown;
  third_party_matching_optional?: unknown;
  marketing_optional?: unknown;
  [key: string]: unknown;
};

function getString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
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

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      candidate_profile?: CandidateProfilePayload;
      consent_log?: ConsentLogPayload;
    };

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

    const email = extractEmail(candidateProfile);
    if (!email) {
      return NextResponse.json(
        { error: "candidate_profile.candidate_basic_info.email is required." },
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
