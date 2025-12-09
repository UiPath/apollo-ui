import {
    Box,
    useTheme,
} from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
// eslint-disable-next-line unused-imports/no-unused-imports
import React from 'react';

import { t } from '../../../../utils/localization/loc';
import { useChatState } from '../../providers/chat-state-provider.react';

function AutopilotChatInputFooterComponent() {
    const theme = useTheme();
    const { overrideLabels } = useChatState();

    return (
        <Box sx={{ textAlign: 'center' }}>
            <ap-typography
                color={theme.palette.semantic.colorForegroundDeEmp}
                variant={FontVariantToken.fontSizeXs}
            >
                {overrideLabels?.footerDisclaimer ?? t('autopilot-chat-footer')}
            </ap-typography>
        </Box>
    );
}

export const AutopilotChatInputFooter = React.memo(AutopilotChatInputFooterComponent);
