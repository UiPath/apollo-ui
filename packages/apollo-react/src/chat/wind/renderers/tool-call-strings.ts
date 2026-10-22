import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import type { JsonTreeViewStrings, ToolCallStrings } from '@uipath/apollo-wind';
import React from 'react';

export interface WindToolCallStrings {
  toolCall: Partial<ToolCallStrings>;
  /** The read-only parts of the JSON tree the tool call values use. */
  jsonTree: Partial<JsonTreeViewStrings>;
  traces: string;
  escalation: string;
  taskWaiting: string;
  taskCompleted: string;
  /** "1.23 seconds", as Material formats the duration. */
  seconds: (seconds: number) => string;
}

// Apostrophes are doubled: in ICU messages a single one starts a quoted literal.
export function useToolCallStrings(): WindToolCallStrings {
  const { _ } = useLingui();

  return React.useMemo(
    () => ({
      toolCall: {
        pending: _(msg({ id: 'autopilot-chat.tool-call.pending', message: `Pending` })),
        executing: _(msg({ id: 'autopilot-chat.tool-call.executing', message: `Running` })),
        completed: _(msg({ id: 'autopilot-chat.tool-call.completed', message: `Completed` })),
        failed: _(msg({ id: 'autopilot-chat.tool-call.failed', message: `Failed` })),
        running: (name) =>
          _(msg({ id: 'autopilot-chat.tool-call.running', message: `Running ''${name}''` })),
        ran: (name, duration = '') =>
          _(
            msg({ id: 'autopilot-chat.tool-call.ran', message: `Ran ''${name}'' for ${duration}` })
          ),
        input: _(msg({ id: 'autopilot-chat.tool-call.input', message: `Input` })),
        output: _(msg({ id: 'autopilot-chat.tool-call.output', message: `Output` })),
        errors: _(msg({ id: 'autopilot-chat.tool-call.errors', message: `Errors` })),
      },
      jsonTree: {
        arrayItem: _(msg({ id: 'autopilot-chat.tool-call.json.array-item', message: `item` })),
        expandKey: (key) =>
          _(msg({ id: 'autopilot-chat.tool-call.json.expand', message: `Expand ${key}` })),
        collapseKey: (key) =>
          _(msg({ id: 'autopilot-chat.tool-call.json.collapse', message: `Collapse ${key}` })),
        itemCount: (count) =>
          _(
            msg({
              id: 'autopilot-chat.tool-call.json.item-count',
              message: `Items: ${count}`,
            })
          ),
        keyCount: (count) =>
          _(
            msg({
              id: 'autopilot-chat.tool-call.json.key-count',
              message: `Keys: ${count}`,
            })
          ),
        pathCopied: _(
          msg({ id: 'autopilot-chat.tool-call.json.path-copied', message: `Path copied` })
        ),
        copyPathHint: _(
          msg({
            id: 'autopilot-chat.tool-call.json.copy-path-hint',
            message: `Click to copy this path`,
          })
        ),
        copyPathFor: (path) =>
          _(
            msg({
              id: 'autopilot-chat.tool-call.json.copy-path-for',
              message: `Copy path for ${path}`,
            })
          ),
        copyValue: _(
          msg({ id: 'autopilot-chat.tool-call.json.copy-value', message: `Copy value` })
        ),
        copyValueOf: (key) =>
          _(
            msg({
              id: 'autopilot-chat.tool-call.json.copy-value-of',
              message: `Copy value of ${key}`,
            })
          ),
      },
      traces: _(msg({ id: 'autopilot-chat.tool-call.traces', message: `Traces` })),
      escalation: _(msg({ id: 'autopilot-chat.tool-call.escalation', message: `Escalation` })),
      taskWaiting: _(msg({ id: 'autopilot-chat.tool-call.task-waiting', message: `Waiting` })),
      taskCompleted: _(msg({ id: 'autopilot-chat.tool-call.completed', message: `Completed` })),
      seconds: (value) => {
        const seconds = value.toFixed(2);
        return _(msg({ id: 'autopilot-chat.tool-call.seconds', message: `${seconds} seconds` }));
      },
    }),
    [_]
  );
}
