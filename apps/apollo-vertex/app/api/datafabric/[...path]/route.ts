import { type NextRequest, NextResponse } from "next/server";

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
    headers: {
      "Content-Type": request.headers.get("content-type") ?? "application/json",
      Authorization: authHeader,
    },
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
