import { RunStatus } from "./types";

export function isRunDone(status: number): boolean {
  return status !== RunStatus.Pending && status !== RunStatus.Running;
}

/** Compare dot-separated versions by numeric segment: 1 if a>b, -1 if a<b, else
 *  0. Segments that aren't strictly numeric (e.g. "1-beta") are skipped, so
 *  annotated/pre-release versions compare equal and show no glyph. */
export function compareVersions(a: string, b: string): number {
  const pa = a.split(".");
  const pb = b.split(".");
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const na = Number(pa[i] ?? "0");
    const nb = Number(pb[i] ?? "0");
    if (Number.isNaN(na) || Number.isNaN(nb) || na === nb) continue;
    return na > nb ? 1 : -1;
  }
  return 0;
}

function isNumericVersion(v: string): boolean {
  return v.split(".").every((seg) => seg !== "" && !Number.isNaN(Number(seg)));
}

export interface VersionDelta {
  changed: boolean;
  /** 0 also covers "can't tell a direction" (non-numeric or missing), so callers
   *  can treat it as "no arrow to show". */
  direction: number;
}

// Numeric versions can be ordered (so a bump yields a direction and "2.0" equals
// 2); non-numeric tags can't, so they fall back to a plain string equality check.
export function versionDelta(
  baseline?: string | number | null,
  actual?: string | number | null,
): VersionDelta {
  if (baseline == null || actual == null)
    return { changed: false, direction: 0 };
  const b = String(baseline);
  const a = String(actual);
  if (isNumericVersion(a) && isNumericVersion(b)) {
    const direction = compareVersions(a, b);
    return { changed: direction !== 0, direction };
  }
  return { changed: a !== b, direction: 0 };
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
