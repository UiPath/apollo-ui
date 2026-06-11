export interface NodePropertyPanelProps {
  /** Title shown in the drag-handle header row (e.g. "Properties"). Omit to hide the header row. */
  panelTitle?: string;
  /** Called when the X close button is clicked. Only rendered when `panelTitle` is set. */
  onClose?: () => void;
  /**
   * Node type identifier (e.g. "uipath.http-request"). The component reads the
   * node's manifest — including its `form: FormSchema` — from the nearest
   * `NodeRegistryProvider` in the tree.
   */
  nodeType: string;
  /** The node's display label shown in the node identity row. */
  nodeLabel?: string;
  /** Category text shown below nodeLabel. Falls back to nodeType when omitted. */
  nodeCategory?: string;
  /** Optional icon rendered left of the node name. */
  nodeIcon?: React.ReactNode;
  /** Optional action slot rendered on the right of the node identity row (e.g. a Run button). */
  action?: React.ReactNode;
  /**
   * Called when the form is submitted. Receives the full form data object whose
   * keys match the field `name` values in the FormSchema.
   */
  onSubmit?: (data: unknown) => void | Promise<void>;
  className?: string;
}
