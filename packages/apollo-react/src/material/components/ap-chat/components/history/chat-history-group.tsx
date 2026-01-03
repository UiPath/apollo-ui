import { styled } from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';
import React from 'react';

import { ApTypography } from '../../../ap-typography';
import { useChatState } from '../../providers/chat-state-provider';
import type { ChatHistoryGroup } from './chat-history';
import { AutopilotChatHistoryItem } from './chat-history-item';

const GroupContainer = styled('div')<{ compactMode: boolean }>(({ compactMode }) => ({
  marginBottom: compactMode ? token.Spacing.SpacingXs : token.Spacing.SpacingBase,
}));

const GroupTitle = styled('h2')(() => ({
  '&&': {
    padding: `${token.Padding.PadXl} ${token.Padding.PadL}`,
    margin: `0 ${token.Spacing.SpacingBase}`,
  },
}));

interface AutopilotChatHistoryGroupProps {
  group: ChatHistoryGroup;
  isHistoryOpen: boolean;
}

const AutopilotChatHistoryGroupComponent: React.FC<AutopilotChatHistoryGroupProps> = ({
  group,
  isHistoryOpen,
}) => {
  const { spacing } = useChatState();

  return (
    <GroupContainer compactMode={spacing.compactMode}>
      <GroupTitle>
        <ApTypography variant={FontVariantToken.fontSizeSBold} color={'var(--color-foreground)'}>
          {group.title}
        </ApTypography>
      </GroupTitle>

      <div>
        {group.items.map((item) => (
          <AutopilotChatHistoryItem key={item.id} item={item} isHistoryOpen={isHistoryOpen} />
        ))}
      </div>
    </GroupContainer>
  );
};

export const AutopilotChatHistoryGroup = React.memo(AutopilotChatHistoryGroupComponent);
