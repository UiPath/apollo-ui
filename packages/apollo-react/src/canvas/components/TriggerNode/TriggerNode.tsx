import { Position, useStore } from '@uipath/apollo-react/canvas/xyflow/react';
import { memo, useCallback, useMemo, useState } from 'react';
import type { HandleGroupManifest } from '../../schema/node-definition';
import { CanvasIcon } from '../../utils/icon-registry';
import { areNodePropsEqualIgnoringPosition } from '../../utils/nodePropsEqual';
import { useConnectedHandles } from '../BaseCanvas/ConnectedHandlesContext';
import { useButtonHandles } from '../ButtonHandle/useButtonHandles';
import { CanvasTooltip } from '../CanvasTooltip';
import { TriggerBottomAdornment, TriggerContainer, TriggerIconWrapper } from './TriggerNode.styles';
import type { TriggerNodeProps } from './TriggerNode.types';

export function DefaultEntryPointIndicator() {
  return (
    <CanvasTooltip content="Default entry point" placement="bottom">
      <TriggerBottomAdornment aria-label="Default entry point">
        <CanvasIcon icon="star" size={14} fill="currentColor" />
      </TriggerBottomAdornment>
    </CanvasTooltip>
  );
}

const TriggerNodeComponent = (props: TriggerNodeProps) => {
  const { selected, id, details = {} } = props;
  const { tooltip, icon, status, isDefaultEntryPoint, bottomAdornment } = details;

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

      {bottomAdornment ? (
        <TriggerBottomAdornment>{bottomAdornment}</TriggerBottomAdornment>
      ) : isDefaultEntryPoint ? (
        <DefaultEntryPointIndicator />
      ) : null}

      {handleElements}
    </div>
  );
};

export const TriggerNode = memo(TriggerNodeComponent, areNodePropsEqualIgnoringPosition);
