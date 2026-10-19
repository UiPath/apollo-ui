import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

/** Where and as whom to call the guardrails endpoints. */
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

interface GuardrailsRequestOptions<T> {
  path: string;
  /** Names the endpoint in a transport error. */
  endpointName: string;
  /** Never throws; a stable reference, as is `empty`. */
  parse: (payload: unknown) => T;
  empty: T;
  enabled: boolean;
}

/** A fetch outcome plus the request key it belongs to. */
interface Settled<T> {
  key: string;
  data: T;
  error: Error | null;
}

// A key no real request can produce (`requestKey` is either '' or JSON), so the first
// render of an enabled hook never reads a stale stamp as current.
const NOTHING_SETTLED_KEY = 'none';

/** The serializable half of the context: everything that decides what request to make. */
type GuardrailsRequest = Omit<GuardrailDefinitionsRequestContext, 'fetch'>;

/**
 * The request core `useGuardrailDefinitions` and `useClassifierQuestions` share; they differ in
 * path and parser. Behaviour is documented on, and tested through, `useGuardrailDefinitions`.
 */
export function useGuardrailsRequest<T>(
  ctx: GuardrailDefinitionsRequestContext | null,
  { path, endpointName, parse, empty, enabled: enabledOption }: GuardrailsRequestOptions<T>
): { data: T; loading: boolean; error: Error | null; refetch: () => void } {
  // Keyed off the context's contents, not its identity (see `useGuardrailDefinitions`). `fetch` stays out
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
  const request = useMemo<GuardrailsRequest | null>(
    () => (requestKey === '' ? null : (JSON.parse(requestKey) as GuardrailsRequest)),
    [requestKey]
  );
  const fetchRef = useRef(ctx?.fetch);
  fetchRef.current = ctx?.fetch;

  const enabled = enabledOption && request !== null;

  const nothingSettled = useMemo<Settled<T>>(
    () => ({ key: NOTHING_SETTLED_KEY, data: empty, error: null }),
    [empty]
  );

  // Results are stamped with the request that produced them, and read back only when that
  // stamp still matches. Without it a tenant switch keeps showing the previous tenant's
  // results for the whole in-flight window, and keeps them for good if the new request
  // fails - the "keep previous results" behaviour below is only ever right for a refetch of
  // the *same* request.
  const [settled, setSettled] = useState<Settled<T>>(nothingSettled);
  const [inFlight, setInFlight] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Gated on `enabled`, not on the stamp alone: the stamp is built from the context, so
  // disabling through the caller's own flag leaves it matching and a settled result - in
  // practice a settled *error* - stayed readable behind a hook that is no longer fetching.
  const isCurrent = enabled && settled.key === requestKey;
  const data = isCurrent ? settled.data : empty;
  const error = isCurrent ? settled.error : null;

  // Derived rather than a `useState(enabled)` initial value, which is only correct on the very
  // first render: a hook that starts disabled and is later enabled had one frame of
  // `loading: false` with no data, and a `loading ? <Spinner/> : <Empty/>` host flashed the
  // empty state. Anything with no settled result for the current request is loading.
  const loading = enabled && (inFlight || !isCurrent);

  const load = useCallback(async () => {
    // Also the `refetch` we hand back, so it has to respect the disable path. (`enabled`
    // implies `request !== null`; the second check is what narrows the type.)
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
      const response = await doFetch(`${base}${path}`, {
        headers,
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`${endpointName} API ${response.status} ${response.statusText}`);
      }
      const payload: unknown = await response.json();
      if (!controller.signal.aborted) {
        setSettled({ key, data: parse(payload), error: null });
      }
    } catch (err: unknown) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      if (!controller.signal.aborted) {
        // The previous result is kept only when this is a refetch of the same request; a
        // failure on a *new* request settles as empty, so a failed tenant switch shows an
        // error rather than the tenant the user just left.
        setSettled((prev) => ({
          key,
          data: prev.key === key ? prev.data : empty,
          error: err instanceof Error ? err : new Error(String(err)),
        }));
      }
    } finally {
      if (!controller.signal.aborted) setInFlight(false);
    }
  }, [enabled, request, requestKey, path, endpointName, parse, empty]);

  useEffect(() => {
    if (!enabled) {
      abortRef.current?.abort();
      setInFlight(false);
      // Cleared, not merely made unreachable by the `enabled` gate on `isCurrent`. A hook
      // disabled through the caller's flag keeps its context, so re-enabling it matches the
      // old stamp again: the previous result would reappear with `loading: false` before the
      // fresh request lands, and the same-key branch in `load` would then keep it for good if
      // that request failed.
      setSettled((prev) => (prev === nothingSettled ? prev : nothingSettled));
      return undefined;
    }
    load();
    return () => abortRef.current?.abort();
  }, [enabled, load, nothingSettled]);

  return { data, loading, error, refetch: load };
}
