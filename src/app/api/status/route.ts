import { NextResponse } from "next/server";
import { getNetworkStats } from "@/actions/get-network-stats";

export const dynamic = "force-dynamic";

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  Vary: "Origin",
} as const;

function normalizeOrigin(value: string): string | null {
  try {
    const parsed = new URL(value);
    return parsed.origin;
  } catch {
    return null;
  }
}

function getAllowedOrigins(request: Request): Set<string> {
  const allowed = new Set<string>();
  const requestOrigin = normalizeOrigin(request.url);

  if (requestOrigin) {
    allowed.add(requestOrigin);
  }

  const envOrigins = [
    process.env.CORS_ALLOWED_ORIGINS,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.APP_URL,
  ]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => value.split(","))
    .map((value) => normalizeOrigin(value.trim()))
    .filter((value): value is string => Boolean(value));

  for (const origin of envOrigins) {
    allowed.add(origin);
  }

  return allowed;
}

function isOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");

  // Requests without Origin are non-browser/server requests.
  if (!origin) {
    return true;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (!normalizedOrigin) {
    return false;
  }

  return getAllowedOrigins(request).has(normalizedOrigin);
}

function buildCorsHeaders(request: Request): HeadersInit {
  const origin = request.headers.get("origin");
  const headers: Record<string, string> = {
    ...BASE_CORS_HEADERS,
  };

  if (!origin) {
    return headers;
  }

  const normalizedOrigin = normalizeOrigin(origin);

  if (normalizedOrigin && getAllowedOrigins(request).has(normalizedOrigin)) {
    headers["Access-Control-Allow-Origin"] = normalizedOrigin;
  }

  return headers;
}

function forbiddenOriginResponse(request: Request) {
  return NextResponse.json(
    {
      error: "[!] FORBIDDEN_ORIGIN: CROSS_SITE_REQUEST_BLOCKED.",
    },
    {
      status: 403,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        ...buildCorsHeaders(request),
      },
    },
  );
}

export async function OPTIONS(request: Request) {
  if (!isOriginAllowed(request)) {
    return new NextResponse(null, {
      status: 403,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        ...buildCorsHeaders(request),
      },
    });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      ...buildCorsHeaders(request),
    },
  });
}

export async function GET(request: Request) {
  if (!isOriginAllowed(request)) {
    return forbiddenOriginResponse(request);
  }

  try {
    const status = await getNetworkStats();

    return NextResponse.json(status, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        ...buildCorsHeaders(request),
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "[!] SYSTEM_OFFLINE: UNABLE TO REACH AGGREGATOR.",
      },
      {
        status: 503,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          ...buildCorsHeaders(request),
        },
      },
    );
  }
}
