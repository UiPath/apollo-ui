import { Position, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useState } from 'react';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { CanvasIcon } from '../../utils/icon-registry';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import { useButtonHandles } from '../ButtonHandle/useButtonHandles';
import { CanvasTooltip } from '../CanvasTooltip';
import { TriggerContainer, TriggerIconWrapper } from './TriggerNode.styles';
import type { TriggerNodeProps } from './TriggerNode.types';

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

  const handleConfigurations: HandleGroupManifest[] = [
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
      <TriggerIconWrapper status={status}>{icon || <CanvasIcon icon="zap" />}</TriggerIconWrapper>
    </TriggerContainer>
  );

  return (
    <div
      style={{ width: '100%', height: '100%', position: 'relative' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {tooltip ? (
        <CanvasTooltip content={tooltip} placement="top">
          {triggerContent}
        </CanvasTooltip>
      ) : (
        triggerContent
      )}

      {handleElements}
    </div>
  );
};

export const TriggerNode = memo(TriggerNodeComponent);
