/** @jsx React.createElement */
/** @jsxFrag React.Fragment */

import {
    Box,
    useTheme,
} from '@mui/material';
import token, { FontVariantToken } from '@uipath/apollo-core';
import React from 'react';

import { useChatState } from '../../../providers/chat-state-provider.react';
import { fontByVariant } from '../../../utils/font-by-variant';

// Create a context for typography variant
export const TypographyContext = React.createContext<FontVariantToken | undefined>(undefined);

export const Text = ({
    children, variant, customStyle, headingLevel,
}: { children: React.ReactNode; variant?: FontVariantToken; customStyle?: React.CSSProperties; headingLevel?: number }) => {
    const theme = useTheme();
    const { spacing } = useChatState();

    if (Array.isArray(children) && children.length === 1 && children[0] === '') {
        return null;
    }

    const roleInfo = (headingLevel ? {
        'role': 'heading',
        'aria-level': headingLevel,
    } : {});

    return (
        <TypographyContext.Provider value={variant ?? spacing.primaryFontToken}>
            <ap-typography
                variant={variant}
                color={theme.palette.semantic.colorForeground}
                style={{
                    maxWidth: 'fit-content',
                    ...customStyle,
                }}
                {...roleInfo}
            >
                <div
                    style={{ display: headingLevel ? 'flex' : 'inline' }}
                    {...roleInfo}
                >
                    {children}
                </div>
            </ap-typography>
        </TypographyContext.Provider>
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
    const { spacing } = useChatState();

    return (
        <Box
            component="blockquote"
            sx={{
                borderLeft: `6px solid ${theme.palette.semantic.colorBorder}`,
                padding: `${token.Spacing.SpacingBase} 0 ${token.Spacing.SpacingBase} ${token.Spacing.SpacingL}`,
                color: theme.palette.semantic.colorForegroundEmp,
                lineHeight: token.FontFamily.FontMicroLineHeight,
                display: 'flex',
                margin: 0,

                '& ap-typography': {
                    fontFamily: fontByVariant(spacing.markdownTokens.citation).fontFamily,
                    fontSize: fontByVariant(spacing.markdownTokens.citation).fontSize,
                    fontWeight: fontByVariant(spacing.markdownTokens.citation).fontWeight,
                    lineHeight: fontByVariant(spacing.markdownTokens.citation).lineHeight,
                },
            }}
        >
            {children}
        </Box>
    );
});

export const Emphazised = React.memo(({ children }: { children: React.ReactNode }) => {
    const parentVariant = React.useContext(TypographyContext);
    const { spacing } = useChatState();

    return Text({
        children: <em>{children}</em>,
        customStyle: { display: 'inline' },
        variant: parentVariant ?? spacing.primaryFontToken,
    });
});

export const Strong = React.memo(({ children }: { children: React.ReactNode }) => {
    const parentVariant = React.useContext(TypographyContext);
    const { spacing } = useChatState();

    return Text({
        children: <strong>{children}</strong>,
        customStyle: { display: 'inline' },
        variant: parentVariant ?? spacing.primaryFontToken,
    });
});

export const Del = React.memo(({ children }: { children: React.ReactNode }) => {
    const parentVariant = React.useContext(TypographyContext);
    const { spacing } = useChatState();

    return Text({
        children: <del>{children}</del>,
        customStyle: { display: 'inline' },
        variant: parentVariant ?? spacing.primaryFontToken,
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
    const parentVariant = React.useContext(TypographyContext);
    const { spacing } = useChatState();

    return (
        <Text
            variant={parentVariant ?? spacing.primaryFontToken}
            customStyle={{ display: 'inline' }}
        >
            <ap-link href={href} target="_blank" variant={FontVariantToken.fontSizeM}>{children}</ap-link>
        </Text>
    );
});
