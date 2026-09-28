import { type NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await params;
  const targetUrl = `https://alpha.uipath.com/${path.join("/")}`;
  const body = await request.text();

  const response = await fetch(targetUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
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

  return new NextResponse(response.body, {
    status: response.status,
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
