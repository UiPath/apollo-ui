import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material/styles';
import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import token from '@uipath/apollo-core';
import React from 'react';
import { useChatState } from '../../../providers/chat-state-provider';
import { CHAT_RESOURCE_CHIP_MAX_WIDTH } from '../../../service/';
import { AutopilotChatActionButton } from '../../common/action-button';
import { AutopilotChatTooltip } from '../../common/tooltip';

const ChipContent = styled('span')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingMicro,
  padding: `0 ${token.Padding.PadS}`,
  backgroundColor: theme.palette.semantic.colorPrimaryLighter,
  color: theme.palette.semantic.colorForeground,
  borderRadius: `calc(${token.Border.BorderRadiusL} * 2)`,
  verticalAlign: 'middle',
  cursor: 'default',
  userSelect: 'none',
  maxWidth: CHAT_RESOURCE_CHIP_MAX_WIDTH,
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

const ResourceChipNodeViewInner: React.FC<NodeViewProps> = ({ node, deleteNode }) => {
  const { _ } = useLingui();
  const { spacing } = useChatState();
  const { label, icon } = node.attrs;
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

  const handleMouseEnter = React.useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = React.useCallback(() => setIsHovered(false), []);
  const handleFocus = React.useCallback(() => setIsFocused(true), []);
  const handleBlur = React.useCallback(() => setIsFocused(false), []);

  return (
    <NodeViewWrapper as="span">
      <ChipContent onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {icon && <ChipIcon>{icon}</ChipIcon>}
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
            onFocus={handleFocus}
            onBlur={handleBlur}
            data-testid="resource-chip-delete"
          />
        </ChipDeleteContainer>
      </ChipContent>
    </NodeViewWrapper>
  );
};

export const ResourceChipNodeView = React.memo(ResourceChipNodeViewInner);
