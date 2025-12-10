import React from 'react';

import { Box } from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';

import { msg } from '@lingui/core/macro';
import { useLingui } from '@lingui/react';
import { useChatState } from '../../providers/chat-state-provider';

function AutopilotChatInputFooterComponent() {
    const { _ } = useLingui();
    const { overrideLabels } = useChatState();

    return (
        <Box sx={{ textAlign: 'center' }}>
            <ap-typography
                color={'var(--color-foreground-de-emp)'}
                variant={FontVariantToken.fontSizeXs}
            >
                {overrideLabels?.footerDisclaimer ?? _(msg({ id: 'autopilot-chat.input.footer', message: `AI can make mistakes. Check important info.` }))}
            </ap-typography>
        </Box>
    );
}

export const AutopilotChatInputFooter = React.memo(AutopilotChatInputFooterComponent);
