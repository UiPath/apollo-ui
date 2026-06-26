import type { NextRequest } from "next/server";
import { proxyToUiPath } from "@/lib/api-proxy";

const INSIGHTS_SEGMENT = "insightsrtm_";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyToUiPath(request, path, {
    requiredServiceSegment: INSIGHTS_SEGMENT,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  return proxyToUiPath(request, path, {
    requiredServiceSegment: INSIGHTS_SEGMENT,
  });
}
