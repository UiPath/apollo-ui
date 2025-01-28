/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Box,
    styled,
} from '@mui/material';
import token from '@uipath/apollo-core/lib';
import React from 'react';

import { ApButtonReact } from '../../../ap-button/ap-button.react';
import { ApIconButtonReact } from '../../../ap-icon-button/ap-icon-button.react';
import { ApTooltipReact } from '../../../ap-tooltip/ap-tooltip.react';

interface AutopilotChatActionButtonProps {
    iconName: string;
    disabled?: boolean;
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
    preventHover?: boolean;
    overrideColor?: string;
    variant?: 'normal' | 'outlined' | 'custom';
    text?: string;
    tooltip?: string;
}

const StyledButtonContainer = styled('div')(() => ({
    '& .MuiButton-root': {
        background: 'transparent',
        color: 'var(--color-foreground)',
        fontFamily: token.FontFamily.FontLFamily,
        fontWeight: token.FontFamily.FontWeightDefault,
        fontSize: token.FontFamily.FontSSize,
        lineHeight: token.FontFamily.FontSLineHeight,
        fontStyle: 'normal',
        minWidth: '78px',

        '&:active': { backgroundColor: 'transparent !important' },
        '&:hover': {
            color: 'var(--color-foreground-emp)',
            backgroundColor: 'var(--color-icon-button-hover) !important',
        },
    },
}));

export function AutopilotChatActionButton({
    iconName, disabled, onClick, preventHover, overrideColor, variant = 'outlined', text, tooltip,
}: AutopilotChatActionButtonProps) {
    const [ iconColor, setIconColor ] = React.useState('var(--color-icon-default)');

    return text ? (
        <ApTooltipReact
            content={tooltip ?? ''}
        >
            <StyledButtonContainer>
                <ApButtonReact
                    {...(!preventHover && {
                        onMouseEnter: () => setIconColor('var(--color-foreground-emp)'),
                        onMouseLeave: () => setIconColor('var(--color-icon-default)'),
                    })}
                    startIcon={
                        <ap-icon
                            variant={variant}
                            size={token.Icon.IconM}
                            color={overrideColor ?? iconColor}
                            name={iconName}
                        />
                    }
                    variant="text"
                    size="small"
                    label={text}
                    onClick={onClick}
                />
            </StyledButtonContainer>
        </ApTooltipReact>
    ) : (
        <ApTooltipReact
            content={tooltip ?? ''}
        >
            <Box>
                <ApIconButtonReact
                    disabled={disabled}
                    color="secondary"
                    onClick={onClick}
                    {...(!preventHover && {
                        onMouseEnter: () => setIconColor('var(--color-foreground-emp)'),
                        onMouseLeave: () => setIconColor('var(--color-icon-default)'),
                    })}
                >
                    <ap-icon
                        variant={variant}
                        size={token.Icon.IconM}
                        color={overrideColor ?? iconColor}
                        name={iconName}
                    />
                </ApIconButtonReact>
            </Box>
        </ApTooltipReact>
    );
}
