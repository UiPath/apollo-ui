'use client';

import { Pencil, Plus } from 'lucide-react';
import { useId, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib';
import { ResourcePicker, resourcePickerTriggerClassName } from '../resource-picker/resource-picker';
import type { ResourceGroup, ResourceItem } from '../resource-picker/types';
import { ConnectionActionsMenu } from './components/connection-actions-menu';
import {
  ConnectionStatusDot,
  ConnectionStatusLine,
  STATUS_LABELS,
} from './components/connection-status';
import type { Connection, ConnectionPickerProps, ConnectionStatus } from './types';

const DEFAULT_REASONS: Record<Exclude<ConnectionStatus, 'connected'>, string> = {
  broken: 'Connection broken. Reconnect to restore access.',
  warning: 'Connection needs attention. Re-authenticate to restore full access.',
};

const statusOf = (connection: Connection): ConnectionStatus => connection.status ?? 'connected';

/** The first sentence of a reason, without its full stop. */
const headlineOf = (reason: string) => reason.split(/(?<=\.)\s+/)[0]?.replace(/\.$/, '') ?? '';

/**
 * A warning covers any degraded state, so it is named by the connection's own
 * headline where there is one. Connected and broken read the same for every
 * connection.
 */
const statusLabelOf = (connection: Connection) => {
  const status = statusOf(connection);
  return status === 'warning' && connection.statusReason
    ? headlineOf(connection.statusReason)
    : STATUS_LABELS[status];
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
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  };

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
          <ConnectionStatusLine status={statusOf(connection)} label={statusLabelOf(connection)} />
        ),
        subtitleText: statusLabelOf(connection),
        // The row prints the account, so the connection's own name stays
        // findable through the search instead.
        keywords: [connection.name, ...(connection.keywords ?? [])],
        disabled: connection.disabled,
      })),
    }));
  }, [connections, defaultFolder]);

  const selected = value ? byId.get(value) : undefined;
  const selectedStatus = selected ? statusOf(selected) : undefined;
  const unhealthy = selectedStatus === 'broken' || selectedStatus === 'warning';

  /** Actions leave the picker, so the popover closes before handing off. */
  const handOff = (action: (connection: Connection) => void, connection: Connection) => {
    setOpen(false);
    action(connection);
  };

  const renderItemActions =
    onFix || onEdit
      ? (item: ResourceItem) => {
          const connection = byId.get(item.id);
          if (!connection) return null;
          const name = displayName(connection);
          return (
            <>
              {/* Only a broken row has anything to repair, so Fix is absent
                  rather than disabled elsewhere. */}
              {onFix && statusOf(connection) === 'broken' && (
                <Button
                  variant="text"
                  size="4xs"
                  aria-label={`Fix ${name}`}
                  className="text-error hover:text-error"
                  onClick={() => handOff(onFix, connection)}
                >
                  Fix
                </Button>
              )}
              {onEdit && (
                <button
                  type="button"
                  aria-label={`Edit ${name}`}
                  title={`Edit ${name}`}
                  className="grid size-6 cursor-pointer place-items-center rounded text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground"
                  onClick={() => handOff(onEdit, connection)}
                >
                  <Pencil size={13} />
                </button>
              )}
            </>
          );
        }
      : undefined;

  // The first sentence is the summary under the field. The whole reason is
  // its hover text, and its accessible text, so detail is not lost to
  // truncation for anyone, including those who cannot hover.
  const reason =
    selected && unhealthy ? selected.statusReason || DEFAULT_REASONS[selectedStatus] : '';
  const summary = headlineOf(reason);
  const message = error ?? (unhealthy ? summary : '');
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
  if (connections.length === 0 && onAddConnection) {
    return (
      <div className={cn('flex min-w-0 flex-col gap-1', className)}>
        <button
          {...fieldProps}
          type="button"
          disabled={disabled}
          aria-invalid={error ? true : ariaInvalid}
          className={cn(resourcePickerTriggerClassName, 'pr-3 future:pr-4')}
          onClick={onAddConnection}
        >
          <Plus size={16} className="shrink-0 text-foreground-muted" />
          <span className="min-w-0 flex-1 truncate text-foreground-subtle">
            {addConnectionLabel}
          </span>
        </button>
        {error && <FieldMessage id={messageId} tone="error" text={error} />}
      </div>
    );
  }

  return (
    <div className={cn('flex min-w-0 flex-col gap-1', className)}>
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
        placeholder={placeholder}
        searchPlaceholder={searchPlaceholder}
        emptyText={emptyText}
        listLabel="Connections"
        disabled={disabled}
        open={open}
        onOpenChange={setOpen}
        icon={selectedStatus ? <ConnectionStatusDot status={selectedStatus} /> : undefined}
        status={error || selectedStatus === 'broken' ? 'error' : unhealthy ? 'warning' : undefined}
        renderItemActions={renderItemActions}
        trailingAdornment={
          selected && (onRefreshSchema || onEdit) && !disabled ? (
            // Keyed by the connection, so a refresh still pending for the
            // last one, and its outcome, do not carry over to the next.
            <ConnectionActionsMenu
              key={selected.id}
              onRefreshSchema={onRefreshSchema ? () => onRefreshSchema(selected) : undefined}
              onEdit={onEdit ? () => onEdit(selected) : undefined}
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
              Add new connection
            </Button>
          ) : undefined
        }
      />
      {/* Read through the field's description only. */}
      {selectedStatus && (
        <span id={healthId} hidden>
          {STATUS_LABELS[selectedStatus]}
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
              Fix
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

export type { Connection, ConnectionPickerProps, ConnectionStatus } from './types';
