import { RunStatus } from "./types";

export function isRunDone(status: number): boolean {
  return status !== RunStatus.Pending && status !== RunStatus.Running;
}

/** Compare dot-separated versions by numeric segment: 1 if a>b, -1 if a<b, else 0. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".");
  const pb = b.split(".");
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = Number.parseInt(pa[i] ?? "0", 10);
    const nb = Number.parseInt(pb[i] ?? "0", 10);
    if (Number.isNaN(na) || Number.isNaN(nb) || na === nb) continue;
    return na > nb ? 1 : -1;
  }
  return 0;
}

export function hasAutoPass(evaluatorResults: unknown): boolean {
  let parsed = evaluatorResults;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return false;
    }
  }
  if (typeof parsed !== "object" || parsed === null) return false;
  return Object.prototype.hasOwnProperty.call(parsed, "auto_pass");
}
