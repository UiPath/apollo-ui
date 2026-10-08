import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { Box } from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
import { useChatState } from '@uipath/apollo-react/chat/headless/providers/chat-state-provider';
import { ApTypography } from '@uipath/apollo-react/material/components/ap-typography';
import React from 'react';

function AutopilotChatInputFooterComponent() {
  const { _ } = useLingui();
  const { overrideLabels } = useChatState();

  return (
    <Box sx={{ textAlign: 'center' }}>
      <ApTypography color={'var(--color-foreground-de-emp)'} variant={FontVariantToken.fontSizeXs}>
        {overrideLabels?.footerDisclaimer ??
          _(
            msg({
              id: 'autopilot-chat.input.footer',
              message: `AI can make mistakes. Check important info.`,
            })
          )}
      </ApTypography>
    </Box>
  );
}

export const AutopilotChatInputFooter = React.memo(AutopilotChatInputFooterComponent);
