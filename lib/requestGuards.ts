import "server-only";
import { NextResponse } from "next/server";

type JsonReadSuccess<T> = {
  data: T;
  response?: never;
};

type JsonReadFailure = {
  data?: never;
  response: NextResponse;
};

type RateLimitOptions = {
  bucket: string;
  limit: number;
  windowMs: number;
};

const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function getContentLength(request: Request) {
  const rawValue = request.headers.get("content-length");
  if (!rawValue) {
    return 0;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function getClientIp(request: Request) {
  const cfIp = request.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) {
    return cfIp;
  }

  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (forwardedFor) {
    return forwardedFor;
  }

  return "unknown";
}

function concatChunks(chunks: Uint8Array[], totalLength: number) {
  const result = new Uint8Array(totalLength);
  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return result;
}

export function rejectCrossOriginRequest(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) {
    return null;
  }

  const requestOrigin = new URL(request.url).origin;
  if (origin === requestOrigin) {
    return null;
  }

  return NextResponse.json(
    { error: "Cross-origin POST requests are not allowed." },
    { status: 403 }
  );
}

export function checkRateLimit(
  request: Request,
  { bucket, limit, windowMs }: RateLimitOptions
) {
  const now = Date.now();
  const key = `${bucket}:${getClientIp(request)}`;
  const current = rateLimitBuckets.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      {
        error: "Too many requests. Please try again later.",
        retry_after_seconds: retryAfterSeconds
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSeconds)
        }
      }
    );
  }

  current.count += 1;
  return null;
}

export async function readJsonWithLimit<T>(
  request: Request,
  maxBytes: number
): Promise<JsonReadSuccess<T> | JsonReadFailure> {
  const contentLength = getContentLength(request);

  if (contentLength > maxBytes) {
    return {
      response: NextResponse.json(
        { error: "Request body is too large." },
        { status: 413 }
      )
    };
  }

  if (!request.body) {
    return {
      response: NextResponse.json(
        { error: "Request body is required." },
        { status: 400 }
      )
    };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    receivedBytes += value.byteLength;
    if (receivedBytes > maxBytes) {
      return {
        response: NextResponse.json(
          { error: "Request body is too large." },
          { status: 413 }
        )
      };
    }

    chunks.push(value);
  }

  try {
    const text = new TextDecoder().decode(concatChunks(chunks, receivedBytes));
    return { data: JSON.parse(text) as T };
  } catch {
    return {
      response: NextResponse.json(
        { error: "Request body must be valid JSON." },
        { status: 400 }
      )
    };
  }
}
