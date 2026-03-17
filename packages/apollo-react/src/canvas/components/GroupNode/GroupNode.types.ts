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

  /** Custom width for the group (optional) */
  width?: number;

  /** Custom height for the group (optional) */
  height?: number;
}
