/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

// eslint-disable-next-line unused-imports/no-unused-imports
import {
    styled,
    useTheme,
} from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
import token from '@uipath/apollo-core/lib';
import { AutopilotChatMode } from '@uipath/portal-shell-util';
import React from 'react';

import { StatusTypes } from '../../../../models/statusTypes';
import { t } from '../../../../utils/localization/loc';
import AutopilotLogo from '../../assets/autopilot-logo.svg';
import { useChatState } from '../../providers/chat-state-provider.react';
import { AutopilotChatHeaderActions } from './header-actions.react';

const StyledHeader = styled('div')<{ showSeparator: boolean }>(({ showSeparator }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...(showSeparator && {
        margin: '0 -20px -16px -20px',
        paddingLeft: '20px',
        paddingBottom: token.Spacing.SpacingMicro,
        paddingRight: '20px',
        borderBottom: '1px solid var(--color-border-de-emp)',
    }),
}));

const StyledLogo = styled('div')(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: token.Spacing.SpacingXs,
}));

function AutopilotChatHeaderComponent() {
    const theme = useTheme();
    const {
        disabledFeatures,
        overrideLabels,
        chatMode,
    } = useChatState();

    const showSeparator = !(disabledFeatures as any).headerSeparator;

    return (
        <StyledHeader showSeparator={showSeparator}>
            <StyledLogo>
                {/* cannot directly use the svg as a component, throws error that the svg is not a valid react component */}
                {chatMode === AutopilotChatMode.FullScreen ? (
                    <span dangerouslySetInnerHTML={{ __html: AutopilotLogo }} />
                ) : null}

                <ap-typography variant={FontVariantToken.fontBrandL} color={theme.palette.semantic.colorForeground}>
                    {overrideLabels.title ?? t('autopilot-chat-header')}
                </ap-typography>

                {!disabledFeatures.preview && (
                    <ap-badge label={t('autopilot-chat-header-preview')} status={StatusTypes.INFO}></ap-badge>
                )}
            </StyledLogo>

            <AutopilotChatHeaderActions />
        </StyledHeader>
    );
}

export const AutopilotChatHeader = React.memo(AutopilotChatHeaderComponent);
