import { type NextRequest, NextResponse } from "next/server";

type RouteParams = { params: Promise<{ path: string[] }> };

function getAuthHeader(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return null;
  }
  return authHeader;
}

function buildTargetUrl(path: string[]) {
  return `https://alpha.uipath.com/${path.join("/")}`;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const authHeader = getAuthHeader(request);
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const targetUrl = buildTargetUrl(path);

  const response = await fetch(targetUrl, {
    method: "GET",
    headers: {
      Authorization: authHeader,
    },
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

export async function POST(request: NextRequest, { params }: RouteParams) {
  const authHeader = getAuthHeader(request);
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const targetUrl = buildTargetUrl(path);
  const body = await request.text();

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      Authorization: authHeader,
      "X-UiPath-LlmGateway-NormalizedApi-ModelName":
        request.headers.get("x-uipath-llmgateway-normalizedapi-modelname") ??
        "",
    },
    body,
    signal: request.signal,
  });

  if (!response.ok || !response.body) {
    const text = await response.text();
    return new NextResponse(text, { status: response.status });
  }

  const upstreamContentType =
    response.headers.get("content-type") ?? "application/json";
  const isStream = upstreamContentType.includes("text/event-stream");

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type": upstreamContentType,
      ...(isStream && {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      }),
    },
  });
}
