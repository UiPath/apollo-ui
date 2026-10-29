import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import * as React from 'react';
import type { ConditionField } from '@/components/ui/conditions-editor';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FormField,
  FormFieldError,
  FormFieldHeader,
  FormFieldLabel,
} from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { AddRowButton, EmptyRows, RowDeleteButton, useRowFocus } from '@/components/ui/row-groups';
import type { VariablePickerItem } from '@/components/ui/variable-picker';
import { cn } from '@/lib';

/**
 * Building blocks for the Repeatable Rows guidance page. Every layout on that page is
 * composed from these, so the delete, add, focus, and validation behavior stays identical
 * across condition rows, groups, rules, cards, and key-value pairs.
 *
 * PROTOTYPES, NOT COMPONENTS. These exist to demonstrate the guidance and are not exported
 * from any package: don't import them into product code or other stories. Each is a
 * candidate shared component (see the page's "Moving to shared components" section). When
 * apollo-wind ships the real one, replace the prototype here with it so the page documents
 * what is actually delivered rather than drifting from it. The row actions, empty state, group
 * mode switch, focus hook, and collapsible group come from apollo-wind's `row-groups`, and every
 * condition example uses apollo-wind's `ConditionsEditor`.
 */

export type VariableOption = { label: string; value: string };

export const DEFAULT_VARIABLES: VariableOption[] = [
  { label: 'accountId', value: '$vars.accountId' },
  { label: 'approverEmail', value: '$vars.approverEmail' },
  { label: 'invoiceTotal', value: '$vars.invoiceTotal' },
];

// ── Row actions ──────────────────────────────────────────────────────────────

/**
 * Leading reorder handle. Only for lists where order changes the result. Activating it
 * opens Move up / Move down, which is the keyboard and touch alternative to dragging.
 */
export function RowDragHandle({
  label,
  onMoveUp,
  onMoveDown,
}: {
  label: string;
  /** Omitted when the item is already first. */
  onMoveUp?: () => void;
  /** Omitted when the item is already last. */
  onMoveDown?: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className="grid size-8 shrink-0 cursor-grab place-items-center rounded text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GripVertical aria-hidden="true" className="size-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuItem disabled={!onMoveUp} onSelect={onMoveUp}>
          <ArrowUp /> Move up
        </DropdownMenuItem>
        <DropdownMenuItem disabled={!onMoveDown} onSelect={onMoveDown}>
          <ArrowDown /> Move down
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ── Example data ────────────────────────────────────────────────────────────

/** The fields every condition example on the page compares. */
export const CONDITION_FIELDS: ConditionField[] = [
  { value: 'accountId', label: 'AccountID', type: 'number' },
  { value: 'createdBy', label: 'CreatedBy', type: 'string' },
  { value: 'createTime', label: 'CreateTime', type: 'date' },
  {
    value: 'status',
    label: 'Status',
    type: 'enum',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'On hold', value: 'onHold' },
      { label: 'Closed', value: 'closed' },
    ],
  },
  { value: 'amount', label: 'case.amount', type: 'number' },
];

/** What the examples' Variable mode picks from. */
export const CONDITION_VARIABLES: VariablePickerItem[] = [
  {
    id: 'vars',
    label: '$vars',
    type: 'object',
    children: DEFAULT_VARIABLES.map((variable) => ({
      id: variable.value,
      label: variable.label,
      value: variable.value,
      type: 'string',
    })),
  },
];

let nodeCounter = 0;
export function newId(prefix = 'node') {
  nodeCounter += 1;
  return `${prefix}-${nodeCounter}`;
}

/**
 * The first `${prefix}${n}` not already taken. Counting from the list length repeats a name
 * after a delete, e.g. deleting item 1 of [output1, output2] and adding gives output2 again.
 */
export function uniqueName(prefix: string, taken: string[]) {
  let n = 1;
  while (taken.includes(`${prefix}${n}`)) n += 1;
  return `${prefix}${n}`;
}

// ── Containers ──────────────────────────────────────────────────────────────

/** Bordered container for a group of items: a header slot, the items, and a footer slot. */
export function RowGroup({
  header,
  footer,
  nested = false,
  error,
  children,
  rowProps,
}: {
  header?: React.ReactNode;
  footer?: React.ReactNode;
  nested?: boolean;
  /** Group-level summary, rendered below the container. */
  error?: string;
  children: React.ReactNode;
  /** Marks the container as an item of a parent list, e.g. one rule in a list of rules. */
  rowProps?: boolean;
}) {
  return (
    <div data-row={rowProps ? '' : undefined} className="flex flex-col">
      <div
        className={cn(
          'flex flex-col gap-3',
          // Nested groups indent with a rule instead of a second box, so rows keep their width.
          nested ? 'border-l-2 border-border pl-3' : 'rounded-lg border border-border bg-card p-3',
          error && 'border-error'
        )}
      >
        {header}
        {children}
        {footer && <div className="flex flex-wrap items-center gap-4">{footer}</div>}
      </div>
      {error && <FormFieldError>{error}</FormFieldError>}
    </div>
  );
}

/** Repeatable card: a title (text or an editable name) with delete in the header. */
export function RepeatableCard({
  title,
  deleteLabel,
  onDelete,
  leading,
  children,
}: {
  title: React.ReactNode;
  deleteLabel: string;
  onDelete?: () => void;
  leading?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div data-row="" className="flex flex-col gap-3 rounded-lg border border-border bg-card p-3">
      {/* Bottom-aligned, with the handle and delete in control-height boxes, so they centre on
          the title field rather than on its label. */}
      <div className="flex items-end gap-2">
        {leading && <div className="flex h-9 items-center future:h-10">{leading}</div>}
        <div className="min-w-0 flex-1">{title}</div>
        <div className="flex h-9 items-center future:h-10">
          <RowDeleteButton label={deleteLabel} onClick={onDelete} />
        </div>
      </div>
      {children}
    </div>
  );
}

/** Key-value rows with a visible limit. Use for headers, query parameters, metadata. */
export function KeyValueList({
  title,
  itemName,
  limit,
  initialPairs,
  reorderable = false,
}: {
  title: string;
  /** Singular, lower case: "header" gives "Add header" and "Remove header 2". */
  itemName: string;
  limit: number;
  initialPairs: { key: string; value: string }[];
  /** Only when order changes the result. Headers and query parameters are unordered. */
  reorderable?: boolean;
}) {
  const [pairs, setPairs] = React.useState(() =>
    initialPairs.map((pair) => ({ ...pair, id: newId(itemName) }))
  );
  const focus = useRowFocus();
  const baseId = React.useId();
  const label = itemName.charAt(0).toUpperCase() + itemName.slice(1);
  const move = (from: number, to: number) =>
    setPairs((current) => {
      const next = [...current];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });

  return (
    <div className="flex flex-col gap-2">
      <FormFieldHeader
        label={title}
        badge={
          <span className="text-xs text-muted-foreground">
            {pairs.length} / {limit}
          </span>
        }
      />
      <FormField>
        {pairs.length > 0 && (
          // Visible column labels: the persistent labels for every row's Name and Value.
          <div className="flex items-center gap-2">
            {reorderable && <span aria-hidden="true" className="h-4 w-8 shrink-0" />}
            <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
              <FormFieldLabel id={`${baseId}-name`}>Name</FormFieldLabel>
              <FormFieldLabel id={`${baseId}-value`}>Value</FormFieldLabel>
            </div>
            <span aria-hidden="true" className="h-4 w-8 shrink-0" />
          </div>
        )}
        <div ref={focus.listRef} className="flex flex-col gap-2">
          {pairs.map((pair, position) => (
            <div key={pair.id} data-row="" className="flex items-center gap-2">
              <span id={`${baseId}-${pair.id}`} className="sr-only">
                {label} {position + 1}
              </span>
              {reorderable && (
                <RowDragHandle
                  label={`Reorder ${itemName} ${position + 1}`}
                  onMoveUp={position > 0 ? () => move(position, position - 1) : undefined}
                  onMoveDown={
                    position < pairs.length - 1 ? () => move(position, position + 1) : undefined
                  }
                />
              )}
              <div className="grid min-w-0 flex-1 grid-cols-2 gap-2">
                <Input
                  data-row-first=""
                  aria-labelledby={`${baseId}-${pair.id} ${baseId}-name`}
                  defaultValue={pair.key}
                  placeholder="Content-Type"
                />
                <Input
                  aria-labelledby={`${baseId}-${pair.id} ${baseId}-value`}
                  defaultValue={pair.value}
                  placeholder="application/json"
                />
              </div>
              <RowDeleteButton
                label={`Remove ${itemName} ${position + 1}`}
                onClick={() => {
                  focus.afterDelete(position);
                  setPairs((current) => current.filter((row) => row.id !== pair.id));
                }}
              />
            </div>
          ))}
          {pairs.length === 0 && <EmptyRows>No {itemName}s.</EmptyRows>}
        </div>
      </FormField>
      <div>
        <AddRowButton
          ref={focus.addRef}
          disabled={pairs.length >= limit}
          onClick={() => {
            focus.afterAdd();
            setPairs((current) => [...current, { id: newId(itemName), key: '', value: '' }]);
          }}
        >
          Add {itemName}
        </AddRowButton>
      </div>
    </div>
  );
}
