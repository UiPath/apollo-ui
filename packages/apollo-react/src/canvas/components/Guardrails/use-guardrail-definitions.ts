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
  /** Same-origin when omitted. Flow passes its `/{org}/{tenantName}/agents_` prefix. */
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
   * A payload the host already has. When present no request is made: this is the seam that
   * lets each product keep its own transport (Agents' SWR, Flow's react-query, the vsix's
   * postMessage, which never fetches).
   *
   * Compared by **identity**, unlike the context and `hiddenValidators` - hashing a whole
   * payload every render would cost more than it saves. Pass a stable reference; SWR and
   * react-query results already are. An inline literal re-enriches every render.
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

/** A fetch outcome plus the request key it belongs to. */
interface SettledFetch {
  key: string;
  result: GuardrailDefinitionsParseResult;
  error: Error | null;
}

// A key no real request can produce (`requestKey` is either '' or JSON), so the first
// render of an enabled hook never reads a stale stamp as current.
const NOTHING_SETTLED: SettledFetch = { key: 'none', result: EMPTY_RESULT, error: null };

/** The serializable half of the context: everything that decides what request to make. */
type GuardrailDefinitionsRequest = Omit<GuardrailDefinitionsRequestContext, 'fetch'>;

/**
 * Load the guardrail definitions and resolve their display copy.
 *
 * Deliberately minimal, following `useDiscoveryModels`: `useState` plus `fetch` plus an
 * `AbortController`, no query library. A `null` context disables the hook and clears its
 * state, which with `options.definitions` is the pure "enrich what I already have" path.
 *
 * The context and `hiddenValidators` are compared by **content**, so a host can build them
 * inline. That departs from `useDiscoveryModels`, which keys off context identity: an inline
 * object there refetches every render and, since every response sets state, never settles.
 *
 * A failed request sets `error` and **keeps the previous results**, so a transient 503 on a
 * `refetch` does not empty a list the user is looking at; render on `error` first if you want
 * it to replace the data. Disabling the hook does clear the fetched state.
 */
export function useGuardrailDefinitions(
  ctx: GuardrailDefinitionsRequestContext | null,
  options: UseGuardrailDefinitionsOptions = {}
): UseGuardrailDefinitionsResult {
  const { definitions: provided, hiddenValidators, copy: copyOverride } = options;

  const linguiCopy = useGuardrailDefinitionCopy();
  const copy = copyOverride ?? linguiCopy;

  // Keyed off the context's contents, not its identity: see the note above. `fetch` stays out
  // of the key and is read from a ref, since swapping an inline wrapper is not a reason to
  // call the API again.
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

  // Results are stamped with the request that produced them, and read back only when that
  // stamp still matches. Without it a tenant switch keeps showing the previous tenant's
  // guardrails for the whole in-flight window, and keeps them for good if the new request
  // fails - the "keep previous results" behaviour below is only ever right for a refetch of
  // the *same* request.
  const [settled, setSettled] = useState<SettledFetch>(NOTHING_SETTLED);
  const [inFlight, setInFlight] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const isCurrent = settled.key === requestKey;
  const fetched = isCurrent ? settled.result : EMPTY_RESULT;
  const error = isCurrent ? settled.error : null;

  // Derived rather than a `useState(enabled)` initial value, which is only correct on the very
  // first render: a hook that starts disabled and is later enabled had one frame of
  // `loading: false` with no data, and a `loading ? <Spinner/> : <Empty/>` host flashed the
  // empty state. Anything with no settled result for the current request is loading.
  const loading = enabled && (inFlight || !isCurrent);

  const load = useCallback(async () => {
    // Also the `refetch` we hand back, so it has to respect the disable path: a result would
    // be discarded by `parsed` below anyway. (`enabled` implies `request !== null`; the second
    // check is what narrows the type.)
    if (!enabled || request === null) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    // Captured now so a response is stamped with the request that asked for it, not with
    // whatever the hook is pointed at by the time it lands.
    const key = requestKey;

    setInFlight(true);

    const base = (request.baseUrl ?? '').replace(/\/$/, '');
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'X-UiPath-Internal-TenantId': request.tenantId,
    };
    if (request.token) headers.Authorization = `Bearer ${request.token}`;
    if (request.accountId) headers['X-UiPath-Internal-AccountId'] = request.accountId;
    Object.assign(headers, request.headers);

    // Wrapped rather than passed bare so a detached global `fetch` keeps its receiver.
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
      if (!controller.signal.aborted) {
        setSettled({ key, result: parseGuardrailDefinitions(payload), error: null });
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      if (!controller.signal.aborted) {
        // The previous result is kept only when this is a refetch of the same request; a
        // failure on a *new* request settles as empty, so a failed tenant switch shows an
        // error rather than the tenant the user just left.
        setSettled((prev) => ({
          key,
          result: prev.key === key ? prev.result : EMPTY_RESULT,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      }
    } finally {
      if (!controller.signal.aborted) setInFlight(false);
    }
  }, [enabled, request, requestKey]);

  useEffect(() => {
    if (!enabled) {
      // Only the in-flight flag needs clearing; the results are already unreachable, since
      // their stamp cannot match a disabled hook's request.
      abortRef.current?.abort();
      setInFlight(false);
      return undefined;
    }
    load();
    return () => abortRef.current?.abort();
  }, [enabled, load]);

  const parsed = useMemo(
    () => (provided === undefined ? fetched : parseGuardrailDefinitions(provided)),
    [provided, fetched]
  );

  // A joined key keeps an inline `['prompt_injection']` from re-enriching every render.
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
