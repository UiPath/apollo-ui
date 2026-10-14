import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';
import { AutopilotLogo } from '@uipath/apollo-react/chat/assets/autopilot-logo';
import { useChatLabels } from '@uipath/apollo-react/chat/headless/hooks/use-chat-labels';
import { useChatState } from '@uipath/apollo-react/chat/headless/providers/chat-state-provider';
import { AutopilotChatMode } from '@uipath/apollo-react/chat/service';
import { ApBadge } from '@uipath/apollo-react/material/components/ap-badge';
import { ApTypography } from '@uipath/apollo-react/material/components/ap-typography';
import React from 'react';
import { StatusTypes } from '../../../../../types/statusTypes';
import { AutopilotChatHeaderActions } from './header-actions';

const StyledHeader = styled('div')<{ hideSeparator?: boolean }>(({ hideSeparator }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  ...(!hideSeparator && {
    margin: `0 -${token.Spacing.SpacingBase} -${token.Spacing.SpacingBase}`,
    paddingLeft: token.Spacing.SpacingBase,
    paddingBottom: token.Spacing.SpacingMicro,
    paddingRight: token.Spacing.SpacingBase,
    borderBottom: '1px solid var(--color-border-de-emp)',
  }),
}));

const StyledLogo = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  gap: token.Spacing.SpacingXs,
}));

function AutopilotChatHeaderComponent() {
  const { _ } = useLingui();
  const { disabledFeatures, chatMode } = useChatState();
  const { title } = useChatLabels();

  return (
    <StyledHeader hideSeparator={disabledFeatures.headerSeparator}>
      <StyledLogo>
        {chatMode === AutopilotChatMode.FullScreen ? <AutopilotLogo /> : null}

        <ApTypography
          variant={FontVariantToken.fontBrandL}
          color={'var(--color-foreground)'}
          role="heading"
          aria-level={1}
        >
          {title}
        </ApTypography>

        {!disabledFeatures.preview && (
          <ApBadge
            label={_(msg({ id: 'autopilot-chat.header.preview', message: `Preview` }))}
            status={StatusTypes.INFO}
          />
        )}
      </StyledLogo>

      <AutopilotChatHeaderActions />
    </StyledHeader>
  );
}

export const AutopilotChatHeader = React.memo(AutopilotChatHeaderComponent);
