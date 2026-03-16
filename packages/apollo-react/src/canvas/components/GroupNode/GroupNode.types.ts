import type { BaseNodeData } from '../BaseNode/BaseNode.types';

export interface GroupNodeData extends BaseNodeData {
  /** The title displayed in the group header */
  title?: string;

  /** Icon name from Apollo icon set to display in the header */
  iconName?: string;

  /** Background color for the group container */
  backgroundColor?: string;

  /** Border color for the group container */
  borderColor?: string;

  /** Whether the group is collapsed (children hidden) */
  collapsed?: boolean;

  /** Stored height before collapse, used to restore on expand */
  expandedHeight?: number;

  /** @deprecated No longer used — dimensions are controlled via node.style or React Flow's resize */
  width?: number;

  /** @deprecated No longer used — dimensions are controlled via node.style or React Flow's resize */
  height?: number;
}
