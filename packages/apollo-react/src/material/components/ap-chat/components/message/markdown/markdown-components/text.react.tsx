/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Box,
    useTheme,
} from '@mui/material';
import { FontVariantToken } from '@uipath/apollo-core';
import token from '@uipath/apollo-core/lib';
import React from 'react';

export const Text = ({
    children, variant = FontVariantToken.fontSizeM, customStyle,
}: { children: React.ReactNode; variant?: FontVariantToken; customStyle?: React.CSSProperties }) => {
    const theme = useTheme();

    return (
        <ap-typography
            variant={variant}
            color={theme.palette.semantic.colorForeground}
            style={{ ...customStyle }}
        >
            {children}
        </ap-typography>
    );
};

export const getTextForVariant = (variant: FontVariantToken, customStyle?: React.CSSProperties) => {
    return ({ children }: { children: React.ReactNode }) => Text({
        children,
        variant,
        customStyle,
    });
};

export const Break = () => {
    return <br />;
};

export const Blockquote = ({ children }: { children: React.ReactNode }) => {
    const theme = useTheme();

    return (
        <Box
            component="blockquote"
            sx={{
                borderLeft: `4px solid ${theme.palette.semantic.colorBackgroundGray}`,
                margin: `${token.Spacing.SpacingXs} 0`,
                paddingLeft: token.Spacing.SpacingBase,
                color: theme.palette.semantic.colorForeground,
                fontStyle: 'italic',
                lineHeight: token.FontFamily.FontMicroLineHeight,
            }}
        >
            {children}
        </Box>
    );
};

export const Emphazised = ({ children }: { children: React.ReactNode }) => {
    return Text({ children: <em>{children}</em> });
};

export const Strong = ({ children }: { children: React.ReactNode }) => {
    return Text({ children: <strong>{children}</strong> });
};

export const Del = ({ children }: { children: React.ReactNode }) => {
    return Text({ children: <del>{children}</del> });
};

export const Hr = () => {
    const theme = useTheme();

    return (
        <Box
            component="hr"
            sx={{
                border: 'none',
                borderTop: `1px solid ${theme.palette.semantic.colorForeground}`,
                width: '100%',
                margin: 0,
            }}
        />
    );
};
