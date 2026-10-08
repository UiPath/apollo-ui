import type { ReactNode } from 'react';
import type { ResourcePickerProps } from '../resource-picker/types';

/**
 * A connection's health. `warning` is usable but degraded, such as missing
 * scopes or a rate limit, and is named by its `statusReason` headline when it
 * has one; `broken` needs repair before it will work.
 */
export type ConnectionStatus = 'connected' | 'warning' | 'broken';

export interface Connection {
  id: string;
  /** The connection's own name, such as "Outlook Work". */
  name: string;
  /**
   * The account behind it. When present it is what the row and field show:
   * a node bound to the wrong account is the mistake worth catching, and the
   * connection name says which connector, not which account.
   */
  account?: string;
  /** Defaults to `connected`. */
  status?: ConnectionStatus;
  /**
   * Why the connection is not healthy, authored as "Headline. Detail.". The
   * headline is shown under the field and the whole reason on hover. For a
   * `warning` the headline also names the state on its row.
   */
  statusReason?: string;
  /** The folder the connection lives in. Connections without one share `defaultFolder`. */
  folder?: string;
  /** The connector's logo, as an image URL. Takes precedence over `icon`. */
  logo?: string;
  /** Leading glyph for the row, for a connector without a logo image. */
  icon?: ReactNode;
  /** Extra terms the search matches, such as the connector name or a resource id. */
  keywords?: string[];
  disabled?: boolean;
  metadata?: unknown;
}

export interface ConnectionPickerProps
  extends Pick<
    ResourcePickerProps,
    | 'placeholder'
    | 'disabled'
    | 'clearable'
    | 'clearAriaLabel'
    | 'align'
    | 'open'
    | 'onOpenChange'
    | 'searchPlaceholder'
    | 'emptyText'
    | 'footerTrailing'
    | 'contentClassName'
    | 'className'
    | 'id'
    | 'aria-labelledby'
    | 'aria-describedby'
    | 'aria-invalid'
    | 'aria-errormessage'
  > {
  connections: Connection[];
  /** Id of the chosen connection. */
  value?: string;
  onSelect: (connection: Connection) => void;
  /** Clears the field. Without it the clear control is not offered. */
  onClear?: () => void;
  /**
   * Repairs an unhealthy connection. Under the field it is offered for a
   * chosen connection that is `broken` or `warning`, such as one missing
   * scopes, so it must handle both; the row shortcut is offered on `broken`
   * rows only.
   */
  onFix?: (connection: Connection) => void;
  /**
   * Offered on every row, revealed under the cursor, and in the field's menu
   * for the chosen connection, which is the route that reaches it from the
   * keyboard.
   */
  onEdit?: (connection: Connection) => void;
  /**
   * Starts a new connection. Adds a footer link, and with no connections at
   * all the field itself becomes the way in, since a list with nothing to
   * pick has nothing to open.
   */
  onAddConnection?: () => void;
  /**
   * Re-reads the chosen connection's schema. Adds a field menu while a
   * connection is chosen. Return a promise to show progress until it settles.
   */
  onRefreshSchema?: (connection: Connection) => void | Promise<void>;
  /**
   * A validation message, such as "Connection is required.". Puts the field
   * in its error state and shows the message under it.
   */
  error?: string;
  /** Folder for connections that do not name one. */
  defaultFolder?: string;
  addConnectionLabel?: string;
  /**
   * Overrides for the text the picker renders that has no prop of its own,
   * for localisation. Anything omitted falls back to
   * `DEFAULT_CONNECTION_PICKER_STRINGS`.
   */
  strings?: Partial<ConnectionPickerStrings>;
}

/**
 * Every user-facing string ConnectionPicker renders beyond its own props
 * (`placeholder`, `searchPlaceholder`, `emptyText`, `addConnectionLabel`,
 * `defaultFolder`, `clearAriaLabel`), including those of the ResourcePicker it
 * is built on.
 */
export interface ConnectionPickerStrings {
  /** Health names, on the rows, the field's description and its dot. */
  statusLabels: Record<ConnectionStatus, string>;
  /**
   * Reasons shown under the field for an unhealthy choice without a
   * `statusReason`, as "Headline. Detail.".
   */
  defaultReasons: Record<Exclude<ConnectionStatus, 'connected'>, string>;
  /** Visible text of the Fix action, on the rows and under the field. */
  fix: string;
  /** Accessible name of a row's Fix action, given the connection's name. */
  fixLabel: (name: string) => string;
  /** Visible text of the Edit action in a row's actions menu. */
  edit: string;
  /** Accessible name of a row's Edit action, given the connection's name. */
  editLabel: (name: string) => string;
  /** The footer link that starts a new connection. */
  addNewConnection: string;
  /** Accessible name of the list of connections. */
  listLabel: string;
  /** Accessible name of the field's menu button. */
  optionsLabel: string;
  /** The field menu's Edit item. */
  editConnection: string;
  /** The field menu's refresh item, at rest, while it runs, and once done. */
  refreshSchema: string;
  refreshingSchema: string;
  schemaRefreshed: string;
  /** ResourcePicker's `noMatchText`: shown when the search matches nothing. */
  noMatchText: (query: string) => string;
  /** ResourcePicker's `collapsedGroupLabel`: a collapsed folder's spoken name. */
  collapsedGroupLabel: (label: string) => string;
  /**
   * ResourcePicker's `expandedGroupLabel`: an open folder's spoken name when
   * every connection in it is disabled.
   */
  expandedGroupLabel: (label: string) => string;
  /** ResourcePicker's `actionsMenuLabel`: a row's actions menu name. */
  actionsMenuLabel: (label: string) => string;
}
