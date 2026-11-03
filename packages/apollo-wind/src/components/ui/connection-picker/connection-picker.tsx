'use client';

import { Pencil, Plus } from 'lucide-react';
import {
  type ForwardedRef,
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Button } from '@/components/ui/button';
import { FormFieldError } from '@/components/ui/form-field';
import { InputGroup, InputGroupAddon, InputGroupTrigger } from '@/components/ui/input-group';
import {
  InputGroupContext,
  NO_GROUP,
  NO_GROUP_DISABLED,
  useInputGroup,
} from '@/components/ui/input-group-context';
import { cn } from '@/lib';
import { ResourcePicker } from '../resource-picker/resource-picker';
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
 * The connection's own name, kept beside its account where the account alone
 * does not tell it from another connection: two connections on one account,
 * such as Production and Test, would otherwise read the same on their rows,
 * in their actions and in the field.
 */
const distinguishingName = (connection: Connection, collisions: ReadonlySet<string>) =>
  connection.account &&
  connection.account !== connection.name &&
  collisions.has(displayName(connection))
    ? connection.name
    : undefined;

/**
 * Usable connections first, broken ones last, each keeping its incoming order
 * otherwise. A list that opens on dead ends makes the reader scan past them;
 * broken rows stay, since they can still be chosen and repaired.
 */
const byHealth = (a: Connection, b: Connection) =>
  (statusOf(a) === 'broken' ? 1 : 0) - (statusOf(b) === 'broken' ? 1 : 0);

/** `ConnectionPicker`'s body, wrapped below to forward the trigger ref. */
function ConnectionPickerField(
  {
    connections,
    value = '',
    onSelect,
    onClear,
    onFix,
    onEdit,
    onAddConnection,
    onRefreshSchema,
    error,
    errorId,
    defaultFolder = 'My Workspace',
    addConnectionLabel = 'Add connection',
    placeholder = 'Select connection...',
    searchPlaceholder = 'Search connections...',
    emptyText = 'No connections yet.',
    strings,
    disabled: disabledProp = false,
    open: controlledOpen,
    onOpenChange,
    className,
    id,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-errormessage': ariaErrorMessage,
    ...pickerProps
  }: ConnectionPickerProps,
  forwardedRef: ForwardedRef<HTMLButtonElement>
) {
  // The picker stands on its own rather than joining an enclosing group, but
  // a disabled one, such as a disabled InputGroupBody, still disables it.
  const enclosing = useInputGroup();
  const disabled = disabledProp || Boolean(enclosing.disabled);
  const groupContext = disabled ? NO_GROUP_DISABLED : NO_GROUP;
  const messageId = useId();
  const healthId = useId();
  const addTextId = useId();
  const loadErrorId = useId();
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
  // Only once the list is known to be empty: while it loads, or after a load
  // failed, an empty list says nothing yet, and the picker shows why.
  const addOnly =
    connections.length === 0 &&
    Boolean(onAddConnection) &&
    !value &&
    !pickerProps.loading &&
    !pickerProps.loadError;
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
  /** The field's control, the picker's trigger or the add button. */
  const fieldControl = () =>
    fieldRef.current?.querySelector<HTMLElement>('[data-slot="input-group-control"]');
  // Swapping one field for the other unmounts the control that had focus:
  // the picker's search or clear control as the add-only field takes over,
  // or the add button once the first connection arrives. Focus would drop to
  // the page, so focus that was in the old field moves to the new one's
  // first control, the add button or the picker's trigger; focus anywhere
  // else is left where it is.
  //
  // Checked again once the new field settles: its trigger is an
  // InputGroupPopoverTrigger, whose popover anchor registers after mount and
  // has Radix remount the trigger, dropping the focus given to the first one.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs on the swap between the two fields, which `addOnly` marks.
  useLayoutEffect(() => {
    if (!focusWithin.current) return;
    const focusControl = () => {
      const control = fieldControl();
      if (!control) return;
      const active = (control.getRootNode() as Document | ShadowRoot).activeElement;
      if (!active || active === control.ownerDocument.body) control.focus();
    };
    focusControl();
    const settle = window.setTimeout(focusControl, 0);
    return () => window.clearTimeout(settle);
  }, [addOnly]);

  const byId = useMemo(
    () => new Map(connections.map((connection) => [connection.id, connection])),
    [connections]
  );

  /** Display names that more than one connection shares. */
  const collisions = useMemo(() => {
    const seen = new Set<string>();
    const shared = new Set<string>();
    for (const connection of connections) {
      const name = displayName(connection);
      if (seen.has(name)) shared.add(name);
      else seen.add(name);
    }
    return shared;
  }, [connections]);

  /** The name a connection's actions and field are spoken and shown by. */
  const fullName = useCallback(
    (connection: Connection) => {
      const secondary = distinguishingName(connection, collisions);
      return secondary ? `${displayName(connection)} (${secondary})` : displayName(connection);
    },
    [collisions]
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
        // Printed beside the account, and so in the row's name, only where
        // another connection shares the account; the field names both too.
        description: distinguishingName(connection, collisions),
        fieldLabel: fullName(connection),
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
  }, [connections, defaultFolder, text.statusLabels, collisions, fullName]);

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
          const name = fullName(connection);
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
              icon: <Pencil className="size-3.5" />,
              onSelect: () => handOff(onEdit, connection),
            });
          }
          return actions;
        }
      : undefined;

  // The first sentence is the summary under the field. The whole reason is
  // its hover text, and its accessible text, so detail is not lost to
  // truncation for anyone, including those who cannot hover. A validation
  // `error` takes its place: the field renders that one itself.
  const reason =
    selected && unhealthy ? selected.statusReason || text.defaultReasons[selectedStatus] : '';
  const summary = headlineOf(reason);
  // A failed load is shown on the field as well as in the list, so it is
  // seen without opening the picker, with Retry beside it. It is not a
  // validation message, so it does not mark the field invalid. A validation
  // `error` still takes its place, and it takes the health message's, since
  // a health read from a list that failed to load may be stale.
  const { loadError, onRetry, retryLabel = 'Retry' } = pickerProps;
  const showLoadError = !error && Boolean(loadError);
  const showHealth = !error && !showLoadError && Boolean(summary);
  const broken = selectedStatus === 'broken';
  // The consumer's own description comes first, then the field's health and
  // its message. The leading dot is a glyph, kept out of the field's name, so
  // the health it shows is told here instead.
  const describedBy =
    [
      ariaDescribedBy,
      selectedStatus ? healthId : undefined,
      showHealth ? messageId : undefined,
      showLoadError ? loadErrorId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;
  const fieldProps = {
    id,
    'aria-labelledby': ariaLabelledBy,
    'aria-describedby': describedBy,
  };

  // With nothing to choose from, the field is the way to add one: a popover
  // whose only useful content is its footer link is a wasted click.
  if (addOnly) {
    return (
      // A complete field with its own message, so it is never a consumer
      // group's control: the message would land inside that group's box.
      <InputGroupContext.Provider value={groupContext}>
        <div ref={fieldRef} className={cn('min-w-0', className)} {...trackFocus}>
          <InputGroup error={error} errorId={errorId ?? messageId}>
            <InputGroupAddon align="inline-start">
              <Plus aria-hidden className="text-foreground-muted" />
            </InputGroupAddon>
            <InputGroupTrigger
              ref={forwardedRef}
              {...fieldProps}
              // A field label, through `aria-labelledby` or a `<label>` for
              // `id`, would replace the button's own text as its name, and
              // the action it takes would go unheard. The label is kept as
              // context and the action follows it: the button's own id
              // stands for its `<label>`.
              aria-labelledby={
                ariaLabelledBy
                  ? `${ariaLabelledBy} ${addTextId}`
                  : id
                    ? `${id} ${addTextId}`
                    : undefined
              }
              aria-invalid={ariaInvalid}
              aria-errormessage={ariaErrorMessage}
              disabled={disabled}
              onClick={onAddConnection}
            >
              <span id={addTextId} className="min-w-0 flex-1 truncate text-foreground-subtle">
                {addConnectionLabel}
              </span>
            </InputGroupTrigger>
          </InputGroup>
        </div>
      </InputGroupContext.Provider>
    );
  }

  return (
    // A complete field with its own health message, so it is never a consumer
    // group's control: the message would land inside that group's box.
    <InputGroupContext.Provider value={groupContext}>
      <div ref={fieldRef} className={cn('min-w-0', className)} {...trackFocus}>
        <ResourcePicker
          ref={forwardedRef}
          {...pickerProps}
          {...fieldProps}
          // A broken connection marks the field invalid, with its health as
          // the error message. A warning only draws the advisory edge.
          aria-invalid={broken && !error ? true : ariaInvalid}
          aria-errormessage={broken && showHealth ? messageId : ariaErrorMessage}
          error={error}
          errorId={errorId}
          warning={selectedStatus === 'warning'}
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
              // Flow's add action: brand text on a ghost button, whose hover
              // is a fill rather than an underline. Brand is restated under
              // `future:`, where the ghost variant's own muted text would
              // otherwise out-rank it.
              <Button
                variant="ghost"
                size="2xs"
                className="-ml-2 gap-1 font-semibold text-brand hover:text-brand future:text-brand future:hover:text-brand"
                onClick={() => {
                  // The footer stays mounted while the popover animates out,
                  // so a press after it closed, or was closed by `disabled`,
                  // does not start a new connection, as row commits do not.
                  if (disabled || !open) return;
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
        {showLoadError && (
          <div className="mt-1.5 flex min-w-0 items-baseline gap-1.5">
            <FormFieldError
              id={loadErrorId}
              title={loadError ?? undefined}
              className="mt-0 min-w-0 truncate"
            >
              {loadError}
            </FormFieldError>
            {!disabled && onRetry && (
              <Button
                variant="text"
                size="4xs"
                className="shrink-0 px-0 text-xs"
                onClick={() => {
                  // A retry clears the error, which unmounts this button
                  // with focus in it, so focus moves to the field first.
                  fieldControl()?.focus();
                  onRetry();
                }}
              >
                {retryLabel}
              </Button>
            )}
          </div>
        )}
        {showHealth && selectedStatus && (
          <div className="mt-1.5 flex min-w-0 items-baseline gap-1.5">
            <FormFieldError
              id={messageId}
              severity={broken ? 'error' : 'warning'}
              title={reason}
              className="mt-0 min-w-0 truncate"
            >
              {summary === reason ? (
                summary
              ) : (
                <>
                  {/* The headline is what shows; the whole reason is what is
                      read, so assistive technology gets the detail the line
                      truncates. */}
                  <span aria-hidden>{summary}</span>
                  <span className="sr-only">{reason}</span>
                </>
              )}
            </FormFieldError>
            {/* Repair is offered here for either state: missing scopes are
                fixed by re-authenticating, which is the same flow. A disabled
                field offers no action, so neither does its message. */}
            {!disabled && selected && onFix && (
              <Button
                variant="text"
                size="4xs"
                className="shrink-0 px-0 text-xs"
                onClick={() => {
                  // A repair can make the connection healthy, which unmounts
                  // this button with focus in it. Focus moves to the field
                  // first, so it has somewhere to be, and a repair dialog the
                  // callback opens can still take it.
                  fieldControl()?.focus();
                  onFix(selected);
                }}
              >
                {text.fix}
              </Button>
            )}
          </div>
        )}
      </div>
    </InputGroupContext.Provider>
  );
}

/**
 * Field-and-popover picker over connections.
 *
 * Built on `ResourcePicker`, which owns the search, grouping, keyboard model
 * and footer. What is added here is the part only a connection has: a health
 * that shows on the field and on each row, repair and edit actions, and a
 * message under the field once a chosen connection needs attention.
 */
export const ConnectionPicker = forwardRef<HTMLButtonElement, ConnectionPickerProps>(
  ConnectionPickerField
);
ConnectionPicker.displayName = 'ConnectionPicker';

export type {
  Connection,
  ConnectionPickerProps,
  ConnectionPickerStrings,
  ConnectionStatus,
} from './types';
