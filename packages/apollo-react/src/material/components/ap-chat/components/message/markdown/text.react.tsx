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
    children, variant = FontVariantToken.fontSizeM, customStyle, headingLevel,
}: { children: React.ReactNode; variant?: FontVariantToken; customStyle?: React.CSSProperties; headingLevel?: number }) => {
    const theme = useTheme();

    return (
        <ap-typography
            variant={variant}
            color={theme.palette.semantic.colorForeground}
            style={{ ...customStyle }}
            {...(headingLevel ? {
                'role': 'heading',
                'aria-level': headingLevel,
            } : {})}
        >
            {children}
        </ap-typography>
    );
};

export const getTextForVariant = (variant: FontVariantToken, headingLevel?: number) => {
    return React.memo(({ children }: { children: React.ReactNode }) => Text({
        children,
        variant,
        headingLevel,
    }));
};

export const Break = React.memo(() => <br />);

export const Blockquote = React.memo(({ children }: { children: React.ReactNode }) => {
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
});

export const Emphazised = React.memo(({ children }: { children: React.ReactNode }) => {
    return Text({
        children: <em>{children}</em>,
        customStyle: { display: 'inline' },
    });
});

export const Strong = React.memo(({ children }: { children: React.ReactNode }) => {
    return Text({
        children: <strong>{children}</strong>,
        customStyle: { display: 'inline' },
    });
});

export const Del = React.memo(({ children }: { children: React.ReactNode }) => {
    return Text({
        children: <del>{children}</del>,
        customStyle: { display: 'inline' },
    });
});

export const Pre = React.memo(({ children }: { children: React.ReactNode }) => {
    return <Box component="pre" sx={{ margin: 0 }}>{children}</Box>;
});

export const Hr = React.memo(() => {
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
});

export const Link = React.memo(({
    href, children,
}: { href?: string; children: React.ReactNode }) => {
    return <ap-link href={href} target="_blank">{children}</ap-link>;
});
