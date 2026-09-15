import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ALL_BUILT_IN_WIRE,
  BYO_WIRE,
  PII_DETECTION_WIRE,
  PROMPT_INJECTION_WIRE,
  RAW_PAYLOAD_WITH_NOISE,
} from './__fixtures__/definitions-wire.fixtures';
import { GUARDRAIL_COPY_EN, type GuardrailCopyTable } from './definitions-copy';
import {
  type GuardrailDefinitionsRequestContext,
  useGuardrailDefinitions,
} from './use-guardrail-definitions';

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.ok === false ? 'Server Error' : 'OK',
    json: async () => body,
  } as Response;
}

function ctxWith(
  fetchImpl: typeof fetch,
  overrides: Partial<GuardrailDefinitionsRequestContext> = {}
) {
  return {
    baseUrl: 'https://cloud.uipath.com/acme/tenant/agents_',
    tenantId: 'tenant-1',
    fetch: fetchImpl,
    ...overrides,
  } satisfies GuardrailDefinitionsRequestContext;
}

describe('useGuardrailDefinitions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('fetching', () => {
    it('loads, validates and enriches in one pass', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse(ALL_BUILT_IN_WIRE));

      const { result } = renderHook(() => useGuardrailDefinitions(ctxWith(fetchImpl)));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.definitions.map((d) => d.displayName)).toContain('PII detection');
      expect(result.current.wire).toHaveLength(ALL_BUILT_IN_WIRE.length);
      expect(result.current.error).toBeNull();
    });

    it('calls the definitions endpoint under the host base URL', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([]));

      renderHook(() => useGuardrailDefinitions(ctxWith(fetchImpl)));

      await waitFor(() => expect(fetchImpl).toHaveBeenCalled());
      expect(fetchImpl.mock.calls[0]?.[0]).toBe(
        'https://cloud.uipath.com/acme/tenant/agents_/api/execution/guardrails/definitions'
      );
    });

    it('trims a trailing slash off the base URL', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([]));

      renderHook(() =>
        useGuardrailDefinitions(ctxWith(fetchImpl, { baseUrl: 'https://example.test/' }))
      );

      await waitFor(() => expect(fetchImpl).toHaveBeenCalled());
      expect(fetchImpl.mock.calls[0]?.[0]).toBe(
        'https://example.test/api/execution/guardrails/definitions'
      );
    });

    it('sends the tenant header both products already send', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([]));

      renderHook(() =>
        useGuardrailDefinitions(
          ctxWith(fetchImpl, { token: 'jwt', accountId: 'acct-1', headers: { 'X-Extra': '1' } })
        )
      );

      await waitFor(() => expect(fetchImpl).toHaveBeenCalled());
      expect(fetchImpl.mock.calls[0]?.[1]?.headers).toEqual({
        Accept: 'application/json',
        Authorization: 'Bearer jwt',
        'X-UiPath-Internal-TenantId': 'tenant-1',
        'X-UiPath-Internal-AccountId': 'acct-1',
        'X-Extra': '1',
      });
    });

    it('omits the auth header when the host relies on its session', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([]));

      renderHook(() => useGuardrailDefinitions(ctxWith(fetchImpl)));

      await waitFor(() => expect(fetchImpl).toHaveBeenCalled());
      expect(fetchImpl.mock.calls[0]?.[1]?.headers).not.toHaveProperty('Authorization');
    });

    it('surfaces a transport failure without throwing', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () =>
        jsonResponse(null, { ok: false, status: 503 })
      );

      const { result } = renderHook(() => useGuardrailDefinitions(ctxWith(fetchImpl)));

      await waitFor(() => expect(result.current.error).not.toBeNull());
      expect(result.current.error?.message).toMatch(/503/);
      expect(result.current.definitions).toEqual([]);
      expect(result.current.loading).toBe(false);
    });

    it('surfaces a rejected request as an error', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => {
        throw new Error('offline');
      });

      const { result } = renderHook(() => useGuardrailDefinitions(ctxWith(fetchImpl)));

      await waitFor(() => expect(result.current.error?.message).toBe('offline'));
    });

    it('reports malformed definitions through `invalid`, not `error`', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse(RAW_PAYLOAD_WITH_NOISE));

      const { result } = renderHook(() => useGuardrailDefinitions(ctxWith(fetchImpl)));

      await waitFor(() => expect(result.current.loading).toBe(false));
      expect(result.current.error).toBeNull();
      expect(result.current.invalid).toHaveLength(1);
      expect(result.current.definitions).toHaveLength(2);
    });

    it('reports a non-array payload through `inputError`', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse({ items: [] }));

      const { result } = renderHook(() => useGuardrailDefinitions(ctxWith(fetchImpl)));

      await waitFor(() => expect(result.current.inputError).toBeDefined());
      expect(result.current.error).toBeNull();
    });

    it('refetches on demand', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([PII_DETECTION_WIRE]));
      const { result } = renderHook(() => useGuardrailDefinitions(ctxWith(fetchImpl)));
      await waitFor(() => expect(result.current.loading).toBe(false));

      result.current.refetch();

      await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
    });

    it('fetches once for a context rebuilt inline on every render', async () => {
      // Regression: keying the effect off context identity made every response set state,
      // which rerendered, which built a new context, which fetched again, without end.
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([PII_DETECTION_WIRE]));

      const { result, rerender } = renderHook(() => useGuardrailDefinitions(ctxWith(fetchImpl)));
      await waitFor(() => expect(result.current.definitions).toHaveLength(1));
      rerender();
      rerender();

      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it('refetches when the context contents actually change', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([]));
      const { rerender } = renderHook(
        ({ tenantId }: { tenantId: string }) =>
          useGuardrailDefinitions(ctxWith(fetchImpl, { tenantId })),
        { initialProps: { tenantId: 'tenant-1' } }
      );
      await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(1));

      rerender({ tenantId: 'tenant-2' });

      await waitFor(() => expect(fetchImpl).toHaveBeenCalledTimes(2));
      expect(fetchImpl.mock.calls[1]?.[1]?.headers).toMatchObject({
        'X-UiPath-Internal-TenantId': 'tenant-2',
      });
    });

    it('reports loading on the very first render, before the effect runs', () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([]));

      const { result } = renderHook(() => useGuardrailDefinitions(ctxWith(fetchImpl)));

      // A host rendering `loading ? <Spinner/> : <Empty/>` would otherwise flash the empty
      // state for one paint, since the effect that sets `loading` runs after it.
      expect(result.current.loading).toBe(true);
    });

    it('aborts the in-flight request on unmount', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([]));
      const { unmount } = renderHook(() => useGuardrailDefinitions(ctxWith(fetchImpl)));
      await waitFor(() => expect(fetchImpl).toHaveBeenCalled());
      const signal = fetchImpl.mock.calls[0]?.[1]?.signal;

      unmount();

      expect(signal?.aborted).toBe(true);
    });
  });

  describe('disabled', () => {
    it('makes no request for a null context', () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([]));

      const { result } = renderHook(() =>
        useGuardrailDefinitions(null, { copy: GUARDRAIL_COPY_EN })
      );

      expect(fetchImpl).not.toHaveBeenCalled();
      expect(result.current).toMatchObject({ definitions: [], loading: false, error: null });
    });

    it('clears previous results when the host disables it', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([PII_DETECTION_WIRE]));
      const ctx = ctxWith(fetchImpl);
      const { result, rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) => useGuardrailDefinitions(enabled ? ctx : null),
        { initialProps: { enabled: true } }
      );
      await waitFor(() => expect(result.current.definitions).toHaveLength(1));

      rerender({ enabled: false });

      // A stale list behind a disabled picker is worse than an empty one.
      expect(result.current.definitions).toEqual([]);
    });

    it('makes `refetch` a no-op while disabled', async () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([BYO_WIRE]));

      // Enabled transport, but a host payload supplied: a request here would be answered and
      // then discarded, since `definitions` wins over the fetched state.
      const { result } = renderHook(() =>
        useGuardrailDefinitions(ctxWith(fetchImpl), { definitions: [PII_DETECTION_WIRE] })
      );
      result.current.refetch();
      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(fetchImpl).not.toHaveBeenCalled();
      expect(result.current.definitions[0]?.displayName).toBe('PII detection');
    });
  });

  describe('definitions override', () => {
    it('parses and enriches a host-supplied payload without fetching', () => {
      const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse([]));

      const { result } = renderHook(() =>
        useGuardrailDefinitions(ctxWith(fetchImpl), { definitions: [PII_DETECTION_WIRE] })
      );

      expect(fetchImpl).not.toHaveBeenCalled();
      expect(result.current.definitions[0]?.displayName).toBe('PII detection');
      expect(result.current.loading).toBe(false);
    });

    it('works with a null context, the Flow vsix shape', () => {
      const { result } = renderHook(() =>
        useGuardrailDefinitions(null, { definitions: [BYO_WIRE] })
      );

      expect(result.current.definitions[0]?.displayName).toBe('Acme PII scan');
    });

    it('reports a malformed host payload the same way a fetched one is reported', () => {
      const { result } = renderHook(() =>
        useGuardrailDefinitions(null, { definitions: 'not an array' })
      );

      expect(result.current.inputError).toMatch(/Expected an array/);
      expect(result.current.definitions).toEqual([]);
    });
  });

  describe('options', () => {
    it('hides the validators the host names', () => {
      const { result } = renderHook(() =>
        useGuardrailDefinitions(null, {
          definitions: [PROMPT_INJECTION_WIRE, PII_DETECTION_WIRE],
          hiddenValidators: ['prompt_injection'],
        })
      );

      expect(result.current.definitions.map((d) => d.validator)).toEqual(['pii_detection']);
      // `wire` stays complete: hiding is a display decision, not a data one.
      expect(result.current.wire).toHaveLength(2);
    });

    it('compares hiddenValidators by content, so an inline array does not churn', () => {
      // `definitions` is held stable here so the only inline value under test is
      // `hiddenValidators`; re-enriching on every render would make the returned array a new
      // reference each time and rerender every consumer downstream.
      const definitions = [PII_DETECTION_WIRE];
      const { result, rerender } = renderHook(() =>
        useGuardrailDefinitions(null, { definitions, hiddenValidators: ['prompt_injection'] })
      );
      const first = result.current.definitions;

      rerender();

      expect(result.current.definitions).toBe(first);
    });

    it('resolves copy from an override table', () => {
      const copy: GuardrailCopyTable = {
        pii_detection: {
          displayName: 'Datenschutz',
          description: 'Beschreibung',
          paramLabels: {},
        },
      };

      const { result } = renderHook(() =>
        useGuardrailDefinitions(null, { definitions: [PII_DETECTION_WIRE], copy })
      );

      expect(result.current.definitions[0]?.displayName).toBe('Datenschutz');
    });
  });
});
