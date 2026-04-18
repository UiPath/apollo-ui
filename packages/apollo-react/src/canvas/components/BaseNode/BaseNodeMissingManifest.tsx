import { NODE_ERROR_ICON_SIZE } from '../../constants';
import { CanvasIcon } from '../../utils';
import { BaseContainer } from './BaseNodeContainer';
import { BaseInnerShape } from './BaseNodeInnerShape';
import { NodeLabel } from './NodeLabel';

interface MissingManifestNodeProps {
  type?: string;
  isSelected?: boolean;
  isHovered?: boolean;
  interactionState?: string;
}

export const MissingManifestNode = ({
  type,
  isSelected,
  isHovered,
  interactionState,
}: MissingManifestNodeProps) => (
  <BaseContainer
    shape="square"
    isSelected={isSelected}
    isHovered={isHovered}
    interactionState={interactionState}
  >
    <BaseInnerShape>
      <CanvasIcon icon="circle-alert" size={NODE_ERROR_ICON_SIZE} color="var(--color-error-icon)" />
    </BaseInnerShape>
    <NodeLabel label="Manifest Undefined" subLabel={type} shape="square" readonly />
  </BaseContainer>
);
