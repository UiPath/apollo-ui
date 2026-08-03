import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

// Reads the shared demo store that the Slack listener writes to. The invoice
// review UI polls this every couple seconds to reflect Slack-driven actions.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const file = path.join(process.cwd(), "data", "demo-state.json");
    const raw = await readFile(file, "utf8");
    return NextResponse.json(JSON.parse(raw));
  } catch {
    // Store not created yet (listener never ran) — return an empty overlay.
    return NextResponse.json({ invoices: {}, updated_at: null });
  }
}
