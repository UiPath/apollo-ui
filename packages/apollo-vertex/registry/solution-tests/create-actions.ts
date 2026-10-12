"use client";

/**
 * Builds the Solution Tests write actions: `run` hits the `run_solution_tests`
 * trigger; delete/adopt/baseline/force-stop go through the `automation-functions`
 * RPC trigger. Each POSTs `{triggerBaseUrl}/{slug}` with the bearer token in the
 * header and echoed in the body for backend RBAC.
 */

import type { SolutionTestsActions } from "./actions";
import {
  AUTOMATION_FUNCTION_PATH,
  AUTOMATION_FUNCTIONS_SLUG,
  RUN_TESTS_SLUG,
} from "./constants";
import { extractFailure, SolutionTestActionError } from "./errors";

export interface SolutionTestActionDeps {
  /** Base URL each action slug is appended to (no trailing slash). */
  triggerBaseUrl: string;
  getToken: () => Promise<string | null> | string | null;
}

export function createSolutionTestActions(
  deps: SolutionTestActionDeps,
): SolutionTestsActions {
  const { triggerBaseUrl, getToken } = deps;

  async function invokeTrigger(
    slug: string,
    buildBody: (token: string) => Record<string, unknown>,
  ): Promise<void> {
    const token = await getToken();
    if (!token) throw new Error("No access token available.");

    let response: Response;
    try {
      response = await fetch(`${triggerBaseUrl}/${slug}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(buildBody(token)),
      });
    } catch (error) {
      // The request never reached the server (offline/DNS/CORS).
      throw error instanceof Error
        ? error
        : new Error("Network request failed.");
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(
        `API trigger returned ${response.status}: ${text.slice(0, 300)}`,
      );
    }
    const data: unknown = response.headers
      .get("content-type")
      ?.includes("application/json")
      ? await response.json().catch(() => null)
      : null;
    const failure = extractFailure(data);
    if (failure) throw new SolutionTestActionError(failure);
  }

  // automation-functions RPC router; the token goes in the body's `_auth` envelope.
  function callFn(path: string, body: Record<string, unknown>): Promise<void> {
    return invokeTrigger(AUTOMATION_FUNCTIONS_SLUG, (token) => ({
      method: "POST",
      path,
      body: { ...body, _auth: { userToken: token } },
    }));
  }

  return {
    runTests(testIds?: string[]): Promise<void> {
      // Agent maps trigger input by field name, so the token is a top-level
      // `auth` field here (not `_auth`).
      return invokeTrigger(RUN_TESTS_SLUG, (token) => ({
        ...(testIds ? { solution_test_ids: testIds } : {}),
        auth: { userToken: token },
      }));
    },
    createTest(subjectId: string): Promise<void> {
      return callFn(AUTOMATION_FUNCTION_PATH.createTest, {
        subject_id: subjectId,
      });
    },
    deleteTest(testId: string): Promise<void> {
      return callFn(AUTOMATION_FUNCTION_PATH.deleteTest, {
        solution_test_id: testId,
      });
    },
    forceStopBatch(batchId: string): Promise<void> {
      return callFn(AUTOMATION_FUNCTION_PATH.forceStopBatch, {
        batch_id: batchId,
      });
    },
    forceStopRun(runId: string): Promise<void> {
      return callFn(AUTOMATION_FUNCTION_PATH.forceStopRun, { run_id: runId });
    },
    adoptJob(runResultId: string): Promise<void> {
      return callFn(AUTOMATION_FUNCTION_PATH.adoptJob, {
        run_result_id: runResultId,
      });
    },
    updateBaseline(runResultId: string): Promise<void> {
      return callFn(AUTOMATION_FUNCTION_PATH.updateBaseline, {
        run_result_id: runResultId,
      });
    },
    removeJobBaseline(jobBaselineId: string): Promise<void> {
      return callFn(AUTOMATION_FUNCTION_PATH.removeJobBaseline, {
        job_baseline_id: jobBaselineId,
      });
    },
  };
}
