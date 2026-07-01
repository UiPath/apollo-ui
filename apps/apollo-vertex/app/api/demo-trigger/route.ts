import { type NextRequest, NextResponse } from "next/server";

// Server-side proxy: the prototype's "Escalate to manager" flag action POSTs
// here, and we forward to the standalone Slack listener's local HTTP endpoint.
// Keeps the listener port server-side (no CORS, no client hardcoding).
export const dynamic = "force-dynamic";

const LISTENER_PORT = process.env.LISTENER_PORT || "3010";

export async function POST(request: NextRequest) {
  let body = "{}";
  try {
    body = JSON.stringify(await request.json());
  } catch {
    body = "{}"; // no body is fine — listener falls back to demo defaults
  }
  try {
    const res = await fetch(
      `http://localhost:${LISTENER_PORT}/trigger-escalation`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      },
    );
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : 502 });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: `Slack listener not reachable on :${LISTENER_PORT}. Start it with: cd slack && npm start`,
      },
      { status: 502 },
    );
  }
}
