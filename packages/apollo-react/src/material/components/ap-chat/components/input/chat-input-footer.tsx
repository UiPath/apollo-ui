import { Box } from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
import { useChatLabels } from '@uipath/apollo-react/chat/headless/hooks/use-chat-labels';
import { ApTypography } from '@uipath/apollo-react/material/components/ap-typography';
import React from 'react';

function AutopilotChatInputFooterComponent() {
  const { footerDisclaimer } = useChatLabels();

  return (
    <Box sx={{ textAlign: 'center' }}>
      <ApTypography color={'var(--color-foreground-de-emp)'} variant={FontVariantToken.fontSizeXs}>
        {footerDisclaimer}
      </ApTypography>
    </Box>
  );
}

export const AutopilotChatInputFooter = React.memo(AutopilotChatInputFooterComponent);
