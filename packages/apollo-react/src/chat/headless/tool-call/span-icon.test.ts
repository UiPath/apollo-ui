import { describe, expect, it } from 'vitest';

import { getSpanIconSvg } from './span-icon';
import { spanIconsMap } from './span-icons';

describe('getSpanIconSvg', () => {
  it('maps span types, attribute-driven types and functions to icons', () => {
    expect(getSpanIconSvg({ type: 'agentRun' })).toBe(spanIconsMap.get('agent-run'));
    expect(getSpanIconSvg({ type: 'toolCall', attributes: { toolType: 'Agent' } })).toBe(
      spanIconsMap.get('agent-run')
    );
    expect(getSpanIconSvg({ type: 'completion', attributes: { model: 'gpt-4o' } })).toBe(
      spanIconsMap.get('open-ai')
    );
    expect(getSpanIconSvg({ type: 'function_call_sync' })).toBe(spanIconsMap.get('function-span'));
    expect(getSpanIconSvg({ type: 'something-new' })).toBe(spanIconsMap.get('default-trace-item'));
  });

  it('copes with odd attributes', () => {
    expect(getSpanIconSvg({ type: 'completion', attributes: { model: 42 } })).toBe(
      spanIconsMap.get('generic-ai')
    );
    expect(getSpanIconSvg({ type: 'completion', attributes: '{bad' })).toBe(
      spanIconsMap.get('generic-ai')
    );
  });
});
