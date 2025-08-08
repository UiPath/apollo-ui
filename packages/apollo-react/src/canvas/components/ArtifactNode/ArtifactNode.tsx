import { memo } from "react";
import { NodeProps } from "@xyflow/react";
import { BaseNode } from "../BaseNode/BaseNode";
import type { ArtifactNodeData } from "../BaseNode/BaseNode.types";

/**
 * ArtifactNode is a specialized version of BaseNode that:
 * - Always renders with circular shape
 * - Enforces single handle per position via type system
 * - Optimized for representing artifacts like files, data stores, and external resources
 */
const ArtifactNodeComponent = (props: NodeProps & { data: ArtifactNodeData }) => {
  // Simply pass through to BaseNode with shape forced to circular
  const enhancedData = {
    ...props.data,
    shape: "circular" as const
  };

  return <BaseNode {...props} data={enhancedData} />;
};

export const ArtifactNode = memo(ArtifactNodeComponent);