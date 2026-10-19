import { useMemo } from 'react';
import { type GuardrailCopyTable, useGuardrailDefinitionCopy } from './definitions-copy';
import { type EnrichedGuardrailDefinition, enrichGuardrailDefinitions } from './definitions-enrich';
import {
  type GuardrailDefinitionParseIssue,
  type GuardrailDefinitionsParseResult,
  parseGuardrailDefinitions,
} from './definitions-parse';
import type { GuardrailDefinitionWire } from './definitions-wire';
import {
  type GuardrailDefinitionsRequestContext,
  useGuardrailsRequest,
} from './use-guardrails-request';

export type { GuardrailDefinitionsRequestContext } from './use-guardrails-request';

/** Path of the definitions endpoint, appended to `baseUrl`. */
export const GUARDRAIL_DEFINITIONS_PATH = '/api/execution/guardrails/definitions';

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
  /**
   * Override the lingui-backed copy table, e.g. to pin English in a test.
   *
   * Compared by **identity**, like `definitions`: an inline table re-enriches every render.
   */
  copy?: GuardrailCopyTable;
  /**
   * Whether the hook may fetch. Defaults to `true`.
   *
   * `definitions: undefined` cannot say which of two things the host means - "you fetch
   * this" or "mine has not resolved yet" - and the hook used to read it as the first, so a
   * host wiring `definitions: swr.data` fired a second request through the whole of SWR's
   * loading window. Say it explicitly instead: `enabled: !swr.isLoading`. A disabled hook
   * makes no request and reports neither results nor error, exactly like a `null` context.
   */
  enabled?: boolean;
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

/**
 * Load the guardrail definitions and resolve their display copy.
 *
 * Deliberately minimal, following `useDiscoveryModels`: `useState` plus `fetch` plus an
 * `AbortController`, no query library. A `null` context disables the hook and clears its
 * state, which with `options.definitions` is the pure "enrich what I already have" path.
 *
 * Three things disable it, and all three clear its fetched state: a `null` context,
 * `options.definitions`, and `options.enabled: false`. A host whose own payload arrives
 * asynchronously wants the last of those while it waits, or the hook treats the gap as its
 * own cue to fetch.
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
  const {
    definitions: provided,
    hiddenValidators,
    copy: copyOverride,
    enabled: enabledOption = true,
  } = options;

  const linguiCopy = useGuardrailDefinitionCopy();
  const copy = copyOverride ?? linguiCopy;

  // A host-provided payload replaces the request entirely rather than racing it, and
  // `enabled: false` covers the window before that payload exists.
  const {
    data: fetched,
    loading,
    error,
    refetch,
  } = useGuardrailsRequest(ctx, {
    path: GUARDRAIL_DEFINITIONS_PATH,
    endpointName: 'Guardrail definitions',
    parse: parseGuardrailDefinitions,
    empty: EMPTY_RESULT,
    enabled: enabledOption && provided === undefined,
  });

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
    refetch,
  };
}
