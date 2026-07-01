import { type NextRequest, NextResponse } from "next/server";

// Server-side proxy: the Comms reply input POSTs here, and we forward to the
// Slack listener, which posts the reply into the card's thread (as the
// reviewer) and records it in the shared store.
export const dynamic = "force-dynamic";

const LISTENER_PORT = process.env.LISTENER_PORT || "3010";

export async function POST(request: NextRequest) {
  let body = "{}";
  try {
    body = JSON.stringify(await request.json());
  } catch {
    body = "{}";
  }
  try {
    const res = await fetch(`http://localhost:${LISTENER_PORT}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.ok ? 200 : res.status });
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
