import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CLASSIFIER_QUESTIONS_WIRE } from './__fixtures__/classifier-questions.fixtures';
import { GUARDRAIL_COPY_EN } from './definitions-copy';
import { useClassifierQuestions } from './use-classifier-questions';
import type { GuardrailDefinitionsRequestContext } from './use-guardrail-definitions';

// The request core is shared with `useGuardrailDefinitions`, whose suite pins its behaviour
// (content-compared context, tenant switches, refetch, disabling). These cover what differs.

function jsonResponse(body: unknown, init: { ok?: boolean; status?: number } = {}): Response {
  return {
    ok: init.ok ?? true,
    status: init.status ?? 200,
    statusText: init.ok === false ? 'Server Error' : 'OK',
    json: async () => body,
  } as Response;
}

function ctxWith(fetchImpl: typeof fetch): GuardrailDefinitionsRequestContext {
  return {
    baseUrl: 'https://cloud.uipath.com/acme/tenant/agents_',
    tenantId: 't-1',
    fetch: fetchImpl,
  };
}

describe('useClassifierQuestions', () => {
  it('loads the catalog from its own endpoint, headings resolved', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse(CLASSIFIER_QUESTIONS_WIRE));

    const { result } = renderHook(() => useClassifierQuestions(ctxWith(fetchImpl)));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      'https://cloud.uipath.com/acme/tenant/agents_/api/execution/guardrails/classifier-questions'
    );
    expect(fetchImpl.mock.calls[0]?.[1]?.headers).toMatchObject({
      'X-UiPath-Internal-TenantId': 't-1',
    });
    expect(result.current.categories[0]).toMatchObject({ id: 'pii', label: 'PII' });
    expect(result.current.wire).toEqual(CLASSIFIER_QUESTIONS_WIRE);
    expect(result.current.error).toBeNull();
  });

  it('names its endpoint in a transport error, and does not throw', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () =>
      jsonResponse(null, { ok: false, status: 503 })
    );

    const { result } = renderHook(() => useClassifierQuestions(ctxWith(fetchImpl)));

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('Classifier questions API 503 Server Error');
    expect(result.current.categories).toEqual([]);
  });

  it('reports a malformed catalog through invalid and inputError, not error', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => jsonResponse({ groups: [] }));

    const { result } = renderHook(() => useClassifierQuestions(ctxWith(fetchImpl)));

    await waitFor(() => expect(result.current.inputError).toBeDefined());
    expect(result.current.error).toBeNull();
  });

  it('parses a catalog the host already holds without fetching', () => {
    const fetchImpl = vi.fn<typeof fetch>();

    const { result } = renderHook(() =>
      useClassifierQuestions(ctxWith(fetchImpl), { questions: CLASSIFIER_QUESTIONS_WIRE })
    );

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.categories).toHaveLength(7);
  });

  it('stays idle for a null context, or while the host says it may not fetch', () => {
    const fetchImpl = vi.fn<typeof fetch>();

    const idle = renderHook(() => useClassifierQuestions(null));
    const held = renderHook(() => useClassifierQuestions(ctxWith(fetchImpl), { enabled: false }));

    expect(idle.result.current).toMatchObject({ categories: [], loading: false, error: null });
    expect(held.result.current).toMatchObject({ categories: [], loading: false, error: null });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('takes its headings from an override table', () => {
    const copy = {
      ...GUARDRAIL_COPY_EN,
      classifier: {
        displayName: 'Classifier',
        description: '',
        paramLabels: {},
        categoryLabels: { pii: 'Personal data' },
      },
    };

    const { result } = renderHook(() =>
      useClassifierQuestions(null, { questions: CLASSIFIER_QUESTIONS_WIRE, copy })
    );

    expect(result.current.categories[0]?.label).toBe('Personal data');
  });
});
