"use client";

/**
 * Structured failure handling for the Solution Tests write actions. The backend
 * returns a translatable `UserMessage` ({ key, details, message }) on error, as
 * the top-level `body` on the RPC contract or `output_data.error_message` on the
 * agent contract. `extractFailure` reconciles both; the actions throw the result
 * as a `SolutionTestActionError` that keeps `key` + `details` so consumers can
 * localize with interpolation rather than losing them to a flattened string.
 */

import { AGENT_SUCCESS_STATUSES } from "./constants";

export interface ActionFailure {
  /** Stable failure code; consumers may map it to a localized message. */
  key?: string;
  /** Interpolation params for the localized message (e.g. `required_roles`). */
  details?: Record<string, string>;
  message?: string;
}

/** Thrown by the write actions on an app-level failure (HTTP stays 200). */
export class SolutionTestActionError extends Error {
  readonly key?: string;
  readonly details?: Record<string, string>;

  constructor(failure: ActionFailure) {
    // `message` stays the key so plain `t(err.message)` consumers are unaffected.
    super(failure.key ?? failure.message ?? "request_failed");
    this.name = "SolutionTestActionError";
    this.key = failure.key;
    this.details = failure.details;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toDetails(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value)) {
    if (typeof v === "string") out[k] = v;
  }
  if (Object.keys(out).length === 0) return;
  return out;
}

function fromUserMessage(value: unknown): ActionFailure | null {
  if (!isRecord(value)) return null;
  const failure: ActionFailure = {};
  if (typeof value.key === "string") failure.key = value.key;
  if (typeof value.message === "string") failure.message = value.message;
  const details = toDetails(value.details);
  if (details) failure.details = details;
  if (!failure.key && !failure.message && !failure.details) return null;
  return failure;
}

/** Detect an app-level failure across both contracts, or null on success. */
export function extractFailure(data: unknown): ActionFailure | null {
  if (!isRecord(data)) return null;
  // The agent wraps its payload in `output_data`; the RPC router returns it
  // top-level. Unwrap once so `status_code`/`status` read from the same object.
  const output = isRecord(data.output_data) ? data.output_data : data;

  if (typeof output.status_code === "number" && output.status_code >= 400) {
    // RPC contract: the UserMessage is the top-level `body`.
    const failure = fromUserMessage(data.body) ?? {};
    if (typeof output.error === "string") {
      failure.key ??= output.error;
      failure.message ??= output.error;
    }
    failure.key ??= "request_failed";
    return failure;
  }

  if (
    typeof output.status === "string" &&
    !AGENT_SUCCESS_STATUSES.has(output.status)
  ) {
    // Agent contract: the UserMessage is `output_data.error_message`.
    const failure = fromUserMessage(output.error_message) ?? {};
    if (typeof output.message === "string") {
      failure.key ??= output.message;
      failure.message ??= output.message;
    }
    failure.key ??= output.status;
    failure.message ??= output.status;
    return failure;
  }

  return null;
}
