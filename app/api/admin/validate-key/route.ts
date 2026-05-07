import { NextResponse } from "next/server";

function normalizeKey(value: string | undefined) {
  return value?.trim().replace(/^["']|["']$/g, "") ?? "";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { access_key?: unknown };
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
