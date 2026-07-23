import type { FormPlugin, FormSchema } from '@uipath/apollo-wind';
import type { ReactNode } from 'react';

export interface NodePropertyPanelProps {
  /**
   * Title shown in the drag-handle header row (e.g. "Properties"). Omit to hide
   * the title bar when the host panel system (e.g. dockview) renders its own.
   */
  panelTitle?: string;
  /** Called when the X close button is clicked. The button only renders when both `panelTitle` and `onClose` are provided. */
  onClose?: () => void;
  /** Optional icon rendered left of the node name in the identity row. */
  nodeIcon?: ReactNode;
  /** The node's display label shown in the node identity row. */
  nodeLabel?: string;
  /** Category/subtitle text shown below `nodeLabel` (e.g. "HTTP Request"). */
  nodeCategory?: string;
  /** Action slot rendered on the right of the identity row (e.g. a Run button). */
  action?: ReactNode;
  /**
   * Form schema to render. A multi-step schema (`steps`) renders as tabs; a
   * single-page schema (`sections`) renders as a flat form. The caller owns
   * schema assembly, so all field definitions and `initialData` live here.
   */
  schema?: FormSchema;
  /**
   * MetadataForm plugins. This is how the caller wires real-time change
   * handling, custom field components, and validation. The panel forwards them
   * verbatim to the underlying single form instance.
   */
  plugins?: FormPlugin[];
  /**
   * Visual treatment for each form section, forwarded to `MetadataForm`.
   * `'card'` (default) frames every section in a bordered box; `'plain'` drops
   * the border/rounding/horizontal padding so sections read as flush headers —
   * for hosts that already frame the panel and want a borderless list.
   */
  sectionVariant?: 'card' | 'plain';
  /** Called when the form is submitted (only when the schema defines a submit action). */
  onSubmit?: (data: unknown) => void | Promise<void>;
  /** Disables all fields (e.g. read-only nodes). */
  disabled?: boolean;
  /**
   * Change this (e.g. to the selected node id) to remount the form with fresh
   * initial data. The form reads `schema.initialData` once per mount, so a
   * stable identity per selected node prevents stale values across selections.
   */
  resetKey?: string;
  className?: string;
  /**
   * Horizontal inset (any CSS length) applied via `--mf-content-inset`. Aligns the
   * form fields, identity row, and empty state to a consistent left/right edge.
   * Default `1.5rem`.
   */
  contentInset?: string;
  /**
   * Optional content rendered in the title bar on the right side, immediately
   * before the close button. Use for compact mode toggles, status indicators, etc.
   */
  headerExtra?: ReactNode;
  /**
   * Arbitrary content rendered in the panel body instead of a `MetadataForm`.
   * Use when the node's properties are not schema-driven (e.g. an expression
   * editor, a preview pane, or a custom layout). When provided, `schema`,
   * `plugins`, `onSubmit`, `disabled`, and `resetKey` are all ignored.
   * The children fill the scrollable content area.
   */
  children?: ReactNode;
}
