/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

// eslint-disable-next-line unused-imports/no-unused-imports
import {
    styled,
    useTheme,
} from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { StatusTypes } from '../../../../models/statusTypes';
import { t } from '../../../../utils/localization/loc';
import AutopilotLogo from '../../assets/autopilot-logo.svg';
import { AutopilotChatHeaderActions } from './header-actions.react';

const StyledHeader = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
}));

const StyledLogo = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingXs,
}));

function AutopilotChatHeaderComponent() {
    const theme = useTheme();

    return (
        <StyledHeader>
            <StyledLogo>
                {/* cannot directly use the svg as a component, throws error that the svg is not a valid react component */}
                <span dangerouslySetInnerHTML={{ __html: AutopilotLogo }} />

                <ap-typography variant={FontVariantToken.fontBrandL} color={theme.palette.semantic.colorForeground}>
                    {t('autopilot-chat-header')}
                </ap-typography>

                <ap-badge label={t('autopilot-chat-header-preview')} status={StatusTypes.INFO}></ap-badge>
            </StyledLogo>

            <AutopilotChatHeaderActions />
        </StyledHeader>
    );
}

export const AutopilotChatHeader = React.memo(AutopilotChatHeaderComponent);
