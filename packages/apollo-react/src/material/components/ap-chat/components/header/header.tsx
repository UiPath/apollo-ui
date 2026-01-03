import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { styled } from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';
import React from 'react';

import { StatusTypes } from '../../../../../types/statusTypes';
import { ApBadge } from '../../../ap-badge';
import { ApTypography } from '../../../ap-typography';
import AutopilotLogo from '../../assets/autopilot-logo.svg';
import { useChatState } from '../../providers/chat-state-provider';
import { AutopilotChatMode } from '../../service';
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
  const { disabledFeatures, overrideLabels, chatMode } = useChatState();

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
          {overrideLabels.title ??
            _(msg({ id: 'autopilot-chat.header.title', message: `Autopilot` }))}
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
