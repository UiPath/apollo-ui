import type { ReactNode } from 'react';
import type { ResourcePickerProps } from '../resource-picker/types';

/**
 * A connection's health. `warning` is usable but degraded, such as missing
 * scopes; `broken` needs repair before it will work.
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
   * headline is shown under the field and the whole reason on hover.
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
  > {
  connections: Connection[];
  /** Id of the chosen connection. */
  value?: string;
  onSelect: (connection: Connection) => void;
  /** Clears the field. Without it the clear control is not offered. */
  onClear?: () => void;
  /** Repairs a broken connection. Offered on broken rows and under the field. */
  onFix?: (connection: Connection) => void;
  /** Offered on every row, revealed under the cursor. */
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
}
