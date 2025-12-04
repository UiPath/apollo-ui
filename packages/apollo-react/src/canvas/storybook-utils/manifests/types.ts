/**
 * Node Manifest Types
 *
 * Declarative JSON-serializable configuration for node registrations.
 * Manifests are converted to NodeRegistration objects via createNodeFromManifest.
 */

/**
 * Display configuration for a node manifest.
 */
export interface ManifestDisplay {
  /** Display label for the node */
  label: string;
  /** Optional sub-label */
  subLabel?: string;
  /** Node shape */
  shape?: "square" | "rectangle" | "circle";
  /** Node color */
  color?: string;
  /** Background color */
  background?: string;
  /** Icon background color */
  iconBackground?: string;
  /** Icon color */
  iconColor?: string;
  /** Icon reference */
  icon: string;
  /** Custom SVG path data when icon is "custom" */
  customIconPath?: string;
}

/**
 * Handle type for connections.
 */
export type HandleType = "input" | "output" | "artifact";

/**
 * Handle definition in a manifest.
 */
export interface ManifestHandle {
  /** Unique handle ID */
  id: string;
  /** Handle type (source/target) */
  type: "source" | "target";
  /** Semantic handle type for styling */
  handleType: HandleType;
  /** Optional label for artifact handles */
  label?: string;
  /** Whether to show an add button on this handle */
  showButton?: boolean;
  /** Optional constraints for handle connections */
  constraints?: Record<string, unknown>;
}

/**
 * Handle group at a specific position.
 */
export interface ManifestHandleGroup {
  /** Position on the node */
  position: "top" | "right" | "bottom" | "left";
  /** Handles at this position */
  handles: ManifestHandle[];
  /** Whether this group is visible */
  visible?: boolean;
}

/**
 * Complete node manifest - JSON-serializable configuration.
 */
export interface NodeManifest {
  /** Unique node type identifier */
  nodeType: string;
  /** Semantic version */
  version: string;

  /** Display configuration */
  display: ManifestDisplay;

  /** Category for node palette grouping */
  category: string;
  /** Description for tooltips/documentation */
  description?: string;
  /** Search tags */
  tags?: string[];
  /** Sort order in category (lower = higher) */
  sortOrder?: number;
  /** Whether visible in node palette */
  isVisible?: boolean;

  /** Handle configuration */
  handles?: ManifestHandleGroup[];

  /** Default parameter values */
  defaultParameters?: Record<string, unknown>;
}
