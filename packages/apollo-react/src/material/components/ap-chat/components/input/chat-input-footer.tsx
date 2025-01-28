/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Box,
    useTheme,
} from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
// eslint-disable-next-line unused-imports/no-unused-imports
import React from 'react';

import { t } from '../../../../utils/localization/loc';

export const AutopilotChatInputFooter = () => {
    const theme = useTheme();

    return (
        <Box sx={{ textAlign: 'center' }}>
            <ap-typography
                color={theme.palette.semantic.colorForegroundDeEmp}
                variant={FontVariantToken.fontSizeXs}
            >
                {t('autopilot-chat-footer')}
            </ap-typography>
        </Box>
    );
};
