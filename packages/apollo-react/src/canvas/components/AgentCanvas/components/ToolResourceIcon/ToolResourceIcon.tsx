import {
  BuiltInToolType,
  ProjectType,
  type SharedResourceData,
  type ToolResourceData,
} from 'packages/apollo-react/src/canvas/types';
import * as Icons from '@uipath/apollo-react/canvas/icons';
import { IxpIcon } from './IXPIcon';
import { ProcessIcon } from './ProcessIcon';
import { AttachmentIcon } from './AttachmentIcon';
import { AddDataColumnIcon } from './AddDataColumnIcon';
import { AnalyzeIcon } from './AnalyzeIcon';

interface ToolResourceIconProps {
  size?: number;
  tool: ToolResourceData & SharedResourceData;
}

/** Mapped icons from agents frontend-sw */
export const ToolResourceIcon = ({ size = 24, tool }: ToolResourceIconProps) => {
  if (tool.iconUrl) {
    return (
      <img
        src={tool.iconUrl}
        alt={tool.name}
        style={{ width: size, height: size, objectFit: 'contain' }}
      />
    );
  }

  switch (tool.projectType) {
    case ProjectType.Agent:
      return <Icons.AgentIcon w={size} h={size} />;
    case ProjectType.Api:
      return <Icons.ApiProject w={size} h={size} />;
    case ProjectType.IXP:
      return <IxpIcon />;
    case ProjectType.Internal: {
      switch (tool.toolType) {
        case BuiltInToolType.AnalyzeAttachments:
          return <AttachmentIcon />;
        case BuiltInToolType.BatchTransform:
          return <AddDataColumnIcon />;
        case BuiltInToolType.DeepRAG:
          return <AnalyzeIcon />;
        case BuiltInToolType.LoadAttachments:
          return <AttachmentIcon />;
        default:
          return <ProcessIcon />;
      }
    }
    default:
      return <ProcessIcon />;
  }
};
