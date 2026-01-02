import { memo, useMemo, useState, useCallback } from 'react';
import { Position, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { TriggerContainer, TriggerIconWrapper } from './TriggerNode.styles';
import type { TriggerNodeProps } from './TriggerNode.types';
import { ApIcon, ApTooltip } from '@uipath/apollo-react/material/components';
import type { HandleConfiguration } from '../BaseNode';
import { useButtonHandles } from '../ButtonHandle/useButtonHandles';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';

const TriggerNodeComponent = (props: TriggerNodeProps) => {
  const { selected, id, details = {} } = props;
  const { tooltip, icon, status } = details;

  const [isHovered, setIsHovered] = useState(false);

  const isConnecting = useStore((state) => !!state.connectionClickStartHandle);
  const connectedHandleIds = useConnectedHandles(id);
  const hasConnections = connectedHandleIds.size > 0;

  const shouldShowHandles = useMemo(() => {
    return selected || isHovered || isConnecting || hasConnections;
  }, [selected, isHovered, isConnecting, hasConnections]);

  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => setIsHovered(false), []);

  const handleConfigurations: HandleConfiguration[] = [
    {
      position: Position.Right,
      handles: [
        {
          id: `${id}____source____right`,
          type: 'source',
          handleType: 'output',
        },
      ],
      visible: selected || isHovered || isConnecting,
    },
  ];
  const handleElements = useButtonHandles({
    handleConfigurations,
    shouldShowHandles,
    nodeId: id,
    selected,
  });

  const triggerContent = (
    <TriggerContainer selected={!!selected} status={status}>
      <TriggerIconWrapper status={status}>
        {icon || <ApIcon name="bolt" variant="outlined" size="30px" />}
      </TriggerIconWrapper>
    </TriggerContainer>
  );

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {tooltip ? (
        <ApTooltip content={tooltip} placement="top" style={{ width: '100%', height: '100%' }}>
          {triggerContent}
        </ApTooltip>
      ) : (
        triggerContent
      )}

      {handleElements}
    </div>
  );
};

export const TriggerNode = memo(TriggerNodeComponent);
