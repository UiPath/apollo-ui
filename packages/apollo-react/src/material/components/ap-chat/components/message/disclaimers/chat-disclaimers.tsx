import { styled } from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';
import React from 'react';

import { AppIcon } from '../../../../../../icons';
import { ApTypography } from '../../../../ap-typography';

const DisclaimerList = styled('div')(() => ({
  marginTop: token.Spacing.SpacingXl,
  display: 'flex',
  flexDirection: 'column',
  gap: token.Spacing.SpacingXs,
}));

const Disclaimer = styled('div')(() => ({
  display: 'flex',
  alignItems: 'flex-start',
  width: 'fit-content',
  gap: token.Spacing.SpacingXs,
  padding: token.Padding.PadL,
  backgroundColor: 'var(--color-warning-background)',
}));

function AutopilotChatDisclaimersComponent({ disclaimers }: { disclaimers: string[] }) {
  return (
    <DisclaimerList>
      {disclaimers.map((disclaimer, index) => (
        <Disclaimer key={disclaimer} data-cy={`autopilot-chat-disclaimer-nth-${index}`}>
          <AppIcon name="warning" color={'var(--color-warning-icon)'}></AppIcon>
          <ApTypography color={'var(--color-warning-text)'} variant={FontVariantToken.fontSizeM}>
            {disclaimer}
          </ApTypography>
        </Disclaimer>
      ))}
    </DisclaimerList>
  );
}

export const AutopilotChatDisclaimers = React.memo(AutopilotChatDisclaimersComponent);
