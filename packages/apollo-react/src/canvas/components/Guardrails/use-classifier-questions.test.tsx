import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { CLASSIFIER_QUESTIONS_WIRE } from './__fixtures__/classifier-questions.fixtures';
import { useClassifierQuestions } from './use-classifier-questions';

// The request core is `useGuardrailDefinitions`', whose suite pins it; these cover what differs.

const respond = (body: unknown, ok = true) =>
  vi.fn<typeof fetch>(
    async () =>
      ({
        ok,
        status: ok ? 200 : 503,
        statusText: ok ? 'OK' : 'Server Error',
        json: async () => body,
      }) as Response
  );
const ctx = (fetchImpl: typeof fetch) => ({
  baseUrl: 'https://host/agents_',
  tenantId: 't-1',
  fetch: fetchImpl,
});

describe('useClassifierQuestions', () => {
  it('loads the catalog from its endpoint with the headings resolved', async () => {
    const fetchImpl = respond(CLASSIFIER_QUESTIONS_WIRE);

    const { result } = renderHook(() => useClassifierQuestions(ctx(fetchImpl)));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      'https://host/agents_/api/execution/guardrails/classifier-questions'
    );
    expect(result.current.categories.map((c) => c.label)).toEqual([
      'PII',
      'Harmful content',
      'Prompt injection',
      'Intellectual property',
      'Secrets & credentials',
      'Compliance & commitments',
      'Scope & conduct',
    ]);
  });

  it('names its endpoint in a transport error', async () => {
    const { result } = renderHook(() => useClassifierQuestions(ctx(respond(null, false))));

    await waitFor(() =>
      expect(result.current.error?.message).toBe('Classifier questions API 503 Server Error')
    );
  });

  it('takes a catalog the host holds without fetching: raw id for an unknown heading, no nulls', () => {
    const fetchImpl = respond([]);
    const questions = [
      {
        id: 'brand_safety',
        questions: [
          { name: 'q', question: 'Q?', type: 'score', criteriaTrue: null, levels: ['a', 'b'] },
        ],
      },
    ];

    const { result } = renderHook(() => useClassifierQuestions(ctx(fetchImpl), { questions }));

    expect(fetchImpl).not.toHaveBeenCalled();
    expect(result.current.categories).toEqual([
      {
        id: 'brand_safety',
        label: 'brand_safety',
        questions: [{ name: 'q', question: 'Q?', type: 'score', levels: ['a', 'b'] }],
      },
    ]);
  });

  it('stays idle for a null context', () => {
    expect(renderHook(() => useClassifierQuestions(null)).result.current).toMatchObject({
      categories: [],
      loading: false,
      error: null,
    });
  });
});
