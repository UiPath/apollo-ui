import { memo } from "react";
import { NodeProps, Position } from "@xyflow/react";
import { BaseNode } from "../BaseNode";
import type { AgentNodeData } from "./AgentNode.types";
import type { HandleConfiguration } from "../BaseNode/BaseNode.types";

const AgentNodeComponent = (props: NodeProps & { data: AgentNodeData }) => {
  const { data } = props;

  const defaultHandleConfigurations: HandleConfiguration[] = [
    {
      position: Position.Left,
      handles: [
        {
          id: "input",
          type: "target",
          handleType: "input",
        },
      ],
    },
    {
      position: Position.Right,
      handles: [
        {
          id: "output",
          type: "source",
          handleType: "output",
        },
      ],
    },
    {
      position: Position.Top,
      handles: [
        {
          id: "context",
          type: "source",
          handleType: "artifact",
          label: "Context",
        },
      ],
    },
    {
      position: Position.Bottom,
      handles: [
        {
          id: "model",
          type: "source",
          handleType: "artifact",
          label: "Model",
        },
        {
          id: "escalations",
          type: "source",
          handleType: "artifact",
          label: "Escalations",
        },
        {
          id: "tools",
          type: "source",
          handleType: "artifact",
          label: "Tools",
        },
      ],
    },
  ];

  const agentNodeData: AgentNodeData = {
    ...data,
    shape: "rectangle",
    handleConfigurations: data.handleConfigurations || defaultHandleConfigurations,
  };

  return <BaseNode {...props} data={agentNodeData} />;
};

export const AgentNode = memo(AgentNodeComponent);
