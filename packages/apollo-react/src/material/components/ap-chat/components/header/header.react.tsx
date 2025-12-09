import React from 'react';

import {
  styled,
  useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';

import { StatusTypes } from '../../../../models/statusTypes';
import { t } from '../../../../utils/localization/loc';
import AutopilotLogo from '../../assets/autopilot-logo.svg';
import { useChatState } from '../../providers/chat-state-provider.react';
import { AutopilotChatMode } from '../../service';
import { AutopilotChatHeaderActions } from './header-actions.react';

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
    const theme = useTheme();
    const {
        disabledFeatures,
        overrideLabels,
        chatMode,
    } = useChatState();

    return (
        <StyledHeader hideSeparator={disabledFeatures.headerSeparator}>
            <StyledLogo>
                {/* cannot directly use the svg as a component, throws error that the svg is not a valid react component */}
                {chatMode === AutopilotChatMode.FullScreen ? (
                    <span dangerouslySetInnerHTML={{ __html: AutopilotLogo }} />
                ) : null}

                <ap-typography
                    variant={FontVariantToken.fontBrandL}
                    color={theme.palette.semantic.colorForeground}
                    role='heading'
                    aria-level={1}
                >
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
