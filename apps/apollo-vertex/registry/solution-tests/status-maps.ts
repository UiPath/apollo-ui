import { RunStatus, RunResultStatus, SolutionTestStatus } from "./types";

export type BadgeStatus = "success" | "warning" | "error" | "info";

export const testStatusBadgeMap: Record<number, BadgeStatus> = {
  [SolutionTestStatus.Ready]: "success",
  [SolutionTestStatus.Pending]: "warning",
  [SolutionTestStatus.Error]: "error",
};

export const runStatusBadgeMap: Record<number, BadgeStatus> = {
  [RunStatus.Passed]: "success",
  [RunStatus.Running]: "warning",
  [RunStatus.Failed]: "error",
  [RunStatus.Error]: "error",
  [RunStatus.Pending]: "info",
  [RunStatus.Aborted]: "warning",
};

export const runResultStatusBadgeMap: Record<number, BadgeStatus> = {
  [RunResultStatus.Passed]: "success",
  [RunResultStatus.Failed]: "error",
  [RunResultStatus.Error]: "warning",
  [RunResultStatus.NoBaseline]: "info",
  [RunResultStatus.Pending]: "info",
  [RunResultStatus.Aborted]: "warning",
};

export const resultBadgeClassMap: Record<number, string> = {
  [RunResultStatus.Missing]:
    "border-transparent bg-muted text-muted-foreground",
};
