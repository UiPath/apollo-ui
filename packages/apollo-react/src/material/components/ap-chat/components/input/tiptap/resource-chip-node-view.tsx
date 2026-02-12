import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material/styles';
import { type NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import token, { Typography } from '@uipath/apollo-core';
import React from 'react';
import { useChatState } from '../../../providers/chat-state-provider';
import { CHAT_RESOURCE_CHIP_MAX_WIDTH } from '../../../service/';
import { fontByVariant } from '../../../utils/font-by-variant';
import { AutopilotChatActionButton } from '../../common/action-button';
import { AutopilotChatTooltip } from '../../common/tooltip';

const ChipContent = styled('span')<{ readonly?: boolean }>(({ readonly }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  padding: `0 ${token.Padding.PadS}`,
  backgroundColor: 'var(--color-primary-lighter)',
  color: 'var(--color-foreground)',
  borderRadius: `calc(${token.Border.BorderRadiusL} * 2)`,
  verticalAlign: 'middle',
  ...(!readonly && {
    cursor: 'default',
  }),
  maxWidth: CHAT_RESOURCE_CHIP_MAX_WIDTH,
  position: 'relative',
}));

const ChipIcon = styled('span')(() => ({
  fontFamily: '"Material Icons Outlined"',
  fontSize: token.Icon.IconXs,
  flexShrink: 0,
  userSelect: 'none',
}));

const ChipLabel = styled('span')(() => ({
  fontWeight: token.FontFamily.FontWeightSemibold,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  padding: `0 ${token.Padding.PadS}`,
}));

const ChipDeleteContainer = styled('span')<{ visible: boolean; compactMode: boolean }>(
  ({ visible, compactMode }) => ({
    opacity: visible ? 1 : 0,
    position: 'absolute',
    right: token.Spacing.SpacingMicro,
    top: '50%',
    transform: 'translateY(-50%)',
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--color-primary-lighter)',
    borderRadius: `calc(${token.Border.BorderRadiusL} * 2)`,
    transition: 'opacity 0.15s ease-in-out',

    '& .MuiButtonBase-root.MuiButtonBase-root': {
      height: compactMode ? token.Spacing.SpacingS : token.Spacing.SpacingM,
      width: compactMode ? token.Spacing.SpacingS : token.Spacing.SpacingM,
      padding: 0,
      minWidth: 'unset',
      borderRadius: `calc(${token.Border.BorderRadiusL} * 2)`,
    },
  })
);

interface ResourceChipBaseProps {
  label: string;
  icon?: string;
  readonly?: boolean;
  onDelete?: () => void;
}

const ResourceChipBaseInner: React.FC<ResourceChipBaseProps> = ({
  label,
  icon,
  readonly = false,
  onDelete,
}) => {
  const { _ } = useLingui();
  const { spacing } = useChatState();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleDelete = React.useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      onDelete?.();
    },
    [onDelete]
  );

  const handleMouseEnter = React.useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = React.useCallback(() => setIsHovered(false), []);
  const handleFocus = React.useCallback(() => setIsFocused(true), []);
  const handleBlur = React.useCallback(() => setIsFocused(false), []);

  return (
    <ChipContent
      readonly={readonly}
      {...(!readonly && {
        onMouseEnter: handleMouseEnter,
        onMouseLeave: handleMouseLeave,
      })}
    >
      {icon && <ChipIcon aria-hidden>{icon}</ChipIcon>}
      <AutopilotChatTooltip title={label} placement="top" disableInteractive>
        <ChipLabel>{label}</ChipLabel>
      </AutopilotChatTooltip>
      {onDelete && (
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
      )}
    </ChipContent>
  );
};

export const ResourceChipBase = React.memo(ResourceChipBaseInner);
ResourceChipBase.displayName = 'ResourceChipBase';

export const ResourceChipNodeView: React.FC<NodeViewProps> = React.memo(({ node, deleteNode }) => {
  const { label, icon } = node.attrs;
  const { spacing } = useChatState();
  const lineHeight =
    fontByVariant(spacing.primaryFontToken)?.lineHeight ?? Typography.fontSizeM.lineHeight;

  return (
    <NodeViewWrapper
      as="span"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: lineHeight,
        verticalAlign: 'top',
      }}
    >
      <ResourceChipBase label={label} icon={icon} onDelete={deleteNode} />
    </NodeViewWrapper>
  );
});
ResourceChipNodeView.displayName = 'ResourceChipNodeView';
