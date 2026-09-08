import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import type { KeyboardEvent, ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib';
import { formatGuardrailFormMessage, type GuardrailListLabels } from '../i18n';
import type {
  GuardrailListItem,
  GuardrailListItemState,
  GuardrailListItemStatus,
} from '../list-types';
import { GuardrailStatusChip, type GuardrailStatusChipTone } from './guardrail-status-chip';

/** Chip tone and label key per non-quiet status. `Available` renders no chip at all. */
const STATUS_CHIP: Record<
  Exclude<GuardrailListItemStatus, 'Available'>,
  { tone: GuardrailStatusChipTone; label: keyof GuardrailListLabels }
> = {
  Disabled: { tone: 'error', label: 'statusDisabledChip' },
  Unavailable: { tone: 'error', label: 'statusUnavailableChip' },
  Unauthorised: { tone: 'warning', label: 'statusUnauthorizedChip' },
  FeatureDisabled: { tone: 'warning', label: 'statusFeatureDisabledChip' },
};

const NOTICE_LABEL = {
  byoDisabled: 'byoDisabledNotice',
  byoUnavailable: 'byoUnavailableNotice',
} as const satisfies Record<
  NonNullable<GuardrailListItemState['notice']>,
  keyof GuardrailListLabels
>;

export interface GuardrailListRowProps<T extends GuardrailListItem = GuardrailListItem> {
  guardrail: T;
  /** Sortable id, resolved by the list through its `getItemId`. */
  id: string;
  state: GuardrailListItemState;
  labels: GuardrailListLabels;
  /** Read-only: actions rendered disabled. Reordering is governed by `sortable`. */
  disabled: boolean;
  /** Whether the drag handle renders and works. False renders no handle at all. */
  sortable: boolean;
  /** Whether the status and origin chips render. The BYO notices are not gated by this. */
  statusChips: boolean;
  /** Whether built-in-validator rows carry the preview chip. Host-controlled lifecycle flag. */
  previewChip: boolean;
  /** Whether the row body itself activates edit (Agents) on click and Enter/Space. */
  activatesEdit: boolean;
  formatScopes: (guardrail: T) => string | undefined;
  formatAction: (guardrail: T) => ReactNode;
  /** Tooltip content for this row. Requires an ancestor `TooltipProvider` when supplied. */
  renderTooltip?: (guardrail: T) => ReactNode;
  onEdit?: (guardrail: T) => void;
  onRemove?: (guardrail: T) => void;
  renderActions?: () => ReactNode;
}

/**
 * One guardrail in the list: drag handle, title with its chips, any status notice,
 * description, BYO provider, and the action/scope footer.
 */
export function GuardrailListRow<T extends GuardrailListItem = GuardrailListItem>({
  guardrail,
  id,
  state,
  labels,
  disabled,
  sortable,
  statusChips,
  previewChip,
  activatesEdit,
  formatScopes,
  formatAction,
  renderTooltip,
  onEdit,
  onRemove,
  renderActions,
}: GuardrailListRowProps<T>) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled: !sortable,
  });

  const statusChip =
    statusChips && state.status !== 'Available' ? STATUS_CHIP[state.status] : undefined;
  const scopes = formatScopes(guardrail);
  const action = formatAction(guardrail);
  const isBuiltIn = guardrail.$guardrailType === 'builtInValidator';
  const canActivate = activatesEdit && !disabled && onEdit !== undefined;

  const handleActivate = () => {
    if (canActivate) onEdit?.(guardrail);
  };
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    handleActivate();
  };

  const activation = canActivate
    ? ({
        role: 'button',
        tabIndex: 0,
        'aria-label': formatGuardrailFormMessage(labels.editRowAriaLabel, {
          name: guardrail.name,
        }),
        onClick: handleActivate,
        onKeyDown: handleKeyDown,
      } as const)
    : undefined;

  const tooltip = renderTooltip?.(guardrail);
  const rowBody = (
    <div className={cn('min-w-0 flex-1', canActivate && 'cursor-pointer')} {...activation}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="truncate text-sm font-medium">{guardrail.name}</span>
        {previewChip && isBuiltIn && (
          <GuardrailStatusChip tone="accent">{labels.previewChip}</GuardrailStatusChip>
        )}
        {statusChip && (
          <GuardrailStatusChip tone={statusChip.tone}>
            {labels[statusChip.label]}
          </GuardrailStatusChip>
        )}
        {statusChips && state.origin === 'governance' && (
          <GuardrailStatusChip tone="accent">{labels.originGovernanceChip}</GuardrailStatusChip>
        )}
      </div>

      {state.notice && (
        <p className="whitespace-normal break-words text-xs text-error" role="alert">
          {labels[NOTICE_LABEL[state.notice]]}
        </p>
      )}

      {guardrail.description && (
        <p className="truncate text-xs text-foreground-muted">{guardrail.description}</p>
      )}

      {state.byoConnectorName !== undefined && (
        <p
          className="truncate text-xs text-foreground-muted"
          title={`${labels.providerLabel}: ${state.byoConnectorName}`}
        >
          {labels.providerLabel}: {state.byoConnectorName}
        </p>
      )}

      {(action || scopes) && (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {action && (
            <Badge variant="secondary" className="border-border bg-muted/60 text-[11px] capitalize">
              {action}
            </Badge>
          )}
          {scopes && <span className="text-[11px] text-foreground-muted">{scopes}</span>}
        </div>
      )}
    </div>
  );

  // Radix clones the trigger onto the row body, so the tooltip covers the same region Agents
  // hovers today (title, description, provider, scopes) without adding another focus stop.
  const body = tooltip ? (
    <Tooltip>
      <TooltipTrigger asChild>{rowBody}</TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-[300px]">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  ) : (
    rowBody
  );

  return (
    <li
      ref={setNodeRef}
      data-slot="guardrail-list-row"
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex items-center gap-2', isDragging && 'opacity-50')}
    >
      {sortable && (
        <Button
          variant="ghost"
          size="2xs"
          icon
          className="-ml-2 -mr-2 shrink-0 cursor-grab touch-none"
          aria-label={formatGuardrailFormMessage(labels.reorderHandleAriaLabel, {
            name: guardrail.name,
          })}
          {...attributes}
          {...listeners}
        >
          <GripVertical />
        </Button>
      )}

      {body}

      <div className="flex shrink-0 items-center">
        {renderActions ? (
          renderActions()
        ) : (
          <>
            {onEdit && (
              <Button
                variant="ghost"
                size="3xs"
                icon
                disabled={disabled}
                aria-label={labels.editButtonAriaLabel}
                onClick={() => onEdit(guardrail)}
              >
                <Pencil />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="3xs"
                icon
                disabled={disabled}
                aria-label={labels.deleteButtonAriaLabel}
                onClick={() => onRemove(guardrail)}
              >
                <Trash2 />
              </Button>
            )}
          </>
        )}
      </div>
    </li>
  );
}
