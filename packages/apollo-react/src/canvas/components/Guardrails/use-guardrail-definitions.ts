import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { type GuardrailCopyTable, useGuardrailDefinitionCopy } from './definitions-copy';
import { type EnrichedGuardrailDefinition, enrichGuardrailDefinitions } from './definitions-enrich';
import {
  type GuardrailDefinitionParseIssue,
  type GuardrailDefinitionsParseResult,
  parseGuardrailDefinitions,
} from './definitions-parse';
import type { GuardrailDefinitionWire } from './definitions-wire';

/** Path of the definitions endpoint, appended to `baseUrl`. */
export const GUARDRAIL_DEFINITIONS_PATH = '/api/execution/guardrails/definitions';

export interface GuardrailDefinitionsRequestContext {
  /**
   * Base URL of the agents runtime. Same-origin when omitted. Agents passes `''`; Flow
   * passes its `/{org}/{tenantName}/agents_` prefix.
   */
  baseUrl?: string;
  /** Bearer token, no `Bearer ` prefix. Omit when the host's session already authorizes. */
  token?: string;
  /** Sent as `X-UiPath-Internal-TenantId`; both products send it today. */
  tenantId: string;
  /** Sent as `X-UiPath-Internal-AccountId` when the host scopes by account. */
  accountId?: string;
  /** Merged last, so a host can add or override any header. */
  headers?: Record<string, string>;
  /** Injectable fetch for tests and hosts with an instrumented client. */
  fetch?: typeof fetch;
}

export interface UseGuardrailDefinitionsOptions {
  /**
   * A payload the host already has. When present no request is made at all: the value is
   * parsed and enriched instead. This is the seam that lets each product keep its own
   * transport (Agents' SWR, Flow studio and workbench's react-query, Flow vsix's
   * postMessage, which never fetches).
   */
  definitions?: unknown;
  /**
   * Non-BYO validators to hide. Compared by content, so an inline array literal is fine.
   */
  hiddenValidators?: readonly string[];
  /** Override the lingui-backed copy table, e.g. to pin English in a test. */
  copy?: GuardrailCopyTable;
}

export interface UseGuardrailDefinitionsResult {
  /** Display-ready definitions, ready to hand to `GuardrailBuilder`. */
  definitions: EnrichedGuardrailDefinition[];
  /** The validated wire definitions behind them, for hosts that need the raw fields. */
  wire: GuardrailDefinitionWire[];
  /** Definitions dropped during validation. Surface as a status banner, not an error page. */
  invalid: GuardrailDefinitionParseIssue[];
  /** Set when the payload was not an array at all. */
  inputError?: string;
  loading: boolean;
  /** Transport failure. Validation failures are reported through `invalid`, not here. */
  error: Error | null;
  refetch: () => void;
}

const EMPTY_RESULT: GuardrailDefinitionsParseResult = { definitions: [], invalid: [] };

/** The serializable half of the context: everything that decides what request to make. */
type GuardrailDefinitionsRequest = Omit<GuardrailDefinitionsRequestContext, 'fetch'>;

/**
 * Load the guardrail definitions and resolve their display copy.
 *
 * Deliberately minimal, following `useDiscoveryModels` (the ModelPicker precedent): plain
 * `useState` plus `fetch` plus an `AbortController`, no query library. Hosts that already run
 * SWR or React Query should keep doing so and feed the payload in through
 * `options.definitions` rather than adopting a second cache.
 *
 * Passing `null` as the context disables the hook and clears its state; combined with
 * `options.definitions` that is the pure "enrich what I already have" path.
 *
 * Both the context and `hiddenValidators` are compared by **content**, not identity, so a
 * host can build them inline at the call site. This is a deliberate departure from
 * `useDiscoveryModels`, which depends on context identity: there, an inline object refetches
 * on every render, and since every response sets state the loop never terminates.
 */
export function useGuardrailDefinitions(
  ctx: GuardrailDefinitionsRequestContext | null,
  options: UseGuardrailDefinitionsOptions = {}
): UseGuardrailDefinitionsResult {
  const { definitions: provided, hiddenValidators, copy: copyOverride } = options;

  const linguiCopy = useGuardrailDefinitionCopy();
  const copy = copyOverride ?? linguiCopy;

  // Hosts build this object inline at the call site, so keying the request off its identity
  // would refetch on every render and, because each response sets state, never stop. The
  // request keys off the context's contents instead. `fetch` stays out of the key and is read
  // from a ref: swapping an inline wrapper is not a reason to call the API again.
  const requestKey =
    ctx === null
      ? ''
      : JSON.stringify({
          baseUrl: ctx.baseUrl,
          token: ctx.token,
          tenantId: ctx.tenantId,
          accountId: ctx.accountId,
          headers: ctx.headers,
        });
  const request = useMemo<GuardrailDefinitionsRequest | null>(
    () => (requestKey === '' ? null : (JSON.parse(requestKey) as GuardrailDefinitionsRequest)),
    [requestKey]
  );
  const fetchRef = useRef(ctx?.fetch);
  fetchRef.current = ctx?.fetch;

  // A host-provided payload replaces the request entirely rather than racing it.
  const enabled = provided === undefined && request !== null;

  const [fetched, setFetched] = useState<GuardrailDefinitionsParseResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const load = useCallback(async () => {
    if (request === null) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    const base = (request.baseUrl ?? '').replace(/\/$/, '');
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-UiPath-Internal-TenantId': request.tenantId,
    };
    if (request.token) headers.Authorization = `Bearer ${request.token}`;
    if (request.accountId) headers['X-UiPath-Internal-AccountId'] = request.accountId;
    Object.assign(headers, request.headers);

    // Called through a wrapper rather than as a bare reference so a detached global `fetch`
    // keeps its receiver.
    const doFetch: typeof fetch =
      fetchRef.current ?? ((input, init) => globalThis.fetch(input, init));

    try {
      const response = await doFetch(`${base}${GUARDRAIL_DEFINITIONS_PATH}`, {
        headers,
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`Guardrail definitions API ${response.status} ${response.statusText}`);
      }
      const payload: unknown = await response.json();
      if (!controller.signal.aborted) setFetched(parseGuardrailDefinitions(payload));
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      if (!controller.signal.aborted) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    if (!enabled) {
      // Disabled: abort anything in flight and drop previous results, so a host that
      // switches to its own payload never renders stale data or a stuck spinner.
      abortRef.current?.abort();
      setFetched(EMPTY_RESULT);
      setLoading(false);
      setError(null);
      return undefined;
    }
    load();
    return () => abortRef.current?.abort();
  }, [enabled, load]);

  const parsed = useMemo(
    () => (provided === undefined ? fetched : parseGuardrailDefinitions(provided)),
    [provided, fetched]
  );

  // Round-tripping through a joined key keeps an inline `['prompt_injection']` from
  // re-enriching on every render, without asking hosts to memoize it.
  const hiddenValidatorsKey = (hiddenValidators ?? []).join('\u0000');
  const stableHiddenValidators = useMemo(
    () => (hiddenValidatorsKey === '' ? [] : hiddenValidatorsKey.split('\u0000')),
    [hiddenValidatorsKey]
  );

  const definitions = useMemo(
    () =>
      enrichGuardrailDefinitions(parsed.definitions, {
        copy,
        hiddenValidators: stableHiddenValidators,
      }),
    [parsed.definitions, copy, stableHiddenValidators]
  );

  return {
    definitions,
    wire: parsed.definitions,
    invalid: parsed.invalid,
    inputError: parsed.inputError,
    loading,
    error,
    refetch: load,
  };
}
