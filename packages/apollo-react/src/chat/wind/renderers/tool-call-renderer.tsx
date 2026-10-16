import {
  CodeBlock,
  ToolCall,
  ToolCallContent,
  ToolCallError,
  ToolCallHeader,
  ToolCallInput,
  ToolCallOutput,
  type ToolCallRenderValue,
  ToolCallSection,
  type ToolCallStatus,
} from '@uipath/apollo-wind';
import { CircleAlert, CircleCheck } from 'lucide-react';
import React from 'react';

import { getSpanIconSvg } from '../../headless/tool-call/span-icon';
import {
  getTaskUrls,
  getToolCallDurationSeconds,
  getToolCallName,
  getToolCallState,
  getToolCallValues,
  getVisibleTraceChildren,
  type ToolCallInfo,
  type ToolCallSpanNode,
  type ToolCallState,
} from '../../headless/tool-call/tool-call-model';
import { isOpenableUrl } from '../../headless/utils/openable-url';
import type { AutopilotChatMessage } from '../../service';
import {
  DisclosureTree,
  type DisclosureTreeItem,
  type DisclosureTreeOpenState,
} from './disclosure-tree';
import { useToolCallStrings } from './tool-call-strings';

// Material shows no icon when nothing says how the call went, but its line reads "Ran", so the
// finished status is the closest.
const STATUS: Record<NonNullable<ToolCallState> | 'unknown', ToolCallStatus> = {
  loading: 'executing',
  error: 'failed',
  success: 'completed',
  unknown: 'completed',
};

// Strings render as a code block, objects keep the primitive's JSON tree.
const renderValue: ToolCallRenderValue = (value) =>
  typeof value === 'string' ? <CodeBlock code={value} wrap hideHeader /> : undefined;

// Built level by level as rows open, so a large trace costs nothing until someone looks.
function toTraceItems(nodes: readonly ToolCallSpanNode[]): DisclosureTreeItem[] {
  return nodes.map((node) => {
    const children = getVisibleTraceChildren(node);
    const icon = getSpanIconSvg(node.data);
    return {
      id: node.key,
      label: node.name.replace('_', ' '),
      // The icons are the package's own SVG strings, not message content.
      // biome-ignore lint/security/noDangerouslySetInnerHtml: static, trusted SVG markup
      icon: icon ? <span dangerouslySetInnerHTML={{ __html: icon }} /> : undefined,
      expandable: children.length > 0,
      children: () => toTraceItems(children),
    };
  });
}

/** The top trace rows, built only while the Traces section is open. */
function TraceList({
  span,
  openState,
}: {
  span: ToolCallSpanNode;
  openState: DisclosureTreeOpenState;
}) {
  const items = React.useMemo(() => toTraceItems(getVisibleTraceChildren(span)), [span]);
  return <DisclosureTree items={items} openState={openState} />;
}

type Section = 'input' | 'traces' | 'escalation' | 'errors' | 'output';

// As in Material: sections start closed except the escalation links.
const INITIAL_SECTIONS: Record<Section, boolean> = {
  input: false,
  traces: false,
  escalation: true,
  errors: false,
  output: false,
};

/**
 * An agent tool call message (`AGENTS_TOOL_CALL_RENDERER`) on apollo-wind's `ToolCall`, read the
 * way Material's `ApToolCall` reads it. `ToolNameOnly` shows the status line alone. Which parts
 * are open is held here, as in Material, so it survives closing the card and the result
 * replacing the message.
 */
function ToolCallMessageRendererComponent({ message }: { message: AutopilotChatMessage }) {
  const info: ToolCallInfo = message.meta ?? {};
  const { span, toolName, input, output, isError, startTime, endTime, displayMode } = info;
  const strings = useToolCallStrings();
  const taskUrls = React.useMemo(() => getTaskUrls(span), [span]);
  const [open, setOpen] = React.useState(false);
  const [sections, setSections] = React.useState(INITIAL_SECTIONS);
  const [openTraceRows, setOpenTraceRows] = React.useState<ReadonlySet<string>>(() => new Set());
  const traceOpenState = React.useMemo<DisclosureTreeOpenState>(
    () => ({
      isOpen: (id) => openTraceRows.has(id),
      setOpen: (id, next) =>
        setOpenTraceRows((previous) => {
          const updated = new Set(previous);
          if (next) updated.add(id);
          else updated.delete(id);
          return updated;
        }),
    }),
    [openTraceRows]
  );
  const sectionProps = (section: Section) => ({
    open: sections[section],
    onOpenChange: (next: boolean) => setSections((previous) => ({ ...previous, [section]: next })),
  });

  // As in Material, a call waiting on people opens so the task links show; only the first time,
  // so a re-send does not reopen a card the reader closed.
  const autoOpened = React.useRef(false);
  React.useEffect(() => {
    if (taskUrls.length > 0 && !autoOpened.current) {
      autoOpened.current = true;
      setOpen(true);
    }
  }, [taskUrls]);

  if (!span && !input && !toolName) {
    return null;
  }

  // A failure without input is still a failure, not the unknown "Ran" case.
  const state = getToolCallState({ input, output, isError, span }) ?? (isError ? 'error' : null);
  const values = getToolCallValues({ input, output, isError, span });
  const showTraces = displayMode === 'FullTrace' && !!span?.children?.length;

  return (
    <ToolCall
      status={STATUS[state ?? 'unknown']}
      open={open}
      onOpenChange={setOpen}
      strings={strings.toolCall}
      jsonTreeStrings={strings.jsonTree}
      className="px-0"
    >
      <ToolCallHeader
        name={getToolCallName({ toolName, span })}
        duration={strings.seconds(getToolCallDurationSeconds({ startTime, endTime, span }))}
      />
      {displayMode !== 'ToolNameOnly' && (
        <ToolCallContent>
          <ToolCallInput
            value={values.input}
            renderValue={renderValue}
            {...sectionProps('input')}
          />
          {showTraces && span && (
            <ToolCallSection
              data-slot="wind-chat-tool-call-traces"
              title={strings.traces}
              {...sectionProps('traces')}
            >
              <TraceList span={span} openState={traceOpenState} />
            </ToolCallSection>
          )}
          {taskUrls.length > 0 && (
            <ToolCallSection
              data-slot="wind-chat-tool-call-escalation"
              title={strings.escalation}
              {...sectionProps('escalation')}
            >
              <ul className="my-2 flex flex-col gap-1">
                {taskUrls.map(({ taskUrl, status }, index) => (
                  // A parent and a child span can carry the same link.
                  <li key={`${index}-${taskUrl}`} className="flex min-w-0 items-center gap-2">
                    {isOpenableUrl(taskUrl) ? (
                      <a
                        href={taskUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 truncate text-foreground-link hover:underline"
                      >
                        {taskUrl}
                      </a>
                    ) : (
                      <span className="min-w-0 truncate">{taskUrl}</span>
                    )}
                    {status === 'unset' ? (
                      <CircleAlert
                        role="img"
                        aria-label={strings.taskWaiting}
                        className="size-4 shrink-0 text-warning"
                      />
                    ) : (
                      <CircleCheck
                        role="img"
                        aria-label={strings.taskCompleted}
                        className="size-4 shrink-0 text-success"
                      />
                    )}
                  </li>
                ))}
              </ul>
            </ToolCallSection>
          )}
          <ToolCallError
            value={values.error}
            renderValue={renderValue}
            {...sectionProps('errors')}
          />
          <ToolCallOutput
            value={values.output}
            renderValue={renderValue}
            {...sectionProps('output')}
          />
        </ToolCallContent>
      )}
    </ToolCall>
  );
}

export const ToolCallMessageRenderer = React.memo(ToolCallMessageRendererComponent);
