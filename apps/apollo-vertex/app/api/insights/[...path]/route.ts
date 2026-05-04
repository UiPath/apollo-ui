import { type NextRequest, NextResponse } from "next/server";

const FORWARDED_HEADERS = ["authorization", "x-uipath-internal-tenantid"];

function getAuthHeader(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }
  return authHeader;
}

function buildTargetUrl(path: string[], search: string) {
  return `https://alpha.uipath.com/${path.join("/")}${search}`;
}

function forwardHeaders(request: NextRequest, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name);
    if (value) {
      headers.set(name, value);
    }
  }
  return headers;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const authHeader = getAuthHeader(request);
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const targetUrl = buildTargetUrl(path, request.nextUrl.search);

  const response = await fetch(targetUrl, {
    method: "GET",
    headers: forwardHeaders(request),
    signal: request.signal,
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const authHeader = getAuthHeader(request);
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const targetUrl = buildTargetUrl(path, request.nextUrl.search);
  const body = await request.text();

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: forwardHeaders(request, {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
    }),
    body,
    signal: request.signal,
  });

  const text = await response.text();
  return new NextResponse(text, {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("content-type") ?? "application/json",
    },
  });
}
