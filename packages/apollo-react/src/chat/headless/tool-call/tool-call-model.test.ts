import { describe, expect, it } from 'vitest';

import {
  getSpanAttributes,
  getTaskUrls,
  getToolCallDurationSeconds,
  getToolCallName,
  getToolCallState,
  getToolCallValues,
  getVisibleTraceChildren,
  type ToolCallSpanNode,
} from './tool-call-model';

const node = (
  id: string,
  data: Partial<ToolCallSpanNode['data']> = {},
  children?: ToolCallSpanNode[]
): ToolCallSpanNode => ({ key: id, name: id, data: { id, ...data }, children });

describe('tool call model', () => {
  it('reads the state from input and output first', () => {
    expect(getToolCallState({ input: { q: 1 } })).toBe('loading');
    expect(getToolCallState({ input: { q: 1 }, output: 'ok' })).toBe('success');
    expect(getToolCallState({ input: { q: 1 }, isError: true })).toBe('error');
    expect(getToolCallState({ input: { q: 1 }, isError: false })).toBe('success');
  });

  it('reads the state from the span tree otherwise', () => {
    expect(getToolCallState({ span: node('a', { status: 'unset' }) })).toBe('loading');
    expect(getToolCallState({ span: node('a', { status: 'ok' }) })).toBe('success');
    expect(
      getToolCallState({
        span: node('a', { status: 'ok' }, [node('b', {}, [node('c', { status: 'error' })])]),
      })
    ).toBe('error');
    expect(getToolCallState({ toolName: 'x' })).toBeNull();
  });

  it('names the tool and times the call as Material does', () => {
    expect(getToolCallName({ toolName: 'get_weather_now' })).toBe('get weather now');
    expect(getToolCallName({ span: node('a', {}, []) })).toBe('a');
    expect(getToolCallName({ span: { ...node('a'), name: 'Tool call - Web_Search' } })).toBe(
      'Web Search'
    );
    expect(getToolCallName({})).toBe('tool');
    expect(
      getToolCallDurationSeconds({
        startTime: '2026-01-01T00:00:00.000Z',
        endTime: '2026-01-01T00:00:02.500Z',
      })
    ).toBe(2.5);
    expect(getToolCallDurationSeconds({})).toBe(0);
  });

  it('collects task links from the span and its descendants, string attributes included', () => {
    const span = node('root', { attributes: { taskUrl: 'https://a.test/1' }, status: 'ok' }, [
      node('child', {
        attributes: JSON.stringify({ taskUrl: 'https://a.test/2' }),
        status: 'unset',
      }),
    ]);

    expect(getTaskUrls(span)).toEqual([
      { taskUrl: 'https://a.test/1', status: 'ok' },
      { taskUrl: 'https://a.test/2', status: 'unset' },
    ]);
    expect(getTaskUrls(undefined)).toEqual([]);
  });

  it('takes section values from the message, then from the span attributes', () => {
    expect(getToolCallValues({ input: { q: 1 }, output: 'done', isError: false })).toEqual({
      input: { q: 1 },
      error: undefined,
      output: 'done',
    });
    expect(getToolCallValues({ input: { q: 1 }, output: 'boom', isError: true })).toEqual({
      input: { q: 1 },
      error: 'boom',
      output: undefined,
    });
    expect(
      getToolCallValues({
        span: node('a', { attributes: { arguments: { q: 2 }, result: { r: 1 }, error: 'e' } }),
      })
    ).toEqual({ input: { q: 2 }, error: 'e', output: { r: 1 } });
  });

  it('leaves model calls and agent output out of the traces', () => {
    const span = node('root', {}, [
      node('tool', { type: 'agentTool' }),
      node('llm', { type: 'llmCall' }),
      node('out', { type: 'agentOutput' }),
    ]);

    expect(getVisibleTraceChildren(span).map((child) => child.key)).toEqual(['tool']);
  });

  it('treats malformed string attributes as none, and ignores non-string task links', () => {
    expect(getSpanAttributes({ attributes: '{bad' })).toEqual({});
    expect(getTaskUrls(node('a', { attributes: '{bad' }))).toEqual([]);
    expect(getTaskUrls(node('a', { attributes: { taskUrl: 42 } }))).toEqual([]);
  });

  it('lets input and output decide over a span that failed', () => {
    expect(
      getToolCallState({ input: { q: 1 }, output: 'ok', span: node('a', { status: 'error' }) })
    ).toBe('success');
  });

  it('has no state for isError without input or span; the renderer decides', () => {
    expect(getToolCallState({ toolName: 'x', isError: true })).toBeNull();
  });
});
