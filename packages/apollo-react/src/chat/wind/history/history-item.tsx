import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import {
  Button,
  Input,
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from '@uipath/apollo-wind';
import { Pencil, Trash2 } from 'lucide-react';
import React from 'react';

import { useHistoryItem } from '../../headless/hooks/use-history-item';
import { useChatState } from '../../headless/providers/chat-state-provider';
import type { AutopilotChatHistory } from '../../service';

function ItemAction({
  label,
  onClick,
  children,
  ...props
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  'data-testid'?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" icon size="3xs" aria-label={label} onClick={onClick} {...props}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent>{label}</TooltipContent>
      </TooltipPortal>
    </Tooltip>
  );
}

/**
 * One conversation: opens on click, Enter or Space, with rename and delete shown on hover or
 * focus. Renaming swaps the name for a field: Enter or leaving it renames, Escape cancels.
 */
export function HistoryItem({ item }: { item: AutopilotChatHistory }) {
  const { _ } = useLingui();
  const { historyOpen, disabledFeatures } = useChatState();
  const {
    isActive,
    open,
    isEditing,
    draftName,
    setDraftName,
    startRename,
    commitRename,
    cancelRename,
    remove,
  } = useHistoryItem(item, historyOpen);
  const field = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (isEditing) {
      field.current?.focus();
      field.current?.select();
    }
  }, [isEditing]);

  const renameLabel = _(msg({ id: 'autopilot-chat.history.rename', message: `Rename chat` }));
  const deleteLabel = _(msg({ id: 'autopilot-chat.history.delete', message: `Delete chat` }));

  return (
    <li
      data-slot="wind-chat-history-item"
      data-active={isActive ? '' : undefined}
      data-renaming={isEditing ? '' : undefined}
      className="group/item flex min-h-8 items-center gap-1 rounded-md border-l-4 border-transparent pr-1 hover:bg-background-hover data-active:border-selection-indicator data-active:bg-surface-selected"
    >
      {isEditing ? (
        <Input
          ref={field}
          size="xs"
          value={draftName}
          aria-label={_(msg({ id: 'autopilot-chat.history.rename-input', message: `Chat name` }))}
          data-testid="autopilot-chat-history-rename-input"
          className="mx-1 min-w-0 flex-1 text-sm"
          onChange={(event) => setDraftName(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            // Escape's preventDefault keeps the history open (see its onEscapeKeyDown) and the
            // settings' Escape away.
            if (event.key === 'Enter') {
              event.preventDefault();
              commitRename();
            } else if (event.key === 'Escape') {
              event.preventDefault();
              cancelRename();
            }
          }}
        />
      ) : (
        <button
          type="button"
          aria-current={isActive ? 'true' : undefined}
          className="min-w-0 flex-1 cursor-pointer truncate rounded-sm px-2 py-1.5 text-left text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
          onClick={open}
        >
          {item.name}
        </button>
      )}
      {!isEditing && (
        // Shown on hover or focus within the row, and always where nothing hovers (touch).
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 group-hover/item:opacity-100 group-focus-within/item:opacity-100 [@media(hover:none)]:opacity-100">
          {!disabledFeatures.renameChat && (
            <ItemAction
              label={renameLabel}
              onClick={startRename}
              data-testid="autopilot-chat-history-rename"
            >
              <Pencil />
            </ItemAction>
          )}
          <ItemAction
            label={deleteLabel}
            onClick={remove}
            data-testid="autopilot-chat-history-delete"
          >
            <Trash2 />
          </ItemAction>
        </div>
      )}
    </li>
  );
}
