import React from 'react';

import { Box } from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';

import { t } from '../../../../utils/localization/loc';
import { useChatState } from '../../providers/chat-state-provider';

function AutopilotChatInputFooterComponent() {
    const { overrideLabels } = useChatState();

    return (
        <Box sx={{ textAlign: 'center' }}>
            <ap-typography
                color={'var(--color-foreground-de-emp)'}
                variant={FontVariantToken.fontSizeXs}
            >
                {overrideLabels?.footerDisclaimer ?? t('autopilot-chat-footer')}
            </ap-typography>
        </Box>
    );
}

export const AutopilotChatInputFooter = React.memo(AutopilotChatInputFooterComponent);
