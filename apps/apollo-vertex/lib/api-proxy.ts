import { type NextRequest, NextResponse } from "next/server";

const UPSTREAM_ORIGIN = "https://alpha.uipath.com";

interface ProxyToUiPathOptions {
  requiredServiceSegment: string;
}

function buildTargetUrl(path: string[], search: string) {
  return `${UPSTREAM_ORIGIN}/${path.join("/")}${search}`;
}

export async function proxyToUiPath(
  request: NextRequest,
  path: string[],
  { requiredServiceSegment }: ProxyToUiPathOptions,
): Promise<NextResponse> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (path[2] !== requiredServiceSegment) {
    return NextResponse.json(
      {
        error: `Proxy only forwards to "${requiredServiceSegment}" — refused path "/${path.join("/")}".`,
      },
      { status: 403 },
    );
  }

  const targetUrl = buildTargetUrl(path, request.nextUrl.search);
  const method = request.method;
  const hasBody = method !== "GET" && method !== "HEAD";

  const headers: HeadersInit = { Authorization: authHeader };
  if (hasBody) {
    headers["Content-Type"] =
      request.headers.get("content-type") ?? "application/json";
  }

  const response = await fetch(targetUrl, {
    method,
    headers,
    body: hasBody ? await request.text() : null,
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
