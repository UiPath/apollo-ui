'use client';

import { Pencil, Plus } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib';
import { ResourcePicker, resourcePickerTriggerClassName } from '../resource-picker/resource-picker';
import type { ResourceGroup, ResourceItem, ResourceItemAction } from '../resource-picker/types';
import { ConnectionActionsMenu } from './components/connection-actions-menu';
import {
  ConnectionStatusDot,
  ConnectionStatusLine,
  STATUS_LABELS,
} from './components/connection-status';
import type {
  Connection,
  ConnectionPickerProps,
  ConnectionPickerStrings,
  ConnectionStatus,
} from './types';

export const DEFAULT_CONNECTION_PICKER_STRINGS: ConnectionPickerStrings = {
  statusLabels: STATUS_LABELS,
  defaultReasons: {
    broken: 'Connection broken. Reconnect to restore access.',
    // Generic, since a warning is not always an authentication problem: a
    // rate limit is not fixed by signing in again. A remedy comes from the
    // connection's own `statusReason`, which knows the cause.
    warning: 'Connection needs attention.',
  },
  fix: 'Fix',
  fixLabel: (name) => `Fix ${name}`,
  edit: 'Edit',
  editLabel: (name) => `Edit ${name}`,
  addNewConnection: 'Add new connection',
  listLabel: 'Connections',
  optionsLabel: 'Connection options',
  editConnection: 'Edit connection',
  refreshSchema: 'Refresh schema',
  refreshingSchema: 'Refreshing schema...',
  schemaRefreshed: 'Schema refreshed',
  noMatchText: (query) => `No results match “${query}”.`,
  collapsedGroupLabel: (label) => `${label}, collapsed`,
  expandedGroupLabel: (label) => `${label}, expanded`,
  actionsMenuLabel: (label) => `Actions for ${label}`,
};

const statusOf = (connection: Connection): ConnectionStatus => connection.status ?? 'connected';

/** The first sentence of a reason, without its full stop. */
const headlineOf = (reason: string) => reason.split(/(?<=\.)\s+/)[0]?.replace(/\.$/, '') ?? '';

/**
 * A warning covers any degraded state, so it is named by the connection's own
 * headline where there is one. Connected and broken read the same for every
 * connection.
 */
const statusLabelOf = (connection: Connection, labels: Record<ConnectionStatus, string>) => {
  const status = statusOf(connection);
  return status === 'warning' && connection.statusReason
    ? headlineOf(connection.statusReason)
    : labels[status];
};

/** The row and field name a connection by its account first, then by its own name. */
const displayName = (connection: Connection) => connection.account || connection.name;

/**
 * Usable connections first, broken ones last, each keeping its incoming order
 * otherwise. A list that opens on dead ends makes the reader scan past them;
 * broken rows stay, since they can still be chosen and repaired.
 */
const byHealth = (a: Connection, b: Connection) =>
  (statusOf(a) === 'broken' ? 1 : 0) - (statusOf(b) === 'broken' ? 1 : 0);

/**
 * Field-and-popover picker over connections.
 *
 * Built on `ResourcePicker`, which owns the search, grouping, keyboard model
 * and footer. What is added here is the part only a connection has: a health
 * that shows on the field and on each row, repair and edit actions, and a
 * message under the field once a chosen connection needs attention.
 */
export function ConnectionPicker({
  connections,
  value = '',
  onSelect,
  onClear,
  onFix,
  onEdit,
  onAddConnection,
  onRefreshSchema,
  error,
  defaultFolder = 'My Workspace',
  addConnectionLabel = 'Add connection',
  placeholder = 'Select connection...',
  searchPlaceholder = 'Search connections...',
  emptyText = 'No connections yet.',
  strings,
  disabled = false,
  open: controlledOpen,
  onOpenChange,
  className,
  id,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  'aria-invalid': ariaInvalid,
  'aria-errormessage': ariaErrorMessage,
  ...pickerProps
}: ConnectionPickerProps) {
  const messageId = useId();
  const healthId = useId();
  const addTextId = useId();
  const text = useMemo(() => ({ ...DEFAULT_CONNECTION_PICKER_STRINGS, ...strings }), [strings]);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

  // With nothing to choose from, the field becomes the add button and the
  // popover unmounts. An open state left behind would reopen it the moment
  // connections arrive again, so leaving for the add-only field closes it,
  // and tells a controlling owner so. A field that still holds a value keeps
  // the picker instead, while its connections reload or after the chosen one
  // went away, so the value stays visible and its clear control still works.
  const addOnly = connections.length === 0 && Boolean(onAddConnection) && !value;
  const closedByAddOnly = addOnly && open;
  // biome-ignore lint/correctness/useExhaustiveDependencies: fires on the transition into the add-only field while open; a new `onOpenChange` identity must not re-notify.
  useEffect(() => {
    if (closedByAddOnly) setOpen(false);
  }, [closedByAddOnly]);

  /**
   * Whether focus is somewhere in the picker, its popover included: focus
   * events bubble through React's tree from the portal too. A control that
   * unmounts while focused fires no blur, so this still holds when one field
   * replaces the other.
   */
  const focusWithin = useRef(false);
  const trackFocus = {
    onFocus: () => {
      focusWithin.current = true;
    },
    onBlur: () => {
      focusWithin.current = false;
    },
  };
  const fieldRef = useRef<HTMLDivElement>(null);
  // Swapping one field for the other unmounts the control that had focus:
  // the picker's search or clear control as the add-only field takes over,
  // or the add button once the first connection arrives. Focus would drop to
  // the page, so focus that was in the old field moves to the new one's
  // first control, the add button or the picker's trigger; focus anywhere
  // else is left where it is.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on the swap between the two fields, which `addOnly` marks.
  useLayoutEffect(() => {
    const control = fieldRef.current?.querySelector<HTMLElement>('button');
    if (!focusWithin.current || !control) return;
    const root = control.getRootNode() as Document | ShadowRoot;
    const active = root.activeElement;
    if (!active || active === control.ownerDocument.body) control.focus();
  }, [addOnly]);

  const byId = useMemo(
    () => new Map(connections.map((connection) => [connection.id, connection])),
    [connections]
  );

  const groups = useMemo<ResourceGroup[]>(() => {
    const folders = new Map<string, Connection[]>();
    for (const connection of connections) {
      const folder = connection.folder || defaultFolder;
      const members = folders.get(folder);
      if (members) members.push(connection);
      else folders.set(folder, [connection]);
    }
    return [...folders].map(([folder, members]) => ({
      id: folder,
      label: folder,
      items: [...members].sort(byHealth).map((connection) => ({
        id: connection.id,
        label: displayName(connection),
        // Decorative: the row is already named by its account, and the
        // connector is the same for every row a field offers.
        icon: connection.logo ? (
          <img src={connection.logo} alt="" className="size-4 object-contain" />
        ) : (
          connection.icon
        ),
        subtitle: (
          <ConnectionStatusLine
            status={statusOf(connection)}
            label={statusLabelOf(connection, text.statusLabels)}
          />
        ),
        subtitleText: statusLabelOf(connection, text.statusLabels),
        // The row prints the account, so the connection's own name stays
        // findable through the search instead.
        keywords: [connection.name, ...(connection.keywords ?? [])],
        disabled: connection.disabled,
      })),
    }));
  }, [connections, defaultFolder, text.statusLabels]);

  const selected = value ? byId.get(value) : undefined;
  const selectedStatus = selected ? statusOf(selected) : undefined;
  const unhealthy = selectedStatus === 'broken' || selectedStatus === 'warning';

  /** Actions leave the picker, so the popover closes before handing off. */
  const handOff = (action: (connection: Connection) => void, connection: Connection) => {
    setOpen(false);
    action(connection);
  };

  const itemActions =
    onFix || onEdit
      ? (item: ResourceItem): ResourceItemAction[] => {
          const connection = byId.get(item.id);
          if (!connection) return [];
          const name = displayName(connection);
          const actions: ResourceItemAction[] = [];
          // Only a broken row has anything to repair, so Fix is absent rather
          // than disabled elsewhere.
          if (onFix && statusOf(connection) === 'broken') {
            actions.push({
              id: 'fix',
              label: text.fixLabel(name),
              text: text.fix,
              tone: 'danger',
              onSelect: () => handOff(onFix, connection),
            });
          }
          if (onEdit) {
            actions.push({
              id: 'edit',
              label: text.editLabel(name),
              text: text.edit,
              icon: <Pencil size={13} />,
              onSelect: () => handOff(onEdit, connection),
            });
          }
          return actions;
        }
      : undefined;

  // The first sentence is the summary under the field. The whole reason is
  // its hover text, and its accessible text, so detail is not lost to
  // truncation for anyone, including those who cannot hover.
  const reason =
    selected && unhealthy ? selected.statusReason || text.defaultReasons[selectedStatus] : '';
  const summary = headlineOf(reason);
  // `||`, not `??`: an empty `error` is no error, as every other check here
  // reads it, so it must not hide the health message either.
  const message = error || (unhealthy ? summary : '');
  const messageTone = error || selectedStatus === 'broken' ? 'error' : 'warning';
  // The consumer's own description comes first, then the field's health and
  // its message. The leading dot is a glyph, kept out of the field's name, so
  // the health it shows is told here instead.
  const describedBy =
    [ariaDescribedBy, selectedStatus ? healthId : undefined, message ? messageId : undefined]
      .filter(Boolean)
      .join(' ') || undefined;
  const fieldProps = {
    id,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': describedBy,
    // While `error` marks the field invalid, its own message is the error
    // message, as DropdownMenuTrigger's is, unless the consumer names one.
    // Without `error` nothing is added, so a valid field points at no error.
    'aria-errormessage': error ? (ariaErrorMessage ?? messageId) : ariaErrorMessage,
  };

  // With nothing to choose from, the field is the way to add one: a popover
  // whose only useful content is its footer link is a wasted click.
  if (addOnly) {
    return (
      <div ref={fieldRef} className={cn('flex min-w-0 flex-col gap-1', className)} {...trackFocus}>
        <button
          {...fieldProps}
          // A field label, through `aria-labelledby` or a `<label>` for `id`,
          // would replace the button's own text as its name, and the action
          // it takes would go unheard. The label is kept as context and the
          // action follows it: the button's own id stands for its `<label>`.
          aria-labelledby={
            ariaLabelledBy
              ? `${ariaLabelledBy} ${addTextId}`
              : id
                ? `${id} ${addTextId}`
                : undefined
          }
          type="button"
          disabled={disabled}
          aria-invalid={error ? true : ariaInvalid}
          className={cn(resourcePickerTriggerClassName, 'pr-3 future:pr-4')}
          onClick={onAddConnection}
        >
          <Plus aria-hidden size={16} className="shrink-0 text-foreground-muted" />
          <span id={addTextId} className="min-w-0 flex-1 truncate text-foreground-subtle">
            {addConnectionLabel}
          </span>
        </button>
        {error && <FieldMessage id={messageId} tone="error" text={error} />}
      </div>
    );
  }

  return (
    <div ref={fieldRef} className={cn('flex min-w-0 flex-col gap-1', className)} {...trackFocus}>
      <ResourcePicker
        {...pickerProps}
        {...fieldProps}
        aria-invalid={ariaInvalid}
        groups={groups}
        value={value}
        onSelect={(item) => {
          const connection = byId.get(item.id);
          if (connection) onSelect(connection);
        }}
        onClear={onClear}
        // A value no connection matches, while they load or once the chosen
        // one is gone, is shown as the id it is rather than as an empty
        // field, so there is something to see and to clear.
        placeholder={value && !selected ? value : placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        listLabel={text.listLabel}
        noMatchText={text.noMatchText}
        collapsedGroupLabel={text.collapsedGroupLabel}
        expandedGroupLabel={text.expandedGroupLabel}
        actionsMenuLabel={text.actionsMenuLabel}
        disabled={disabled}
        open={open}
        onOpenChange={setOpen}
        icon={
          selectedStatus ? (
            <ConnectionStatusDot
              status={selectedStatus}
              label={text.statusLabels[selectedStatus]}
            />
          ) : undefined
        }
        status={error || selectedStatus === 'broken' ? 'error' : unhealthy ? 'warning' : undefined}
        itemActions={itemActions}
        trailingAdornment={
          selected && (onRefreshSchema || onEdit) && !disabled ? (
            // Keyed by the connection, so a refresh still pending for the
            // last one, and its outcome, do not carry over to the next.
            <ConnectionActionsMenu
              key={selected.id}
              onRefreshSchema={onRefreshSchema ? () => onRefreshSchema(selected) : undefined}
              onEdit={onEdit ? () => onEdit(selected) : undefined}
              strings={text}
            />
          ) : undefined
        }
        footerLeading={
          onAddConnection ? (
            <Button
              variant="link"
              size="sm"
              className="-ml-3 gap-1"
              onClick={() => {
                setOpen(false);
                onAddConnection();
              }}
            >
              <Plus className="size-3.5" />
              {text.addNewConnection}
            </Button>
          ) : undefined
        }
      />
      {/* Read through the field's description only. */}
      {selectedStatus && (
        <span id={healthId} hidden>
          {text.statusLabels[selectedStatus]}
        </span>
      )}
      {message && (
        <div className="flex min-w-0 items-baseline gap-1.5">
          <FieldMessage
            id={messageId}
            tone={messageTone}
            text={message}
            fullText={error ? undefined : reason}
          />
          {/* Repair is offered here for either state: missing scopes are
              fixed by re-authenticating, which is the same flow. A disabled
              field offers no action, so neither does its message. */}
          {!error && !disabled && selected && unhealthy && onFix && (
            <Button
              variant="text"
              size="4xs"
              className="shrink-0 px-0 text-xs"
              onClick={() => onFix(selected)}
            >
              {text.fix}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function FieldMessage({
  id,
  tone,
  text,
  fullText,
}: {
  id: string;
  tone: 'error' | 'warning';
  text: string;
  /** The whole message, where `text` shows only its headline. */
  fullText?: string;
}) {
  const shortened = Boolean(fullText) && fullText !== text;
  return (
    <p
      id={id}
      title={fullText}
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        'm-0 min-w-0 truncate text-xs',
        tone === 'error' ? 'text-error' : 'text-warning'
      )}
    >
      {shortened ? (
        <>
          {/* The headline is what shows; the whole reason is what is read,
              so assistive technology gets the detail the line truncates. */}
          <span aria-hidden>{text}</span>
          <span className="sr-only">{fullText}</span>
        </>
      ) : (
        text
      )}
    </p>
  );
}

export type {
  Connection,
  ConnectionPickerProps,
  ConnectionPickerStrings,
  ConnectionStatus,
} from './types';
