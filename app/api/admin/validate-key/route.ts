import { NextResponse } from "next/server";
import {
  checkRateLimit,
  readJsonWithLimit,
  rejectCrossOriginRequest
} from "../../../../lib/requestGuards";

function normalizeKey(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export async function POST(request: Request) {
  try {
    const originError = rejectCrossOriginRequest(request);
    if (originError) {
      return originError;
    }

    const rateLimitError = checkRateLimit(request, {
      bucket: "admin-validate-key",
      limit: 10,
      windowMs: 10 * 60 * 1000
    });
    if (rateLimitError) {
      return rateLimitError;
    }

    const bodyResult = await readJsonWithLimit<{ access_key?: unknown }>(
      request,
      4 * 1024
    );
    if (bodyResult.response) {
      return bodyResult.response;
    }

    const body = bodyResult.data;
    const submittedKey =
      typeof body.access_key === "string" ? body.access_key.trim() : "";
    const configuredKey = normalizeKey(process.env.ADMIN_ACCESS_KEY);

    if (!configuredKey) {
      return NextResponse.json(
        { error: "ADMIN_ACCESS_KEY is not configured." },
        { status: 503 }
      );
    }

    if (!submittedKey || submittedKey !== configuredKey) {
      return NextResponse.json(
        { error: "Invalid admin access key." },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to validate admin access key.",
        detail: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
