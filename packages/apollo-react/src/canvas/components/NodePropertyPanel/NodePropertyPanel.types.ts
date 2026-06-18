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
   * Horizontal inset (any CSS length) applied to the form content. It also drives
   * the tab underline's full-bleed: the tab bar extends past this inset to the panel
   * edges and re-insets its labels to line up with the fields. Default `1.5rem`.
   */
  contentInset?: string;
}
