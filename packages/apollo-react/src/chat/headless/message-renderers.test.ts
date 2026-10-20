import { describe, expect, it } from 'vitest';

import { AutopilotChatService, DEFAULT_MESSAGE_RENDERER } from '../service';
import { type ChatBuiltInMessageRenderer, resolveMessageRenderer } from './message-renderers';

let instanceCounter = 0;
const createService = () =>
  AutopilotChatService.Instantiate({ instanceName: `message-renderers-test-${++instanceCounter}` });

const Markdown = () => null;
const ToolCall = () => null;
const Custom = () => null;

const builtIns: readonly ChatBuiltInMessageRenderer[] = [
  { name: DEFAULT_MESSAGE_RENDERER, component: Markdown },
  { name: 'tool-call', component: ToolCall },
];

describe('resolveMessageRenderer', () => {
  it('uses the built-in that matches the widget', () => {
    expect(resolveMessageRenderer(createService(), { widget: 'tool-call' }, builtIns)).toEqual({
      kind: 'component',
      component: ToolCall,
    });
  });

  it('falls back to the built-in default for unknown widgets', () => {
    expect(resolveMessageRenderer(createService(), { widget: 'unknown' }, builtIns)).toEqual({
      kind: 'component',
      component: Markdown,
    });
  });

  it('returns undefined when there is no match and no built-in default', () => {
    expect(resolveMessageRenderer(createService(), { widget: 'unknown' }, [])).toBeUndefined();
  });

  it('prefers an injected component over a built-in with the same name', () => {
    const service = createService();
    service.injectMessageRenderer({ name: 'tool-call', component: Custom });

    expect(resolveMessageRenderer(service, { widget: 'tool-call' }, builtIns)).toEqual({
      kind: 'component',
      component: Custom,
    });
  });

  it('defers to renderMessage for an injected DOM renderer', () => {
    const service = createService();
    service.injectMessageRenderer({ name: 'tool-call', render: () => {} });

    expect(resolveMessageRenderer(service, { widget: 'tool-call' }, builtIns)).toEqual({
      kind: 'dom',
    });
  });
});
