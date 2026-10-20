import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import {
  AGENTS_TOOL_CALL_RENDERER,
  ApChat,
  type AutopilotChatMessage,
  AutopilotChatMode,
  AutopilotChatService,
} from '../../index';

let instanceCounter = 0;
const createService = () =>
  AutopilotChatService.Instantiate({
    instanceName: `wind-tool-call-${++instanceCounter}`,
    config: { mode: AutopilotChatMode.FullScreen, renderer: 'wind' },
  });

const START_TIME = '2026-01-01T00:00:00.000Z';
const END_TIME = '2026-01-01T00:00:02.000Z';

const toolCall = (meta: Record<string, unknown>, id = 'tc') => ({
  id,
  content: 'Tool call',
  widget: AGENTS_TOOL_CALL_RENDERER,
  created_at: START_TIME,
  meta: { toolName: 'get_weather', input: { city: 'Bucharest' }, startTime: START_TIME, ...meta },
});

const trace = {
  key: 'root',
  name: 'Tool call - Web_Search',
  data: { id: 'root', status: 'ok', startTime: START_TIME, endTime: END_TIME },
  children: [
    {
      key: 'agent',
      name: 'Agent_run',
      data: { id: 'agent', type: 'agentRun' },
      children: [{ key: 'tool', name: 'Inner tool', data: { id: 'tool', type: 'agentTool' } }],
    },
    { key: 'llm', name: 'Model call', data: { id: 'llm', type: 'llmCall' } },
  ],
};

const messageElement = (id: string) =>
  document.querySelector(`[data-chat-message-id="${id}"]`) as HTMLElement;
const toolCallToggle = () => screen.getByRole('button', { name: /get weather/ });

function setup() {
  const service = createService();
  render(<ApChat chatServiceInstance={service} />);
  return service;
}

describe('Wind tool call renderer', () => {
  it('shows a running call, then how long it ran', () => {
    const service = setup();

    act(() => service.sendResponse(toolCall({})));
    expect(messageElement('tc').querySelector('[data-slot="tool-call"]')).toHaveAttribute(
      'data-status',
      'executing'
    );
    expect(messageElement('tc')).toHaveTextContent("Running 'get weather'");

    act(() =>
      service.sendResponse(toolCall({ output: { tempC: 21 }, isError: false, endTime: END_TIME }))
    );
    expect(messageElement('tc').querySelector('[data-slot="tool-call"]')).toHaveAttribute(
      'data-status',
      'completed'
    );
    expect(messageElement('tc')).toHaveTextContent("Ran 'get weather' for 2.00 seconds");
  });

  it('stays expanded when the tool result replaces the message', async () => {
    const service = setup();
    act(() => service.sendResponse(toolCall({})));

    await userEvent.click(toolCallToggle());
    expect(toolCallToggle()).toHaveAttribute('aria-expanded', 'true');
    const inputToggle = () => within(messageElement('tc')).getByRole('button', { name: 'Input' });
    await userEvent.click(inputToggle());

    // A finished tool call is re-sent under the same id, as a new message object.
    act(() =>
      service.sendResponse(toolCall({ output: { tempC: 21 }, isError: false, endTime: END_TIME }))
    );

    expect(toolCallToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(inputToggle()).toHaveAttribute('aria-expanded', 'true');

    // Closing the card and opening it again keeps the open section, as Material does.
    await userEvent.click(toolCallToggle());
    await userEvent.click(toolCallToggle());
    expect(inputToggle()).toHaveAttribute('aria-expanded', 'true');
    expect(
      within(messageElement('tc')).getByRole('button', { name: 'Output' })
    ).toBeInTheDocument();
  });

  it('shows only the status line for ToolNameOnly', () => {
    const service = setup();
    act(() => service.sendResponse(toolCall({ displayMode: 'ToolNameOnly', output: 'x' })));

    const call = messageElement('tc').querySelector('[data-slot="tool-call"]') as HTMLElement;
    expect(within(call).queryByRole('button')).toBeNull();
    expect(messageElement('tc')).toHaveTextContent("Ran 'get weather'");
  });

  it('renders string values as code and objects as a tree', async () => {
    const service = setup();
    act(() =>
      service.sendResponse(toolCall({ output: 'plain result', isError: false, endTime: END_TIME }))
    );
    await userEvent.click(toolCallToggle());
    const message = messageElement('tc');

    await userEvent.click(within(message).getByRole('button', { name: 'Input' }));
    await userEvent.click(within(message).getByRole('button', { name: 'Output' }));

    const output = message.querySelector('[data-slot="tool-call-output"]') as HTMLElement;
    expect(output.querySelector('[data-slot="code-block"]')).toHaveTextContent('plain result');
    const input = message.querySelector('[data-slot="tool-call-input"]') as HTMLElement;
    expect(input.querySelector('[data-slot="code-block"]')).toBeNull();
    expect(input).toHaveTextContent('Bucharest');
  });

  it('lists the trace for FullTrace only, without model calls, and keeps its open rows', async () => {
    const service = setup();
    act(() =>
      service.sendResponse(
        toolCall(
          { displayMode: 'FullTrace', span: trace, input: undefined, toolName: undefined },
          'ft'
        )
      )
    );
    act(() =>
      service.sendResponse(
        toolCall(
          { displayMode: 'InputsAndOutputs', span: trace, input: undefined, toolName: undefined },
          'io'
        )
      )
    );

    const full = messageElement('ft');
    await userEvent.click(within(full).getByRole('button', { name: /Web Search/ }));
    const traces = within(full).getByRole('button', { name: 'Traces' });
    await userEvent.click(traces);
    const agent = within(within(full).getByRole('tree', { name: 'Traces' })).getByRole('treeitem', {
      name: /Agent run/,
    });
    expect(full).not.toHaveTextContent('Model call');
    await userEvent.click(agent.querySelector('[data-slot="disclosure-tree-row"]') as HTMLElement);
    expect(full).toHaveTextContent('Inner tool');

    // Closing the section unmounts the tree; its open rows come back with it.
    await userEvent.click(traces);
    expect(full).not.toHaveTextContent('Inner tool');
    await userEvent.click(traces);
    expect(full).toHaveTextContent('Inner tool');

    const io = messageElement('io');
    await userEvent.click(within(io).getByRole('button', { name: /Web Search/ }));
    expect(within(io).queryByRole('button', { name: 'Traces' })).toBeNull();
  });

  it('opens on escalation task links and never links an unsafe one', async () => {
    const service = setup();
    act(() =>
      service.sendResponse(
        toolCall(
          {
            input: undefined,
            span: {
              ...trace,
              data: { ...trace.data, attributes: { taskUrl: 'https://a.test/task' } },
              children: [
                {
                  key: 'esc',
                  name: 'Escalation',
                  data: {
                    id: 'esc',
                    status: 'unset',
                    attributes: { taskUrl: 'javascript:alert(1)' },
                  },
                },
              ],
            },
          },
          'esc'
        )
      )
    );

    const message = messageElement('esc');
    await waitFor(() =>
      expect(within(message).getByRole('link', { name: 'https://a.test/task' })).toBeInTheDocument()
    );
    expect(message).toHaveTextContent('javascript:alert(1)');
    expect(message.querySelector('a[href^="javascript"]')).toBeNull();
    expect(within(message).getByRole('img', { name: 'Waiting' })).toBeInTheDocument();
  });

  it('opens on task links once, not again after the reader closes it', async () => {
    const service = setup();
    const escalated = toolCall(
      {
        input: undefined,
        span: { ...trace, data: { ...trace.data, attributes: { taskUrl: 'https://a.test/t' } } },
      },
      'once'
    );
    act(() => service.sendResponse(escalated));
    const toggle = () =>
      within(messageElement('once')).getByRole('button', { name: /get weather/ });
    await waitFor(() => expect(toggle()).toHaveAttribute('aria-expanded', 'true'));

    await userEvent.click(toggle());
    act(() => service.sendResponse({ ...escalated, meta: { ...escalated.meta } }));

    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
  });

  it('shows a failure without input as failed', () => {
    const service = setup();
    act(() => service.sendResponse(toolCall({ input: undefined, output: 'boom', isError: true })));

    expect(messageElement('tc').querySelector('[data-slot="tool-call"]')).toHaveAttribute(
      'data-status',
      'failed'
    );
  });

  it('lets an injected renderer win over the built-in one', () => {
    const service = setup();
    service.injectMessageRenderer({
      name: AGENTS_TOOL_CALL_RENDERER,
      component: ({ message }: { message: AutopilotChatMessage }) => (
        <span data-testid="injected">{message.meta.toolName}</span>
      ),
    });

    act(() => service.sendResponse(toolCall({})));

    expect(screen.getByTestId('injected')).toHaveTextContent('get_weather');
    expect(messageElement('tc').querySelector('[data-slot="tool-call"]')).toBeNull();
  });
});
