import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material/styles';
import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import token from '@uipath/apollo-core';
import React from 'react';
import { useChatState } from '../../../providers/chat-state-provider';
import { AutopilotChatActionButton } from '../../common/action-button';
import { AutopilotChatTooltip } from '../../common/tooltip';

const ChipContent = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingMicro,
  padding: `0 ${token.Spacing.SpacingXs} 0 ${token.Spacing.SpacingMicro}`,
  backgroundColor: theme.palette.semantic.colorPrimaryLighter,
  color: theme.palette.semantic.colorForeground,
  borderRadius: `calc(${token.Border.BorderRadiusL} * 2)`,
  verticalAlign: 'middle',
  cursor: 'default',
  userSelect: 'none',
  maxWidth: '200px',
  position: 'relative',
}));

const ChipIcon = styled('span')(() => ({
  fontFamily: '"Material Icons Outlined"',
  fontSize: token.Icon.IconXs,
  flexShrink: 0,
}));

const ChipDisplayName = styled('span')(() => ({
  fontWeight: token.FontFamily.FontWeightSemibold,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

const ChipDeleteContainer = styled('span')<{ visible: boolean; compactMode: boolean }>(
  ({ visible, compactMode, theme }) => ({
    opacity: visible ? 1 : 0,
    position: 'absolute',
    right: token.Spacing.SpacingMicro,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: theme.palette.semantic.colorPrimaryLighter,
    borderRadius: `calc(${token.Border.BorderRadiusL} * 2)`,
    transition: 'opacity 0.15s ease-in-out',

    '& .MuiButtonBase-root': {
      height: compactMode ? token.Spacing.SpacingS : token.Spacing.SpacingM,
      width: compactMode ? token.Spacing.SpacingS : token.Spacing.SpacingM,
      padding: 0,
      minWidth: 'unset',
      borderRadius: `calc(${token.Border.BorderRadiusL} * 2)`,
    },
  })
);

export const ResourceChipNodeView: React.FC<NodeViewProps> = ({ node, deleteNode }) => {
  const { _ } = useLingui();
  const { spacing } = useChatState();
  const { id, label, icon = 'description' } = node.attrs;
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleDelete = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      deleteNode();
    },
    [deleteNode]
  );

  return (
    <NodeViewWrapper as="span">
      <ChipContent
        data-type="mention"
        data-id={id}
        data-label={label}
        data-icon={icon}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <ChipIcon>{icon}</ChipIcon>
        <AutopilotChatTooltip title={label} placement="top" disableInteractive>
          <ChipDisplayName>{label}</ChipDisplayName>
        </AutopilotChatTooltip>
        <ChipDeleteContainer visible={isHovered || isFocused} compactMode={spacing.compactMode}>
          <AutopilotChatActionButton
            iconSize={spacing.compactMode ? token.Icon.IconXxs : token.Icon.IconXs}
            iconName="close"
            tooltip={_(
              msg({
                id: 'autopilot-chat.common.attachments.remove-file',
                message: 'Remove',
              })
            )}
            ariaLabel={_(
              msg({
                id: 'autopilot-chat.common.attachments.remove-file-name',
                message: `Remove ${label}`,
              })
            )}
            onClick={handleDelete}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            data-testid="resource-chip-delete"
          />
        </ChipDeleteContainer>
      </ChipContent>
    </NodeViewWrapper>
  );
};
