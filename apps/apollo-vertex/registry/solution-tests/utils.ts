import { RunStatus } from "./types";

export function isRunDone(status: number): boolean {
  return status !== RunStatus.Pending && status !== RunStatus.Running;
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
