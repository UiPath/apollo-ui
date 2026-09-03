import type { FormPlugin, FormSchema } from '@uipath/apollo-wind';
import type { HTMLAttributes, ReactNode } from 'react';

export interface NodePropertyPanelProps {
  /**
   * Title shown in the drag-handle header row (e.g. "Properties"). Omit to hide
   * the title bar when the host panel system (e.g. dockview) renders its own.
   */
  panelTitle?: string;
  /** Native interaction props applied to the dedicated title-bar drag handle. */
  dragHandleProps?: Omit<HTMLAttributes<HTMLDivElement>, 'className'>;
  /** Called when the X close button is clicked. The button only renders when both `panelTitle` and `onClose` are provided. */
  onClose?: () => void;
  /** Optional icon rendered left of the node name in the identity row. */
  nodeIcon?: ReactNode;
  /** The node's display label shown in the node identity row. */
  nodeLabel?: string;
  /** Category/subtitle text shown below `nodeLabel` (e.g. "HTTP Request"). Fallback: a description, a description callback, or a description error takes the line instead. */
  nodeCategory?: string;
  /** User-authored description on the identity row's second line. Takes the line from `nodeCategory` whenever it is non-empty, as does `onNodeDescriptionChange` on its own. */
  nodeDescription?: string;
  /** Hint shown in place of an empty `nodeLabel`. Defaults to a localized `"Name"`. Never committed. */
  nodeLabelPlaceholder?: string;
  /** Hint shown in place of an empty `nodeDescription`. Defaults to a localized `"Description"`. Never committed. */
  nodeDescriptionPlaceholder?: string;
  /** Makes `nodeLabel` click-to-edit: commits the trimmed value on Enter or blur, Escape reverts. Omit for read-only. */
  onNodeLabelChange?: (label: string) => void;
  /** Makes `nodeDescription` click-to-edit. Same contract as `onNodeLabelChange`. */
  onNodeDescriptionChange?: (description: string) => void;
  /**
   * Validation message for the node name, rendered below it with a persistent
   * error ring.
   */
  nodeLabelError?: ReactNode;
  /** Validation message for the description. Same contract as `nodeLabelError`; takes the second line even with no description or edit callback. */
  nodeDescriptionError?: ReactNode;
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
  /**
   * Controlled active tab id for a tabbed (multi-step) schema. Persist it
   * across node switches to keep the user on the same tab; an id absent from
   * the current node's tabs falls back to the first tab. Omit for uncontrolled.
   */
  activeStepId?: string;
  /**
   * Fires with the tab id whenever the user selects a tab, in both controlled
   * and uncontrolled mode. Pair it with `activeStepId` to persist the selection.
   */
  onActiveStepChange?: (stepId: string) => void;
  /** Called when the form is submitted (only when the schema defines a submit action). */
  onSubmit?: (data: unknown) => void | Promise<void>;
  /** Disables all fields (e.g. read-only nodes). */
  disabled?: boolean;
  /**
   * Forwarded to the underlying `MetadataForm`'s `<form>` element. Set `'off'`
   * to keep browser autofill dropdowns from covering fields whose names match
   * common autofill categories (e.g. `label`, `url`, `description`).
   */
  autoComplete?: 'off' | 'on';
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
